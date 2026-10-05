import { isIP } from 'node:net';
export function parseCookies(header) {
    if (!header)
        return {};
    return Object.fromEntries(header.split(';').map((part) => part.trim().split(/=(.*)/s, 2)).filter(([key]) => key).map(([key, value]) => [key, decodeURIComponent(value ?? '')]));
}
export function canonicalAuthority(value) {
    try {
        const url = new URL(`http://${value}`);
        if (url.username || url.password || url.pathname !== '/' || url.search || url.hash)
            return undefined;
        return url.host.toLowerCase();
    }
    catch {
        return undefined;
    }
}
export function isTrustedProxy(remoteAddress, trusted) {
    if (!remoteAddress)
        return false;
    return trusted.includes(remoteAddress) || (remoteAddress.startsWith('::ffff:') && trusted.includes(remoteAddress.slice(7)));
}
export function effectiveAuthority(req, trustedProxies) {
    const fromProxy = isTrustedProxy(req.socket.remoteAddress, trustedProxies);
    const forwarded = fromProxy ? req.headers['x-forwarded-host'] : undefined;
    const candidate = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.headers.host;
    return candidate ? canonicalAuthority(candidate) : undefined;
}
export function originAllowed(req, allowedAuthorities, trustedProxies) {
    const method = req.method?.toUpperCase() ?? 'GET';
    if (['GET', 'HEAD', 'OPTIONS'].includes(method))
        return true;
    const origin = req.headers.origin;
    if (!origin || typeof origin !== 'string')
        return false;
    try {
        const parsed = new URL(origin);
        const authority = effectiveAuthority(req, trustedProxies);
        return !!authority && allowedAuthorities.includes(parsed.host.toLowerCase()) && parsed.host.toLowerCase() === authority;
    }
    catch {
        return false;
    }
}
export function hostAllowed(req, allowedAuthorities, trustedProxies) {
    const authority = effectiveAuthority(req, trustedProxies);
    return !!authority && allowedAuthorities.includes(authority);
}
export function remoteClientIp(req, trustedProxies) {
    if (isTrustedProxy(req.socket.remoteAddress, trustedProxies)) {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string')
            return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress ?? 'unknown';
}
export function isPrivateOrLoopbackIp(value) {
    if (value === '::1' || value.startsWith('127.'))
        return true;
    if (isIP(value) === 4)
        return value.startsWith('10.') || value.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(value);
    return value.startsWith('fd') || value.startsWith('fc');
}
//# sourceMappingURL=request-policy.js.map