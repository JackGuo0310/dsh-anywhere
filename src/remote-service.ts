import { networkInterfaces } from 'node:os'
import { assertSafeConfig, type RemoteAccessConfig } from './config.js'
import { FrpTunnelProvider } from './tunnel/frp.js'
import { CustomCommandTunnelProvider } from './tunnel/custom-command.js'
import type { TunnelProvider } from './tunnel/types.js'
import { RemoteGateway } from './gateway/remote-gateway.js'
import { detectTailscale } from './network/tailscale.js'
import { hashPassword } from './security/password.js'
import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

type Credentials = {
  resolve(ref: string): Promise<{ value: string } | undefined>
  describe(ref: string): Promise<{ configured: boolean, source?: string, writable: boolean }>
  set(ref: string, value: string): Promise<void>
}

type PasswordChangeRequest = { currentPassword?: unknown, newPassword?: unknown }
type FullConfigRequest = { config?: unknown, secrets?: unknown }
type ConfigEditorEntry = { options?: { id?: string, name?: string } }
type ConfigEditor = {
  entries(): ConfigEditorEntry[]
  edit(entry: ConfigEditorEntry, change: (current: Record<string, unknown>, inherited: Record<string, unknown>) => Record<string, unknown>): Promise<void>
}

function redactConfig(config: RemoteAccessConfig) {
  return {
    ...config,
    frp: config.frp ? { ...config.frp } : undefined,
    tunnel: config.frp ? 'frp' : config.customCommandEnabled ? 'custom-command' : undefined,
  }
}

function objectOf(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configuration must be an object.')
  return value as Record<string, unknown>
}

function optionalSecret(value: unknown): string | undefined {
  return typeof value === 'string' && value.length ? value : undefined
}

function lanAddresses(): string[] {
  const addresses: string[] = []
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (!entry.internal && entry.family === 'IPv4') addresses.push(entry.address)
    }
  }
  return [...new Set(addresses)]
}

/** Host RPC surface. It never returns passwords, password hashes, tokens, or credential references. */
export class RemoteAccessService extends TypertRemoteService {
  private gateway: RemoteGateway | undefined
  private tunnel: TunnelProvider | undefined

  constructor(ctx: Context, private readonly config: RemoteAccessConfig) {
    super(ctx, 'dshRemoteAccess', { namespace: 'dshRemoteAccess' })
  }

  async start(): Promise<void> {
    if (this.gateway) throw new Error('Remote gateway is already running.')
    const passwordHash = await this.loadPasswordHash()
    const gateway = new RemoteGateway(this.config, passwordHash)
    try {
      await gateway.start()
      this.gateway = gateway
      this.tunnel = await this.createTunnel()
      if (this.tunnel && this.config.frp?.startWithDsh) await this.tunnel.start()
    } catch (error) {
      try { await this.stop() } catch { /* Preserve the startup failure. */ }
      try { await gateway.stop() } catch { /* Preserve the startup failure. */ }
      throw error
    }
  }

  async stop(): Promise<void> {
    const tunnel = this.tunnel
    this.tunnel = undefined
    const gateway = this.gateway
    this.gateway = undefined
    try { await tunnel?.stop() } finally { await gateway?.stop() }
  }

  @Remote('status')
  async status(): Promise<unknown> {
    const passwordHash = this.gateway?.passwordRecord() ?? await this.loadPasswordHash()
    return {
      configured: redactConfig(this.config),
      running: !!this.gateway,
      administratorConfigured: !!passwordHash,
      tunnel: this.tunnel ? { id: this.tunnel.id, ...this.tunnel.status() } : undefined,
    }
  }

  @Remote('saveCommonConfig')
  async saveConfig(request: FullConfigRequest): Promise<unknown> {
    const submitted = objectOf(request?.config)
    const secrets = objectOf(request?.secrets ?? {})
    const administratorConfigured = !!(await this.loadPasswordHash())
    const next = assertSafeConfig({ ...submitted, version: this.config.version, adminConfigured: administratorConfigured })
    const secretWrites: Array<[string | undefined, string | undefined]> = [
      [next.frp?.tokenSecretRef, optionalSecret(secrets.frpToken)],
      [next.frp?.stcpSecretRef, optionalSecret(secrets.stcpSecret)],
    ]
    for (const [ref, value] of secretWrites) if (ref && value) await this.credentials().set(ref, value)
    const editor = this.ctx.get('configEditor') as ConfigEditor | undefined
    if (!editor) throw new Error('DSH configuration editor is unavailable.')
    const entry = editor.entries().find((item) => item.options?.id === 'dsh-remote-access' || item.options?.name === '@dsh-community/dsh-remote-access')
    if (!entry) throw new Error('Remote access configuration entry was not found.')
    await editor.edit(entry, () => ({ ...next }))
    return { saved: true, secretsUpdated: secretWrites.filter(([ref, value]) => ref && value).length }
  }

  @Remote('secretStatus')
  async secretStatus(): Promise<unknown> {
    const credentials = this.credentials()
    const refs = {
      administrator: this.config.adminPasswordSecretRef,
      frpToken: this.config.frp?.tokenSecretRef,
      stcpSecret: this.config.frp?.stcpSecretRef,
    }
    const result: Record<string, unknown> = {}
    for (const [key, ref] of Object.entries(refs)) result[key] = ref ? await credentials.describe(ref) : { configured: false, writable: true }
    return result
  }

  @Remote('discoverNetwork')
  async discoverNetwork(): Promise<unknown> {
    return { lanIpv4: lanAddresses(), gatewayPort: this.config.listenPort }
  }

  @Remote('detectTailscale')
  async detectTailscale(): Promise<unknown> {
    return detectTailscale()
  }

  @Remote('startTunnel')
  async startTunnel(): Promise<unknown> {
    if (!this.tunnel) throw new Error('No tunnel provider is configured.')
    return { id: this.tunnel.id, ...(await this.tunnel.start()) }
  }

  @Remote('restartTunnel')
  async restartTunnel(): Promise<unknown> {
    if (!this.tunnel) throw new Error('No tunnel provider is configured.')
    return { id: this.tunnel.id, ...(await this.tunnel.restart()) }
  }

  @Remote('changePassword')
  async changePassword(request: PasswordChangeRequest): Promise<unknown> {
    if (!this.config.adminPasswordSecretRef) throw new Error('Administrator password credential reference is not configured.')
    if (!request || typeof request.newPassword !== 'string') throw new Error('A new administrator password is required.')
    const storedHash = await this.loadPasswordHash()
    const runtimeHash = this.gateway?.passwordRecord()
    const initializing = !storedHash && !runtimeHash
    if (!initializing && !this.gateway) throw new Error('Gateway is not running. Start it before changing the administrator password.')
    if (!initializing && typeof request.currentPassword !== 'string') throw new Error('The current administrator password is required.')

    if (initializing) {
      const nextHash = await hashPassword(request.newPassword)
      await this.credentials().set(this.config.adminPasswordSecretRef, nextHash)
      return { changed: true, initialized: true, sessionsRevoked: false }
    }

    const nextHash = await this.gateway!.changeAdminPassword(request.currentPassword as string, request.newPassword)
    try {
      await this.credentials().set(this.config.adminPasswordSecretRef, nextHash)
    } catch (error) {
      // Do not leave a runtime-only password after credential persistence fails.
      await this.stop()
      throw error
    }
    return { changed: true, initialized: false, sessionsRevoked: true }
  }

  @Remote('revokeAllSessions')
  async revokeAllSessions(): Promise<unknown> {
    if (!this.gateway) throw new Error('Gateway is not running.')
    this.gateway.revokeAllSessions()
    return { revoked: true }
  }

  private async createTunnel(): Promise<TunnelProvider | undefined> {
    if (this.config.frp) {
      const token = await this.resolveCredential(this.config.frp.tokenSecretRef)
      const stcpSecret = await this.resolveCredential(this.config.frp.stcpSecretRef)
      if (this.config.frp.authMethod === 'token' && !token) throw new Error('FRP token credential could not be resolved.')
      if (this.config.frp.transport === 'stcp' && !stcpSecret) throw new Error('STCP secret credential could not be resolved.')
      return new FrpTunnelProvider({ target: this.config.target, frp: this.config.frp, token, stcpSecret })
    }
    if (this.config.customCommandEnabled && this.config.customCommand) {
      return new CustomCommandTunnelProvider(this.config.customCommand.command, this.config.customCommand.args, true)
    }
    return undefined
  }

  private credentials(): Credentials {
    const credentials = this.ctx.get('credentials') as Credentials | undefined
    if (!credentials) throw new Error('DSH credentials service is required when a secret reference is configured.')
    return credentials
  }

  private async resolveCredential(ref: string | undefined): Promise<string | undefined> {
    if (!ref) return undefined
    return (await this.credentials().resolve(ref))?.value
  }

  private async loadPasswordHash(): Promise<string | undefined> {
    return this.resolveCredential(this.config.adminPasswordSecretRef)
  }
}
