import type { IncomingMessage, ServerResponse } from 'node:http'
import { hashPassword, verifyPassword } from './password.js'
import { SlidingWindowRateLimiter } from './rate-limit.js'
import { effectiveAuthority, parseCookies, remoteClientIp } from './request-policy.js'
import { SessionStore } from './session-store.js'

export interface AuthOptions {
  passwordHash?: string
  sessionTtlMinutes: number
  trustedProxies: string[]
}

const COOKIE_NAME = 'dsh_remote_session'

/**
 * Every enabled access mode is its own entry with its own sessions, so a session taken
 * from one entry cannot authenticate another. Cookies ignore the port, so the loopback
 * aliases (`localhost` and `127.0.0.1`) are folded together.
 */
export function normalizeAuthority(authority: string): string {
  return authority.replace(/^localhost(?=:|$)/, '127.0.0.1')
}

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
    if (nextPassword.length < 10) throw new Error('New administrator password must be at least 10 characters.')
    const nextHash = await hashPassword(nextPassword)
    this.passwordHash = nextHash
    this.revokeAll()
    return nextHash
  }

  /** The entry a request arrived on, or undefined when its Host is not one of them. */
  entryAuthority(req: IncomingMessage): string | undefined {
    const authority = effectiveAuthority(req, this.options.trustedProxies)
    return authority ? normalizeAuthority(authority) : undefined
  }

  async login(username: string, password: string, req: IncomingMessage): Promise<{ ok: boolean; retryAfterSeconds?: number; session?: { id: string; csrfToken: string } }> {
    this.ipLimiter.clearExpired()
    this.accountLimiter.clearExpired()
    const ip = remoteClientIp(req, this.options.trustedProxies)
    const ipState = this.ipLimiter.check(`ip:${ip}`)
    const accountState = this.accountLimiter.check(`account:${username.toLowerCase()}`)
    if (!ipState.allowed || !accountState.allowed) return { ok: false, retryAfterSeconds: Math.max(ipState.retryAfterSeconds, accountState.retryAfterSeconds) }
    const authority = this.entryAuthority(req)
    if (username !== 'admin' || !authority || !this.passwordHash || !(await verifyPassword(password, this.passwordHash))) return { ok: false }
    this.ipLimiter.reset(`ip:${ip}`)
    this.accountLimiter.reset(`account:${username.toLowerCase()}`)
    const session = this.sessions.create(this.options.sessionTtlMinutes, authority)
    return { ok: true, session }
  }

  requireSession(req: IncomingMessage): { id: string; csrfToken: string } | undefined {
    const authority = this.entryAuthority(req)
    if (!authority) return undefined
    const session = this.sessions.get(parseCookies(req.headers.cookie)[COOKIE_NAME], authority)
    return session ? { id: session.id, csrfToken: session.csrfToken } : undefined
  }

  requireCsrf(req: IncomingMessage): boolean {
    const method = req.method?.toUpperCase() ?? 'GET'
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true
    const session = this.requireSession(req)
    const header = req.headers['x-csrf-token']
    return !!session && typeof header === 'string' && header === session.csrfToken
  }

  setSessionCookie(res: ServerResponse, sessionId: string, secure: boolean): void {
    const parts = [`${COOKIE_NAME}=${encodeURIComponent(sessionId)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${this.options.sessionTtlMinutes * 60}`]
    if (secure) parts.push('Secure')
    res.setHeader('set-cookie', parts.join('; '))
  }

  clearSessionCookie(res: ServerResponse, secure: boolean): void {
    const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0']
    if (secure) parts.push('Secure')
    res.setHeader('set-cookie', parts.join('; '))
  }

  logout(req: IncomingMessage, res: ServerResponse, secure: boolean): void {
    this.sessions.revoke(parseCookies(req.headers.cookie)[COOKIE_NAME])
    this.clearSessionCookie(res, secure)
  }

  revokeAll(): void { this.sessions.revokeAll() }
  passwordRecord(): string | undefined { return this.passwordHash }
}

export const sessionCookieName = COOKIE_NAME
