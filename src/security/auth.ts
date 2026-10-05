import type { IncomingMessage, ServerResponse } from 'node:http'
import { hashPassword, verifyPassword } from './password.js'
import { SlidingWindowRateLimiter } from './rate-limit.js'
import { parseCookies, remoteClientIp } from './request-policy.js'
import { SessionStore } from './session-store.js'

export interface AuthOptions {
  passwordHash?: string
  sessionTtlMinutes: number
  secureCookie: boolean
  trustedProxies: string[]
}

const COOKIE_NAME = '__Host-dsh_remote_session'

export class AuthService {
  private passwordHash: string | undefined
  readonly sessions = new SessionStore()
  private readonly ipLimiter = new SlidingWindowRateLimiter()
  private readonly accountLimiter = new SlidingWindowRateLimiter()

  constructor(private readonly options: AuthOptions) { this.passwordHash = options.passwordHash }
  get configured(): boolean { return !!this.passwordHash }

  async bootstrap(password: string): Promise<void> {
    if (this.passwordHash) throw new Error('Administrator account is already configured.')
    this.passwordHash = await hashPassword(password)
  }

  async changePassword(currentPassword: string, nextPassword: string): Promise<string> {
    if (!this.passwordHash || !(await verifyPassword(currentPassword, this.passwordHash))) throw new Error('Current administrator password is invalid.')
    const nextHash = await hashPassword(nextPassword)
    this.passwordHash = nextHash
    this.revokeAll()
    return nextHash
  }

  async login(username: string, password: string, req: IncomingMessage): Promise<{ ok: boolean; retryAfterSeconds?: number; session?: { id: string; csrfToken: string } }> {
    const ip = remoteClientIp(req, this.options.trustedProxies)
    const ipState = this.ipLimiter.check(`ip:${ip}`)
    const accountState = this.accountLimiter.check(`account:${username.toLowerCase()}`)
    if (!ipState.allowed || !accountState.allowed) return { ok: false, retryAfterSeconds: Math.max(ipState.retryAfterSeconds, accountState.retryAfterSeconds) }
    if (username !== 'admin' || !this.passwordHash || !(await verifyPassword(password, this.passwordHash))) return { ok: false }
    this.ipLimiter.reset(`ip:${ip}`)
    this.accountLimiter.reset(`account:${username.toLowerCase()}`)
    const session = this.sessions.create(this.options.sessionTtlMinutes)
    return { ok: true, session }
  }

  requireSession(req: IncomingMessage): { id: string; csrfToken: string } | undefined {
    const session = this.sessions.get(parseCookies(req.headers.cookie)[COOKIE_NAME])
    return session ? { id: session.id, csrfToken: session.csrfToken } : undefined
  }

  requireCsrf(req: IncomingMessage): boolean {
    const method = req.method?.toUpperCase() ?? 'GET'
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true
    const session = this.requireSession(req)
    const header = req.headers['x-csrf-token']
    return !!session && typeof header === 'string' && header === session.csrfToken
  }

  setSessionCookie(res: ServerResponse, sessionId: string): void {
    const parts = [`${COOKIE_NAME}=${encodeURIComponent(sessionId)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${this.options.sessionTtlMinutes * 60}`]
    if (this.options.secureCookie) parts.push('Secure')
    res.setHeader('set-cookie', parts.join('; '))
  }

  clearSessionCookie(res: ServerResponse): void {
    const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0']
    if (this.options.secureCookie) parts.push('Secure')
    res.setHeader('set-cookie', parts.join('; '))
  }

  logout(req: IncomingMessage, res: ServerResponse): void {
    this.sessions.revoke(parseCookies(req.headers.cookie)[COOKIE_NAME])
    this.clearSessionCookie(res)
  }

  revokeAll(): void { this.sessions.revokeAll() }
  passwordRecord(): string | undefined { return this.passwordHash }
}

export const sessionCookieName = COOKIE_NAME
