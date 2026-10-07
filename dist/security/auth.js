import { hashPassword, verifyPassword } from './password.js';
import { SlidingWindowRateLimiter } from './rate-limit.js';
import { effectiveAuthority, parseCookies, remoteClientIp } from './request-policy.js';
import { SessionStore } from './session-store.js';
const COOKIE_NAME = 'dsh_remote_session';
/**
 * Every enabled access mode is its own entry with its own sessions, so a session taken
 * from one entry cannot authenticate another. Cookies ignore the port, so the loopback
 * aliases (`localhost` and `127.0.0.1`) are folded together.
 */
export function normalizeAuthority(authority) {
    return authority.replace(/^localhost(?=:|$)/, '127.0.0.1');
}
export class AuthService {
    options;
    passwordHash;
    sessions = new SessionStore();
    ipLimiter = new SlidingWindowRateLimiter();
    accountLimiter = new SlidingWindowRateLimiter();
    constructor(options) {
        this.options = options;
        this.passwordHash = options.passwordHash;
    }
    get configured() { return !!this.passwordHash; }
    /** Session lifetime and trusted proxies can change without invalidating anyone. */
    updateOptions(options) {
        if (options.sessionTtlMinutes !== undefined)
            this.options.sessionTtlMinutes = options.sessionTtlMinutes;
        if (options.trustedProxies !== undefined)
            this.options.trustedProxies = options.trustedProxies;
    }
    setPasswordHash(hash) { this.passwordHash = hash; }
    async bootstrap(password) {
        if (this.passwordHash)
            throw new Error('Administrator account is already configured.');
        this.passwordHash = await hashPassword(password);
    }
    async changePassword(currentPassword, nextPassword) {
        if (!this.passwordHash || !(await verifyPassword(currentPassword, this.passwordHash)))
            throw new Error('Current administrator password is invalid.');
        if (nextPassword.length < 10)
            throw new Error('New administrator password must be at least 10 characters.');
        const nextHash = await hashPassword(nextPassword);
        this.passwordHash = nextHash;
        this.revokeAll();
        return nextHash;
    }
    /** The entry a request arrived on, or undefined when its Host is not one of them. */
    entryAuthority(req) {
        const authority = effectiveAuthority(req, this.options.trustedProxies);
        return authority ? normalizeAuthority(authority) : undefined;
    }
    async login(username, password, req) {
        this.ipLimiter.clearExpired();
        this.accountLimiter.clearExpired();
        const ip = remoteClientIp(req, this.options.trustedProxies);
        const ipState = this.ipLimiter.check(`ip:${ip}`);
        const accountState = this.accountLimiter.check(`account:${username.toLowerCase()}`);
        if (!ipState.allowed || !accountState.allowed)
            return { ok: false, retryAfterSeconds: Math.max(ipState.retryAfterSeconds, accountState.retryAfterSeconds) };
        const authority = this.entryAuthority(req);
        if (username !== 'admin' || !authority || !this.passwordHash || !(await verifyPassword(password, this.passwordHash)))
            return { ok: false };
        this.ipLimiter.reset(`ip:${ip}`);
        this.accountLimiter.reset(`account:${username.toLowerCase()}`);
        const session = this.sessions.create(this.options.sessionTtlMinutes, authority);
        return { ok: true, session };
    }
    requireSession(req) {
        const authority = this.entryAuthority(req);
        if (!authority)
            return undefined;
        const session = this.sessions.get(parseCookies(req.headers.cookie)[COOKIE_NAME], authority);
        return session ? { id: session.id, csrfToken: session.csrfToken } : undefined;
    }
    requireCsrf(req) {
        const method = req.method?.toUpperCase() ?? 'GET';
        if (['GET', 'HEAD', 'OPTIONS'].includes(method))
            return true;
        const session = this.requireSession(req);
        const header = req.headers['x-csrf-token'];
        return !!session && typeof header === 'string' && header === session.csrfToken;
    }
    setSessionCookie(res, sessionId, secure) {
        const parts = [`${COOKIE_NAME}=${encodeURIComponent(sessionId)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${this.options.sessionTtlMinutes * 60}`];
        if (secure)
            parts.push('Secure');
        res.setHeader('set-cookie', parts.join('; '));
    }
    clearSessionCookie(res, secure) {
        const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
        if (secure)
            parts.push('Secure');
        res.setHeader('set-cookie', parts.join('; '));
    }
    logout(req, res, secure) {
        this.sessions.revoke(parseCookies(req.headers.cookie)[COOKIE_NAME]);
        this.clearSessionCookie(res, secure);
    }
    revokeAll() { this.sessions.revokeAll(); }
    passwordRecord() { return this.passwordHash; }
}
export const sessionCookieName = COOKIE_NAME;
//# sourceMappingURL=auth.js.map