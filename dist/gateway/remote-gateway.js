import { createServer } from 'node:http';
import { URL } from 'node:url';
import { AuthService } from '../security/auth.js';
import { hostAllowed, originAllowed } from '../security/request-policy.js';
import { proxyHttp, bridgeWebSocket } from './proxy.js';
const SECURITY_HEADERS = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'cache-control': 'no-store'
};
export class RemoteGateway {
    config;
    server;
    auth;
    allowedAuthorities;
    constructor(config, passwordHash) {
        this.config = config;
        const publicAuthority = config.publicBaseUrl ? new URL(config.publicBaseUrl).host.toLowerCase() : undefined;
        this.allowedAuthorities = [...new Set([`${config.listenHost}:${config.listenPort}`.toLowerCase(), publicAuthority].filter(Boolean))];
        this.auth = new AuthService({
            passwordHash,
            sessionTtlMinutes: config.sessionTtlMinutes,
            secureCookie: config.mode === 'tunnel',
            trustedProxies: config.trustedProxyCidrs
        });
    }
    async start() {
        if (this.server)
            return;
        if (!this.auth.configured)
            throw new Error('Remote gateway cannot start until an administrator password hash is provisioned.');
        this.server = createServer((req, res) => this.handle(req, res));
        this.server.on('upgrade', (req, socket, head) => this.handleUpgrade(req, socket, head));
        await new Promise((resolve, reject) => {
            this.server.once('error', reject);
            this.server.listen(this.config.listenPort, this.config.listenHost, () => {
                this.server.off('error', reject);
                resolve();
            });
        });
    }
    async stop() {
        const server = this.server;
        this.server = undefined;
        if (!server)
            return;
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    async bootstrapAdmin(password) { await this.auth.bootstrap(password); }
    async changeAdminPassword(currentPassword, nextPassword) { return this.auth.changePassword(currentPassword, nextPassword); }
    passwordRecord() { return this.auth.passwordRecord(); }
    revokeAllSessions() { this.auth.revokeAll(); }
    writeSecurity(res) { for (const [key, value] of Object.entries(SECURITY_HEADERS))
        res.setHeader(key, value); }
    json(res, status, body) {
        this.writeSecurity(res);
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(body));
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
        this.writeSecurity(res);
        if (!hostAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs))
            return this.json(res, 421, { error: 'Unrecognized Host header.' });
        const pathname = new URL(req.url ?? '/', 'http://gateway.invalid').pathname;
        if (pathname === '/_dsh_remote/health')
            return this.json(res, 200, { status: 'ok' });
        if (pathname === '/_dsh_remote/login' && req.method === 'POST') {
            if (!originAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs))
                return this.json(res, 403, { error: 'Origin check failed.' });
            try {
                const body = await this.readJson(req);
                const login = await this.auth.login(String(body.username ?? ''), String(body.password ?? ''), req);
                if (!login.ok)
                    return this.json(res, 429, { error: 'Invalid credentials or too many attempts.', retryAfterSeconds: login.retryAfterSeconds });
                this.auth.setSessionCookie(res, login.session.id);
                return this.json(res, 200, { csrfToken: login.session.csrfToken });
            }
            catch (error) {
                return this.json(res, 400, { error: error instanceof Error ? error.message : 'Invalid request.' });
            }
        }
        if (pathname === '/_dsh_remote/logout' && req.method === 'POST') {
            if (!originAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs) || !this.auth.requireCsrf(req))
                return this.json(res, 403, { error: 'CSRF check failed.' });
            this.auth.logout(req, res);
            return this.json(res, 204, {});
        }
        if (!this.auth.requireSession(req))
            return this.json(res, 401, { error: 'Login required.' });
        if (!this.auth.requireCsrf(req))
            return this.json(res, 403, { error: 'CSRF check failed.' });
        proxyHttp(req, res, this.config.target);
    }
    handleUpgrade(req, socket, head) {
        if (!hostAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs) || !originAllowed(req, this.allowedAuthorities, this.config.trustedProxyCidrs) || !this.auth.requireSession(req)) {
            socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
            socket.destroy();
            return;
        }
        bridgeWebSocket(socket, head, req, this.config.target);
    }
}
//# sourceMappingURL=remote-gateway.js.map