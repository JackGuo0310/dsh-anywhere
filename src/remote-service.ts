
import { assertSafeConfig, resolveBindAddresses, type RemoteAccessConfig } from './config.js'
import { FrpTunnelProvider } from './tunnel/frp.js'
import { CustomCommandTunnelProvider } from './tunnel/custom-command.js'
import type { TunnelProvider } from './tunnel/types.js'
import { reconcileGateway, releaseGateway, shutdownGateway } from './gateway/host.js'
import type { RemoteGateway } from './gateway/remote-gateway.js'
import { detectTailscale } from './network/tailscale.js'
import { hashPassword } from './security/password.js'
import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

type ConnectionAuth = { authenticatedUrl(baseUrl: string): string }

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



/** Host RPC surface. It never returns passwords, password hashes, tokens, or credential references. */
export class RemoteAccessService extends TypertRemoteService {
  private gateway: RemoteGateway | undefined
  private tunnel: TunnelProvider | undefined

  constructor(ctx: Context, private readonly config: RemoteAccessConfig) {
    super(ctx, 'dshRemoteAccess', { namespace: 'dshRemoteAccess' })
  }

  async start(): Promise<void> {
    const passwordHash = await this.loadPasswordHash()
    const connection = this.ctx.get('connection') as ConnectionAuth | undefined
    if (!connection) throw new Error('DSH Connection service is required to authenticate upstream browser requests.')
    const authenticatedUrl = () => connection.authenticatedUrl(`${this.config.target.protocol}://${this.config.target.host}:${this.config.target.port}/`)
    // The gateway outlives a configuration remount; only the addresses that changed rebind.
    this.gateway = await reconcileGateway(this.config, passwordHash, authenticatedUrl)
    try {
      this.tunnel = await this.createTunnel()
      if (this.tunnel && (this.config.frp?.startWithDsh || this.config.customCommandEnabled)) await this.tunnel.start()
    } catch (error) {
      try { await this.stop() } catch { /* Preserve the startup failure. */ }
      throw error
    }
  }

  /** The plugin was disposed: stop managed children now, but let a remount re-adopt the gateway. */
  release(): void {
    const tunnel = this.tunnel
    this.tunnel = undefined
    this.gateway = undefined
    void tunnel?.stop()
    releaseGateway()
  }

  async stop(): Promise<void> {
    const tunnel = this.tunnel
    this.tunnel = undefined
    this.gateway = undefined
    try { await tunnel?.stop() } finally { await shutdownGateway() }
  }

  @Remote('status')
  async status(): Promise<unknown> {
    const passwordHash = this.gateway?.passwordRecord() ?? await this.loadPasswordHash()
    return {
      configured: redactConfig(this.config),
      running: !!this.gateway,
      bound: this.gateway?.boundAuthorities() ?? [],
      addresses: this.gateway?.listenAddresses() ?? [],
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
    // Report exactly what the LAN listener would bind, so the UI cannot drift from the gateway.
    const lanIpv4 = resolveBindAddresses({ ...this.config, listeners: { local: false, lan: true, tailscale: false } })
      .filter((address) => address !== '127.0.0.1')
    return { lanIpv4, gatewayPort: this.config.listenPort }
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
      return new FrpTunnelProvider({ gatewayTarget: { host: '127.0.0.1', port: this.config.listenPort }, frp: this.config.frp, token, stcpSecret })
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
