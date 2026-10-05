import { networkInterfaces } from 'node:os'
import type { RemoteAccessConfig } from './config.js'
import { FrpTunnelProvider } from './tunnel/frp.js'
import { CustomCommandTunnelProvider } from './tunnel/custom-command.js'
import type { TunnelProvider } from './tunnel/types.js'
import { RemoteGateway } from './gateway/remote-gateway.js'
import { detectTailscale } from './network/tailscale.js'
import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

type Credentials = {
  resolve(ref: string): Promise<{ value: string } | undefined>
}

function redactConfig(config: RemoteAccessConfig) {
  return {
    enabled: config.enabled,
    mode: config.mode,
    listenHost: config.listenHost,
    listenPort: config.listenPort,
    target: config.target,
    publicBaseUrl: config.publicBaseUrl,
    adminConfigured: config.adminConfigured,
    tunnel: config.frp ? 'frp' : config.customCommandEnabled ? 'custom-command' : undefined,
  }
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
    const passwordHash = await this.loadPasswordHash()
    this.gateway = new RemoteGateway(this.config, passwordHash)
    await this.gateway.start()
    try {
      this.tunnel = await this.createTunnel()
      if (this.tunnel && this.config.frp?.startWithDsh) await this.tunnel.start()
    } catch (error) {
      await this.gateway.stop()
      this.gateway = undefined
      throw error
    }
  }

  async stop(): Promise<void> {
    const tunnel = this.tunnel
    this.tunnel = undefined
    await tunnel?.stop()
    const gateway = this.gateway
    this.gateway = undefined
    await gateway?.stop()
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

  @Remote('revokeAllSessions')
  async revokeAllSessions(): Promise<unknown> {
    if (!this.gateway) throw new Error('Gateway is not running.')
    this.gateway.revokeAllSessions()
    return { revoked: true }
  }

  private async createTunnel(): Promise<TunnelProvider | undefined> {
    if (this.config.frp) {
      const token = await this.resolveCredential(this.config.frp.tokenSecretRef)
      return new FrpTunnelProvider({ target: this.config.target, frp: this.config.frp, token })
    }
    if (this.config.customCommandEnabled && this.config.customCommand) {
      return new CustomCommandTunnelProvider(this.config.customCommand.command, this.config.customCommand.args, true)
    }
    return undefined
  }

  private async resolveCredential(ref: string | undefined): Promise<string | undefined> {
    if (!ref) return undefined
    const credentials = this.ctx.get('credentials') as Credentials | undefined
    if (!credentials) throw new Error('DSH credentials service is required when a secret reference is configured.')
    return (await credentials.resolve(ref))?.value
  }

  private async loadPasswordHash(): Promise<string | undefined> {
    return this.resolveCredential(this.config.adminPasswordSecretRef)
  }
}
