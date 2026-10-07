import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { URL } from 'node:url';
import { resolveBindAddresses } from '../config.js';
import { AuthService, normalizeAuthority } from '../security/auth.js';
import { effectiveAuthority, hostAllowed, originAllowed, proxyWriteAllowed, websocketOriginAllowed } from '../security/request-policy.js';
import { loginPage } from './login-page.js';
import { proxyHttp, bridgeWebSocket } from './proxy.js';
import { upstreamCookie } from './upstream-auth.js';
const SECURITY_HEADERS = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'cross-origin-resource-policy': 'same-origin',
    'cache-control': 'no-store'
};
// Browsers ignore Cross-Origin-Opener-Policy on an untrustworthy origin and log a
// console warning for it, so send it only where it can actually take effect.
const COOP_HEADER = 'cross-origin-opener-policy';
const favicon = readFileSync(new URL('../../icon.svg', import.meta.url));
const loginScript = loginPage.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!loginScript)
    throw new Error('Gateway login script is missing.');
const loginScriptHash = createHash('sha256').update(loginScript).digest('base64');
// `connect-src 'self'` keeps the login fetch working; without it the default-src
// 'none' fallback blocks the request before it ever reaches the gateway.
// Cloudflare injects its Web Analytics beacon into proxied HTML, so the login page must
// allow that one static host for scripts and its reporting endpoint, or a reverse-proxied
// deployment logs a CSP violation for every page load.
const loginCsp = [
    `default-src 'none'`,
    `script-src 'sha256-${loginScriptHash}' https://static.cloudflareinsights.com`,
    `style-src 'unsafe-inline'`,
    `connect-src 'self' https://cloudflareinsights.com`,
    `form-action 'self'`,
    `base-uri 'none'`,
    `frame-ancestors 'none'`
].join('; ');
function htmlNavigation(req) {
    return req.method === 'GET' && typeof req.headers.accept === 'string' && req.headers.accept.split(',').some((type) => type.trim().startsWith('text/html'));
}
/** A bound address answers under its literal form and, for loopback, under `localhost`. */
function authorityAliases(address, port) {
    const authority = `${address.includes(':') ? `[${address}]` : address}:${port}`.toLowerCase();
    return address === '127.0.0.1' ? [authority, `localhost:${port}`] : [authority];
}
/** Close one listener and only the connections that belong to it. */
function closeServer(server) {
    server.closeAllConnections();
    return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
export class RemoteGateway {
    config;
    authenticatedUrl;
    /** One server per bound address; a config change only touches the addresses that changed. */
    servers = new Map();
    sockets = new Set();
    /** Sockets per bound address, so releasing one listener never touches another's traffic. */
    addressSockets = new Map();
    auth;
    allowedAuthorities = [];
    boundAddresses = [];
    publicAuthority;
    upstreamSessions = new Map();
    pendingUpstreamSessions = new Map();
    sessionGenerations = new Map();
    authEpoch = 0;
    constructor(config, passwordHash, authenticatedUrl) {
        this.config = config;
        this.authenticatedUrl = authenticatedUrl;
        this.auth = new AuthService({
            passwordHash,
            sessionTtlMinutes: config.sessionTtlMinutes,
            trustedProxies: config.trustedProxyCidrs
        });
    }
    async start() {
        if (this.servers.size)
            return;
        try {
            await this.syncListeners();
        }
        catch (error) {
            await this.stop();
            throw error;
        }
    }
    /**
     * Adopt a new configuration without dropping unrelated connections. Existing listeners and
     * their live sockets stay up; only added addresses bind and only removed ones close. Sessions
     * survive, so saving settings does not log every browser out.
     */
    async reconfigure(config, passwordHash, authenticatedUrl) {
        const previous = this.config;
        this.config = config;
        this.authenticatedUrl = authenticatedUrl ?? this.authenticatedUrl;
        this.auth.updateOptions({ sessionTtlMinutes: config.sessionTtlMinutes, trustedProxies: config.trustedProxyCidrs });
        // A changed administrator password invalidates every session; anything else preserves them.
        if (passwordHash !== undefined && passwordHash !== this.auth.passwordRecord()) {
            this.auth.setPasswordHash(passwordHash);
            this.revokeAllSessions();
        }
        // A new port means every listener must move, so release them before rebinding.
        if (previous.listenPort !== config.listenPort)
            for (const address of [...this.servers.keys()])
                await this.release(address);
        await this.syncListeners();
    }
    /** Bind newly enabled addresses and release disabled ones, leaving everything else untouched. */
    async syncListeners() {
        const addresses = resolveBindAddresses(this.config);
        if (!addresses.length)
            throw new Error('No listener address is available for the enabled access modes.');
        this.publicAuthority = this.config.tunnelEnabled && this.config.publicBaseUrl ? new URL(this.config.publicBaseUrl).host.toLowerCase() : undefined;
        // Every enabled mode shares one port, so each enabled address is its own socket and
        // the firewall still only ever needs a single port number.
        this.allowedAuthorities = [...new Set([...addresses.flatMap((address) => authorityAliases(address, this.config.listenPort)), this.publicAuthority].filter(Boolean))];
        for (const address of addresses)
            if (!this.servers.has(address))
                await this.listen(address);
        for (const address of [...this.servers.keys()])
            if (!addresses.includes(address))
                await this.release(address);
        this.boundAddresses = addresses;
    }
    async release(address) {
        const server = this.servers.get(address);
        if (!server)
            return;
        this.servers.delete(address);
        // server.close() waits for every connection, and upgraded WebSocket sockets are excluded
        // from closeAllConnections(), so destroy this address's sockets explicitly first.
        const owned = this.addressSockets.get(address);
        this.addressSockets.delete(address);
        for (const socket of owned ?? [])
            socket.destroy();
        await closeServer(server);
    }
    listen(address) {
        const server = createServer((req, res) => this.handle(req, res));
        server.on('upgrade', (req, socket, head) => this.handleUpgrade(req, socket, head));
        return new Promise((resolve, reject) => {
            // Register only after a successful bind, so a failed attempt never leaves a
            // never-listening server behind for stop() to choke on.
            const onError = (error) => { server.removeListener('listening', onListening); server.close(); reject(error); };
            const onListening = () => {
                server.off('error', onError);
                this.servers.set(address, server);
                const owned = new Set();
                this.addressSockets.set(address, owned);
                server.on('connection', (socket) => {
                    this.sockets.add(socket);
                    owned.add(socket);
                    socket.once('close', () => { this.sockets.delete(socket); owned.delete(socket); });
                });
                resolve();
            };
            server.once('error', onError);
            server.once('listening', onListening);
            server.listen(this.config.listenPort, address);
        });
    }
    async stop() {
        const servers = [...this.servers.values()];
        this.servers.clear();
        this.addressSockets.clear();
        this.boundAddresses = [];
        this.authEpoch++;
        this.upstreamSessions.clear();
        this.pendingUpstreamSessions.clear();
        this.sessionGenerations.clear();
        this.auth.revokeAll();
        if (!servers.length)
            return;
        for (const socket of this.sockets)
            socket.destroy();
        await Promise.all(servers.map((server) => closeServer(server)));
    }
    async bootstrapAdmin(password) {
        await this.auth.bootstrap(password);
        return this.auth.passwordRecord();
    }
    async changeAdminPassword(currentPassword, nextPassword) {
        const hash = await this.auth.changePassword(currentPassword, nextPassword);
        this.authEpoch++;
        this.upstreamSessions.clear();
        this.pendingUpstreamSessions.clear();
        this.sessionGenerations.clear();
        return hash;
    }
    passwordRecord() { return this.auth.passwordRecord(); }
    revokeAllSessions() { this.authEpoch++; this.auth.revokeAll(); this.upstreamSessions.clear(); this.pendingUpstreamSessions.clear(); this.sessionGenerations.clear(); }
    /** Addresses this gateway actually bound, for the settings page. */
    boundAuthorities() { return [...this.allowedAuthorities]; }
    /** Raw bound addresses, so the settings page can show which mode covers which address. */
    listenAddresses() { return [...this.boundAddresses]; }
    /** Drop cached upstream cookies whose gateway session is gone or expired. */
    pruneUpstreamSessions() {
        if (this.upstreamSessions.size < 256)
            return;
        for (const id of this.upstreamSessions.keys())
            if (!this.auth.sessions.find(id)) {
                this.upstreamSessions.delete(id);
                this.pendingUpstreamSessions.delete(id);
                this.sessionGenerations.delete(id);
            }
    }
    async privateCookie(sessionId) {
        this.pruneUpstreamSessions();
        if (!this.auth.sessions.find(sessionId)) {
            this.upstreamSessions.delete(sessionId);
            return undefined;
        }
        if (!this.authenticatedUrl)
            return undefined;
        const existing = this.upstreamSessions.get(sessionId);
        if (existing)
            return existing;
        const pending = this.pendingUpstreamSessions.get(sessionId);
        if (pending)
            return pending;
        const epoch = this.authEpoch;
        const session = this.auth.sessions.find(sessionId);
        const generation = this.sessionGenerations.get(sessionId) ?? 0;
        const exchange = upstreamCookie(this.config.target, this.authenticatedUrl).then((cookie) => {
            if (epoch !== this.authEpoch || (this.sessionGenerations.get(sessionId) ?? 0) !== generation || this.auth.sessions.find(sessionId) !== session)
                return '';
            this.upstreamSessions.set(sessionId, cookie);
            return cookie;
        });
        this.pendingUpstreamSessions.set(sessionId, exchange);
        try {
            return await exchange;
        }
        finally {
            if (this.pendingUpstreamSessions.get(sessionId) === exchange)
                this.pendingUpstreamSessions.delete(sessionId);
        }
    }
    writeSecurity(res, trustworthyOrigin = false) {
        for (const [key, value] of Object.entries(SECURITY_HEADERS))
            res.setHeader(key, value);
        if (trustworthyOrigin)
            res.setHeader(COOP_HEADER, 'same-origin');
    }
    /** Chrome honours COOP only on HTTPS or a loopback origin; elsewhere it just warns. */
    trustworthyOrigin(req) {
        if (this.config.publicBaseUrl?.startsWith('https://'))
            return true;
        const authority = effectiveAuthority(req, this.config.trustedProxyCidrs);
        if (!authority)
            return false;
        const host = (authority.startsWith('[') ? authority.slice(0, authority.indexOf(']') + 1) : authority.split(':')[0]).replace(/^\[|\]$/g, '').toLowerCase();
        return host === 'localhost' || host === '::1' || host.startsWith('127.');
    }
    json(res, status, body) {
        this.writeSecurity(res);
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(body));
    }
    showLogin(res) {
        res.setHeader('content-security-policy', loginCsp);
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(loginPage);
    }
    loginRedirect(res, path) {
        res.writeHead(303, { location: `/_dsh_remote/login?next=${encodeURIComponent(path)}` });
        res.end();
    }
    async readJson(req) {
        const limit = this.config.maxRequestBodyBytes;
        let bytes = 0;
        const chunks = [];
        for await (const chunk of req) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            bytes += buffer.length;
            if (bytes > limit)
                throw new Error('Request body exceeds configured limit.');
            chunks.push(buffer);
        }
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
            throw new Error('Expected an object body.');
        return parsed;
    }
    async handle(req, res) {
        this.writeSecurity(res, this.trustworthyOrigin(req));
        if (!hostAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs))
            return this.json(res, 421, { error: 'Unrecognized Host header.' });
        // Each access mode is its own entry: the public HTTPS entry alone gets a Secure cookie.
        const entry = this.publicAuthority !== undefined && normalizeAuthority(effectiveAuthority(req, this.config.trustedProxyCidrs) ?? '') === this.publicAuthority;
        const url = new URL(req.url ?? '/', 'http://gateway.invalid');
        const pathname = url.pathname;
        if (url.searchParams.has('token'))
            return this.json(res, 400, { error: 'Launch tokens are not accepted by this gateway.' });
        if (pathname === '/_dsh_remote/health' && (req.method === 'GET' || req.method === 'HEAD'))
            return this.json(res, 200, { status: 'ok' });
        if (pathname === '/favicon.ico' && (req.method === 'GET' || req.method === 'HEAD')) {
            res.writeHead(200, { 'content-type': 'image/svg+xml; charset=utf-8' });
            res.end(req.method === 'HEAD' ? undefined : favicon);
            return;
        }
        // Browsers fetch the web app manifest with credentials omitted, so a session check
        // could never pass and every page load logged an unauthorized error. DSH itself
        // serves this static file without authentication, so mirror that here.
        if (pathname === '/manifest.webmanifest' && (req.method === 'GET' || req.method === 'HEAD')) {
            try {
                proxyHttp(req, res, this.config.target, this.config.maxRequestBodyBytes, undefined);
            }
            catch {
                this.json(res, 502, { error: 'DSH upstream is unavailable.' });
            }
            return;
        }
        if (pathname === '/_dsh_remote/login' && req.method === 'GET') {
            if (this.auth.requireSession(req)) {
                res.writeHead(303, { location: '/' });
                res.end();
                return;
            }
            return this.showLogin(res);
        }
        if (pathname === '/_dsh_remote/login' && req.method === 'POST') {
            if (!originAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs, this.config.publicBaseUrl))
                return this.json(res, 403, { error: 'Origin check failed.' });
            try {
                const body = await this.readJson(req);
                const login = await this.auth.login(String(body.username ?? ''), String(body.password ?? ''), req);
                if (!login.ok)
                    return this.json(res, 429, { error: 'Invalid credentials or too many attempts.', retryAfterSeconds: login.retryAfterSeconds });
                this.auth.setSessionCookie(res, login.session.id, entry);
                return this.json(res, 200, { csrfToken: login.session.csrfToken });
            }
            catch (error) {
                return this.json(res, 400, { error: error instanceof Error ? error.message : 'Invalid request.' });
            }
        }
        if (pathname === '/_dsh_remote/session' && req.method === 'GET') {
            const session = this.auth.requireSession(req);
            return this.json(res, session ? 200 : 401, session ? { csrfToken: session.csrfToken } : { error: 'Login required.' });
        }
        if (pathname === '/_dsh_remote/logout' && req.method === 'POST') {
            if (!originAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs, this.config.publicBaseUrl) || !this.auth.requireCsrf(req))
                return this.json(res, 403, { error: 'CSRF check failed.' });
            const session = this.auth.requireSession(req);
            if (session) {
                this.sessionGenerations.set(session.id, (this.sessionGenerations.get(session.id) ?? 0) + 1);
                this.upstreamSessions.delete(session.id);
                this.pendingUpstreamSessions.delete(session.id);
            }
            this.auth.logout(req, res, entry);
            res.writeHead(204);
            res.end();
            return;
        }
        if (pathname.startsWith('/_dsh_remote/'))
            return this.json(res, 404, { error: 'Not found.' });
        const session = this.auth.requireSession(req);
        if (!session) {
            if (htmlNavigation(req))
                return this.loginRedirect(res, req.url ?? '/');
            return this.json(res, 401, { error: 'Login required.' });
        }
        if (!proxyWriteAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs, this.config.publicBaseUrl))
            return this.json(res, 403, { error: 'Origin check failed.' });
        const declaredLength = Number(req.headers['content-length'] ?? 0);
        if (Number.isFinite(declaredLength) && declaredLength > this.config.maxRequestBodyBytes)
            return this.json(res, 413, { error: 'Request body exceeds configured limit.' });
        try {
            const cookie = await this.privateCookie(session.id);
            if (!this.auth.sessions.find(session.id))
                return this.json(res, 401, { error: 'Session expired.' });
            if (this.authenticatedUrl && !cookie)
                return this.json(res, 401, { error: 'Session expired.' });
            proxyHttp(req, res, this.config.target, this.config.maxRequestBodyBytes, cookie);
        }
        catch {
            this.json(res, 502, { error: 'DSH upstream authentication failed.' });
        }
    }
    handleUpgrade(req, socket, head) {
        if (new URL(req.url ?? '/', 'http://gateway.invalid').searchParams.has('token')) {
            socket.destroy();
            return;
        }
        if (!hostAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs) || !websocketOriginAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs, this.config.publicBaseUrl) || !this.auth.requireSession(req)) {
            socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
            socket.destroy();
            return;
        }
        const session = this.auth.requireSession(req);
        void this.privateCookie(session.id).then((cookie) => {
            if (socket.destroyed)
                return;
            if (!this.auth.sessions.find(session.id)) {
                socket.destroy();
                return;
            }
            if (this.authenticatedUrl && !cookie) {
                socket.destroy();
                return;
            }
            bridgeWebSocket(socket, head, req, this.config.target, cookie);
        }).catch(() => {
            if (!socket.destroyed) {
                socket.write('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n');
                socket.destroy();
            }
        });
    }
}
//# sourceMappingURL=remote-gateway.js.map