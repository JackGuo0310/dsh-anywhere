import { existsSync } from 'node:fs';
import { isIP } from 'node:net';
import { z } from 'zod';
import { listLanAddresses } from './network/addresses.js';
export const CONFIG_VERSION = 1;
const hostSchema = z.string().min(1).refine((value) => {
    return value === 'localhost' || isIP(value) !== 0 || /^[a-zA-Z][a-zA-Z0-9.-]*$/.test(value);
}, 'Invalid listener host');
const trustedProxySchema = z.string().min(1).refine((value) => {
    const [address, prefixText, extra] = value.split('/');
    if (extra !== undefined || isIP(address) === 0)
        return false;
    if (prefixText === undefined)
        return true;
    const prefix = Number(prefixText);
    return Number.isInteger(prefix) && prefix >= 0 && prefix <= (isIP(address) === 4 ? 32 : 128);
}, 'Invalid trusted proxy IP address or CIDR');
/** Independent local listeners. They share one port number on different addresses. */
export const listenerSchema = z.object({
    local: z.boolean().default(true),
    lan: z.boolean().default(false),
    tailscale: z.boolean().default(false)
}).strict();
export const frpConfigSchema = z.object({
    executablePath: z.string().min(1).optional(),
    serverAddress: z.string().min(1).optional(),
    serverPort: z.number().int().min(1).max(65535).optional(),
    authMethod: z.enum(['token', 'oidc', 'none']).default('token'),
    tokenSecretRef: z.string().regex(/^[A-Z_][A-Z0-9_]*$/).optional(),
    stcpSecretRef: z.string().regex(/^[A-Z_][A-Z0-9_]*$/).optional(),
    transport: z.enum(['http', 'https', 'stcp']).default('https'),
    customDomain: z.string().max(253).optional(),
    tlsEnabled: z.boolean().default(true),
    startWithDsh: z.boolean().default(false)
}).strict();
export const configSchema = z.object({
    version: z.literal(CONFIG_VERSION).default(CONFIG_VERSION),
    enabled: z.boolean().default(false),
    listenPort: z.number().int().min(1).max(65535).default(4173),
    listeners: listenerSchema.default({ local: true, lan: false, tailscale: false }),
    tunnelEnabled: z.boolean().default(false),
    target: z.object({
        host: hostSchema.default('127.0.0.1'),
        port: z.number().int().min(1).max(65535).default(3000),
        protocol: z.enum(['http', 'https']).default('http')
    }).default({ host: '127.0.0.1', port: 3000, protocol: 'http' }),
    publicBaseUrl: z.string().url().optional(),
    trustedProxyCidrs: z.array(trustedProxySchema).max(32).default([]),
    sessionTtlMinutes: z.number().int().min(5).max(43_200).default(1_440),
    maxRequestBodyBytes: z.number().int().min(1_024).max(1_073_741_824).default(52_428_800),
    adminConfigured: z.boolean().default(false),
    adminPasswordSecretRef: z.string().regex(/^[A-Z_][A-Z0-9_]*$/).optional(),
    frp: frpConfigSchema.optional(),
    customCommandEnabled: z.boolean().default(false),
    customCommand: z.object({ command: z.string().min(1), args: z.array(z.string()) }).optional()
}).strict();
export function isLoopbackHost(host) {
    const normal = host.toLowerCase();
    return normal === 'localhost' || normal === '::1' || normal.startsWith('127.');
}
export function hasDirectListener(listeners) {
    return listeners.local || listeners.lan || listeners.tailscale;
}
/** Tailscale hands out addresses from the 100.64.0.0/10 carrier-grade NAT range. */
export function isTailscaleAddress(address) {
    if (isIP(address) !== 4)
        return false;
    const [first, second] = address.split('.').map(Number);
    return first === 100 && second >= 64 && second <= 127;
}
/**
 * Addresses the gateway binds for the enabled modes. Every mode shares one port, so the
 * firewall only ever needs a single port number open.
 */
export function resolveBindAddresses(config, addresses = listLanAddresses()) {
    const resolved = new Set();
    if (config.listeners.local)
        resolved.add('127.0.0.1');
    for (const entry of addresses) {
        if (entry.family !== 'IPv4')
            continue;
        const tailscale = isTailscaleAddress(entry.address);
        if (tailscale && config.listeners.tailscale)
            resolved.add(entry.address);
        if (!tailscale && config.listeners.lan)
            resolved.add(entry.address);
    }
    return [...resolved];
}
export function assertSafeConfig(value) {
    const config = configSchema.parse(migrateConfig(value));
    if (config.enabled && !isLoopbackHost(config.target.host)) {
        throw new Error('DSH upstream target must remain on loopback to protect the private launch token and cookie.');
    }
    if (config.enabled && config.target.protocol !== 'http') {
        throw new Error('DSH upstream target must use the local HTTP listener.');
    }
    if (config.enabled && !config.adminPasswordSecretRef) {
        throw new Error('Enabled gateway requires an administrator password credential reference.');
    }
    if (config.enabled && !hasDirectListener(config.listeners) && !config.tunnelEnabled) {
        throw new Error('Enable at least one access mode: local, LAN, Tailscale, or the public tunnel.');
    }
    if (config.tunnelEnabled && !config.listeners.local) {
        throw new Error('The public tunnel forwards to the local listener, so the local access mode must stay enabled.');
    }
    if (config.frp && config.customCommandEnabled) {
        throw new Error('Configure exactly one tunnel provider: FRP or custom command.');
    }
    if (config.frp) {
        const frp = config.frp;
        if (!frp.executablePath || !frp.serverAddress || !frp.serverPort) {
            throw new Error('FRP requires executablePath, serverAddress, and serverPort.');
        }
        if (frp.authMethod === 'token' && !frp.tokenSecretRef) {
            throw new Error('FRP token authentication requires tokenSecretRef.');
        }
        if ((frp.transport === 'http' || frp.transport === 'https') && !frp.customDomain) {
            throw new Error('HTTP/HTTPS FRP transport requires customDomain.');
        }
        if (frp.transport === 'stcp' && !frp.stcpSecretRef) {
            throw new Error('STCP transport requires a separate stcpSecretRef.');
        }
        validateFrpcPath(frp.executablePath);
    }
    if (config.tunnelEnabled) {
        if (!config.publicBaseUrl?.startsWith('https://')) {
            throw new Error('Tunnel mode requires an HTTPS publicBaseUrl.');
        }
        if (!config.frp && !config.customCommandEnabled) {
            throw new Error('Tunnel mode requires a configured tunnel provider.');
        }
    }
    if (config.customCommandEnabled && !config.customCommand) {
        throw new Error('Custom command is enabled but no command was configured.');
    }
    return config;
}
/** Old releases stored one listener as `listenHost` plus a `mode` label. */
function migrateLegacyListeners(raw) {
    if (raw.listeners !== undefined || raw.listenHost === undefined)
        return raw;
    const host = String(raw.listenHost).toLowerCase();
    const listeners = host === '0.0.0.0' || host === '::'
        ? { local: true, lan: true, tailscale: true }
        : isTailscaleAddress(host)
            ? { local: false, lan: false, tailscale: true }
            : isLoopbackHost(host)
                ? { local: true, lan: false, tailscale: false }
                : { local: false, lan: true, tailscale: false };
    const { listenHost: _host, ...rest } = raw;
    return { ...rest, listeners };
}
export function migrateConfig(value) {
    if (!value || typeof value !== 'object')
        return configSchema.parse({});
    const raw = value;
    const normalized = raw.version === undefined ? { ...raw, version: CONFIG_VERSION } : raw;
    const { mode, ...withoutMode } = migrateLegacyListeners(normalized);
    const tunnelEnabled = mode === undefined ? withoutMode.tunnelEnabled : mode === 'tunnel';
    return configSchema.parse({ ...withoutMode, tunnelEnabled });
}
export function validateFrpcPath(path) {
    if (!existsSync(path))
        throw new Error('Configured frpc executable does not exist.');
}
//# sourceMappingURL=config.js.map