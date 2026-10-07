import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { URL } from 'node:url'
import { isWildcardListenHost, type RemoteAccessConfig } from '../config.js'
import { AuthService } from '../security/auth.js'
import { hostAllowed, originAllowed, proxyWriteAllowed, websocketOriginAllowed } from '../security/request-policy.js'
import { loginPage } from './login-page.js'
import { proxyHttp, bridgeWebSocket } from './proxy.js'
import { upstreamCookie } from './upstream-auth.js'

const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'cache-control': 'no-store'
}

const favicon = readFileSync(new URL('../../icon.svg', import.meta.url))
const loginScript = loginPage.match(/<script>([\s\S]*?)<\/script>/)?.[1]
if (!loginScript) throw new Error('Gateway login script is missing.')
const loginScriptHash = createHash('sha256').update(loginScript).digest('base64')
// `connect-src 'self'` keeps the login fetch working; without it the default-src
// 'none' fallback blocks the request before it ever reaches the gateway.
const loginCsp = `default-src 'none'; script-src 'sha256-${loginScriptHash}'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`

function htmlNavigation(req: IncomingMessage): boolean {
  return req.method === 'GET' && typeof req.headers.accept === 'string' && req.headers.accept.split(',').some((type) => type.trim().startsWith('text/html'))
}

export class RemoteGateway {
  private server: Server | undefined
  private readonly sockets = new Set<import('node:net').Socket>()
  private readonly auth: AuthService
  private readonly allowedAuthorities: string[]
  private readonly wildcardListen: boolean
  private readonly upstreamSessions = new Map<string, string>()
  private readonly pendingUpstreamSessions = new Map<string, Promise<string>>()
  private readonly sessionGenerations = new Map<string, number>()
  private authEpoch = 0

  constructor(private readonly config: RemoteAccessConfig, passwordHash?: string, private readonly authenticatedUrl?: () => string) {
    const publicAuthority = config.publicBaseUrl ? new URL(config.publicBaseUrl).host.toLowerCase() : undefined
    this.wildcardListen = !publicAuthority && isWildcardListenHost(config.listenHost)
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
    this.server = createServer((req, res) => this.handle(req, res))
    this.server.on('connection', (socket) => {
      this.sockets.add(socket)
      socket.once('close', () => this.sockets.delete(socket))
    })
    this.server.on('upgrade', (req, socket, head) => this.handleUpgrade(req, socket, head))
    const server = this.server
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(this.config.listenPort, this.config.listenHost, () => {
          server.off('error', reject)
          resolve()
        })
      })
    } catch (error) {
      server.removeAllListeners()
      this.server = undefined
      throw error
    }
  }

  async stop(): Promise<void> {
    const server = this.server
    this.server = undefined
    this.authEpoch++
    this.upstreamSessions.clear()
    this.pendingUpstreamSessions.clear()
    this.sessionGenerations.clear()
    this.auth.revokeAll()
    if (!server) return
    server.closeAllConnections()
    for (const socket of this.sockets) socket.destroy()
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }

  async bootstrapAdmin(password: string): Promise<string> {
    await this.auth.bootstrap(password)
    return this.auth.passwordRecord()!
  }
  async changeAdminPassword(currentPassword: string, nextPassword: string): Promise<string> {
    const hash = await this.auth.changePassword(currentPassword, nextPassword)
    this.authEpoch++
    this.upstreamSessions.clear()
    this.pendingUpstreamSessions.clear()
    this.sessionGenerations.clear()
    return hash
  }
  passwordRecord(): string | undefined { return this.auth.passwordRecord() }
  revokeAllSessions(): void { this.authEpoch++; this.auth.revokeAll(); this.upstreamSessions.clear(); this.pendingUpstreamSessions.clear(); this.sessionGenerations.clear() }

  /** Drop cached upstream cookies whose gateway session is gone or expired. */
  private pruneUpstreamSessions(): void {
    if (this.upstreamSessions.size < 256) return
    for (const id of this.upstreamSessions.keys()) if (!this.auth.sessions.get(id)) { this.upstreamSessions.delete(id); this.pendingUpstreamSessions.delete(id); this.sessionGenerations.delete(id) }
  }

  private async privateCookie(sessionId: string): Promise<string | undefined> {
    this.pruneUpstreamSessions()
    if (!this.auth.sessions.get(sessionId)) { this.upstreamSessions.delete(sessionId); return undefined }
    if (!this.authenticatedUrl) return undefined
    const existing = this.upstreamSessions.get(sessionId)
    if (existing) return existing
    const pending = this.pendingUpstreamSessions.get(sessionId)
    if (pending) return pending
    const epoch = this.authEpoch
    const session = this.auth.sessions.get(sessionId)
    const generation = this.sessionGenerations.get(sessionId) ?? 0
    const exchange = upstreamCookie(this.config.target, this.authenticatedUrl).then((cookie) => {
      if (epoch !== this.authEpoch || (this.sessionGenerations.get(sessionId) ?? 0) !== generation || this.auth.sessions.get(sessionId) !== session) return ''
      this.upstreamSessions.set(sessionId, cookie)
      return cookie
    })
    this.pendingUpstreamSessions.set(sessionId, exchange)
    try { return await exchange }
    finally { if (this.pendingUpstreamSessions.get(sessionId) === exchange) this.pendingUpstreamSessions.delete(sessionId) }
  }

  private writeSecurity(res: ServerResponse): void { for (const [key, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(key, value) }
  private json(res: ServerResponse, status: number, body: unknown): void {
    this.writeSecurity(res)
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(body))
  }

  private showLogin(res: ServerResponse): void {
    res.setHeader('content-security-policy', loginCsp)
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(loginPage)
  }

  private loginRedirect(res: ServerResponse, path: string): void {
    res.writeHead(303, { location: `/_dsh_remote/login?next=${encodeURIComponent(path)}` })
    res.end()
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
    if (!hostAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs, this.wildcardListen)) return this.json(res, 421, { error: 'Unrecognized Host header.' })
    const url = new URL(req.url ?? '/', 'http://gateway.invalid')
    const pathname = url.pathname
    if (url.searchParams.has('token')) return this.json(res, 400, { error: 'Launch tokens are not accepted by this gateway.' })
    if (pathname === '/_dsh_remote/health' && (req.method === 'GET' || req.method === 'HEAD')) return this.json(res, 200, { status: 'ok' })
    if (pathname === '/favicon.ico' && (req.method === 'GET' || req.method === 'HEAD')) {
      res.writeHead(200, { 'content-type': 'image/svg+xml; charset=utf-8' })
      res.end(req.method === 'HEAD' ? undefined : favicon)
      return
    }
    if (pathname === '/_dsh_remote/login' && req.method === 'GET') {
      if (this.auth.requireSession(req)) {
        res.writeHead(303, { location: '/' })
        res.end()
        return
      }
      return this.showLogin(res)
    }
    if (pathname === '/_dsh_remote/login' && req.method === 'POST') {
      if (!originAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs, this.config.publicBaseUrl, this.wildcardListen)) return this.json(res, 403, { error: 'Origin check failed.' })
      try {
        const body = await this.readJson(req)
        const login = await this.auth.login(String(body.username ?? ''), String(body.password ?? ''), req)
        if (!login.ok) return this.json(res, 429, { error: 'Invalid credentials or too many attempts.', retryAfterSeconds: login.retryAfterSeconds })
        this.auth.setSessionCookie(res, login.session!.id)
        return this.json(res, 200, { csrfToken: login.session!.csrfToken })
      } catch (error) { return this.json(res, 400, { error: error instanceof Error ? error.message : 'Invalid request.' }) }
    }
    if (pathname === '/_dsh_remote/session' && req.method === 'GET') {
      const session = this.auth.requireSession(req)
      return this.json(res, session ? 200 : 401, session ? { csrfToken: session.csrfToken } : { error: 'Login required.' })
    }
    if (pathname === '/_dsh_remote/logout' && req.method === 'POST') {
      if (!originAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs, this.config.publicBaseUrl, this.wildcardListen) || !this.auth.requireCsrf(req)) return this.json(res, 403, { error: 'CSRF check failed.' })
      const session = this.auth.requireSession(req)
      if (session) {
        this.sessionGenerations.set(session.id, (this.sessionGenerations.get(session.id) ?? 0) + 1)
        this.upstreamSessions.delete(session.id)
        this.pendingUpstreamSessions.delete(session.id)
      }
      this.auth.logout(req, res)
      res.writeHead(204)
      res.end()
      return
    }
    if (pathname.startsWith('/_dsh_remote/')) return this.json(res, 404, { error: 'Not found.' })
    const session = this.auth.requireSession(req)
    if (!session) {
      if (htmlNavigation(req)) return this.loginRedirect(res, req.url ?? '/')
      return this.json(res, 401, { error: 'Login required.' })
    }
    if (!proxyWriteAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs, this.config.publicBaseUrl, this.wildcardListen)) return this.json(res, 403, { error: 'Origin check failed.' })
    const declaredLength = Number(req.headers['content-length'] ?? 0)
    if (Number.isFinite(declaredLength) && declaredLength > this.config.maxRequestBodyBytes) return this.json(res, 413, { error: 'Request body exceeds configured limit.' })
    try {
      const cookie = await this.privateCookie(session.id)
      if (!this.auth.sessions.get(session.id)) return this.json(res, 401, { error: 'Session expired.' })
      if (this.authenticatedUrl && !cookie) return this.json(res, 401, { error: 'Session expired.' })
      proxyHttp(req, res, this.config.target, this.config.maxRequestBodyBytes, cookie)
    } catch { this.json(res, 502, { error: 'DSH upstream authentication failed.' }) }
  }

  private handleUpgrade(req: IncomingMessage, socket: import('node:stream').Duplex, head: Buffer): void {
    if (new URL(req.url ?? '/', 'http://gateway.invalid').searchParams.has('token')) { socket.destroy(); return }
    if (!hostAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs, this.wildcardListen) || !websocketOriginAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs, this.config.publicBaseUrl, this.wildcardListen) || !this.auth.requireSession(req)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n')
      socket.destroy()
      return
    }
    const session = this.auth.requireSession(req)!
    void this.privateCookie(session.id).then((cookie) => {
      if (socket.destroyed) return
      if (!this.auth.sessions.get(session.id)) { socket.destroy(); return }
      if (this.authenticatedUrl && !cookie) { socket.destroy(); return }
      bridgeWebSocket(socket, head, req, this.config.target, cookie)
    }).catch(() => {
      if (!socket.destroyed) {
        socket.write('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n')
        socket.destroy()
      }
    })
  }
}
