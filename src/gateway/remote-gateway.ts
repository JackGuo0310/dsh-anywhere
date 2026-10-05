import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { URL } from 'node:url'
import type { RemoteAccessConfig } from '../config.js'
import { AuthService } from '../security/auth.js'
import { hostAllowed, originAllowed } from '../security/request-policy.js'
import { proxyHttp, bridgeWebSocket } from './proxy.js'

const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'cache-control': 'no-store'
}

export class RemoteGateway {
  private server: Server | undefined
  private readonly auth: AuthService
  private readonly allowedAuthorities: string[]

  constructor(private readonly config: RemoteAccessConfig, passwordHash?: string) {
    const publicAuthority = config.publicBaseUrl ? new URL(config.publicBaseUrl).host.toLowerCase() : undefined
    this.allowedAuthorities = [...new Set([`${config.listenHost}:${config.listenPort}`.toLowerCase(), publicAuthority].filter(Boolean) as string[])]
    this.auth = new AuthService({
      passwordHash,
      sessionTtlMinutes: config.sessionTtlMinutes,
      secureCookie: config.mode === 'tunnel',
      trustedProxies: config.trustedProxyCidrs
    })
  }

  async start(): Promise<void> {
    if (this.server) return
    if (!this.auth.configured) throw new Error('Remote gateway cannot start until an administrator password hash is provisioned.')
    this.server = createServer((req, res) => this.handle(req, res))
    this.server.on('upgrade', (req, socket, head) => this.handleUpgrade(req, socket, head))
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject)
      this.server!.listen(this.config.listenPort, this.config.listenHost, () => {
        this.server!.off('error', reject)
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    const server = this.server
    this.server = undefined
    if (!server) return
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }

  async bootstrapAdmin(password: string): Promise<void> { await this.auth.bootstrap(password) }
  passwordRecord(): string | undefined { return this.auth.passwordRecord() }
  revokeAllSessions(): void { this.auth.revokeAll() }

  private writeSecurity(res: ServerResponse): void { for (const [key, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(key, value) }
  private json(res: ServerResponse, status: number, body: unknown): void {
    this.writeSecurity(res)
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(body))
  }

  private async readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
    const limit = this.config.maxRequestBodyBytes
    let bytes = 0
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      bytes += buffer.length
      if (bytes > limit) throw new Error('Request body exceeds configured limit.')
      chunks.push(buffer)
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected an object body.')
    return parsed as Record<string, unknown>
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    this.writeSecurity(res)
    if (!hostAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs)) return this.json(res, 421, { error: 'Unrecognized Host header.' })
    const pathname = new URL(req.url ?? '/', 'http://gateway.invalid').pathname
    if (pathname === '/_dsh_remote/health') return this.json(res, 200, { status: 'ok' })
    if (pathname === '/_dsh_remote/login' && req.method === 'POST') {
      if (!originAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs)) return this.json(res, 403, { error: 'Origin check failed.' })
      try {
        const body = await this.readJson(req)
        const login = await this.auth.login(String(body.username ?? ''), String(body.password ?? ''), req)
        if (!login.ok) return this.json(res, 429, { error: 'Invalid credentials or too many attempts.', retryAfterSeconds: login.retryAfterSeconds })
        this.auth.setSessionCookie(res, login.session!.id)
        return this.json(res, 200, { csrfToken: login.session!.csrfToken })
      } catch (error) { return this.json(res, 400, { error: error instanceof Error ? error.message : 'Invalid request.' }) }
    }
    if (pathname === '/_dsh_remote/logout' && req.method === 'POST') {
      if (!originAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs) || !this.auth.requireCsrf(req)) return this.json(res, 403, { error: 'CSRF check failed.' })
      this.auth.logout(req, res)
      return this.json(res, 204, {})
    }
    if (!this.auth.requireSession(req)) return this.json(res, 401, { error: 'Login required.' })
    proxyHttp(req, res, this.config.target)
  }

  private handleUpgrade(req: IncomingMessage, socket: import('node:stream').Duplex, head: Buffer): void {
    if (!hostAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs) || !this.auth.requireSession(req)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n')
      socket.destroy()
      return
    }
    bridgeWebSocket(socket, head, req, this.config.target)
  }
}
