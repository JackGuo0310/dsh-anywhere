import { existsSync } from 'node:fs';
import { isIP } from 'node:net';
import { z } from 'zod';
export const CONFIG_VERSION = 1;
const hostSchema = z.string().min(1).refine((value) => {
    return value === 'localhost' || isIP(value) !== 0 || /^[a-zA-Z][a-zA-Z0-9.-]*$/.test(value);
}, 'Invalid listener host');
export const frpConfigSchema = z.object({
    executablePath: z.string().min(1).optional(),
    serverAddress: z.string().min(1).optional(),
    serverPort: z.number().int().min(1).max(65535).optional(),
    authMethod: z.enum(['token', 'oidc', 'none']).default('token'),
    tokenSecretRef: z.string().regex(/^[A-Z_][A-Z0-9_]*$/).optional(),
    transport: z.enum(['http', 'https', 'stcp']).default('https'),
    customDomain: z.string().max(253).optional(),
    tlsEnabled: z.boolean().default(true),
    startWithDsh: z.boolean().default(false)
}).strict();
export const configSchema = z.object({
    version: z.literal(CONFIG_VERSION).default(CONFIG_VERSION),
    enabled: z.boolean().default(false),
    listenHost: hostSchema.default('127.0.0.1'),
    listenPort: z.number().int().min(1).max(65535).default(4173),
    mode: z.enum(['loopback', 'lan', 'tailscale', 'tunnel']).default('loopback'),
    target: z.object({
        host: hostSchema.default('127.0.0.1'),
        port: z.number().int().min(1).max(65535).default(3000),
        protocol: z.enum(['http', 'https']).default('http')
    }).default({ host: '127.0.0.1', port: 3000, protocol: 'http' }),
    publicBaseUrl: z.string().url().optional(),
    trustedProxyCidrs: z.array(z.string().min(1)).max(32).default([]),
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
export function assertSafeConfig(value) {
    const config = configSchema.parse(value);
    const external = !isLoopbackHost(config.listenHost);
    if (config.enabled && !config.adminPasswordSecretRef) {
        throw new Error('Enabled gateway requires an administrator password credential reference.');
    }
    if (external && (!config.adminConfigured || !config.adminPasswordSecretRef)) {
        throw new Error('External listener requires a configured administrator account and password credential reference.');
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
        validateFrpcPath(frp.executablePath);
    }
    if (config.mode === 'tunnel') {
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
export function migrateConfig(value) {
    if (!value || typeof value !== 'object')
        return configSchema.parse({});
    const raw = value;
    if (raw.version === undefined)
        return configSchema.parse({ ...raw, version: CONFIG_VERSION });
    return configSchema.parse(raw);
}
export function validateFrpcPath(path) {
    if (!existsSync(path))
        throw new Error('Configured frpc executable does not exist.');
}
//# sourceMappingURL=config.js.map