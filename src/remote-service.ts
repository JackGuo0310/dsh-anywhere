import { networkInterfaces } from 'node:os'
import type { RemoteAccessConfig } from './config.js'
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

  constructor(ctx: Context, private readonly config: RemoteAccessConfig) {
    super(ctx, 'dshRemoteAccess', { namespace: 'dshRemoteAccess' })
  }

  async start(): Promise<void> {
    if (!this.config.enabled) return
    const passwordHash = await this.loadPasswordHash()
    this.gateway = new RemoteGateway(this.config, passwordHash)
    await this.gateway.start()
  }

  async stop(): Promise<void> {
    const gateway = this.gateway
    this.gateway = undefined
    await gateway?.stop()
  }

  @Remote('status')
  async status(): Promise<unknown> {
    return {
      configured: redactConfig(this.config),
      running: !!this.gateway,
      administratorConfigured: !!this.gateway?.passwordRecord(),
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

  @Remote('revokeAllSessions')
  async revokeAllSessions(): Promise<unknown> {
    if (!this.gateway) throw new Error('Gateway is not running.')
    this.gateway.revokeAllSessions()
    return { revoked: true }
  }

  private async loadPasswordHash(): Promise<string | undefined> {
    const ref = this.config.adminPasswordSecretRef
    if (!ref) return undefined
    const credentials = this.ctx.get('credentials') as Credentials | undefined
    if (!credentials) throw new Error('DSH credentials service is required when adminPasswordSecretRef is configured.')
    const resolved = await credentials.resolve(ref)
    return resolved?.value
  }
}
