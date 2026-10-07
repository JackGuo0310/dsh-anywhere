import { z } from 'zod';
export declare const CONFIG_VERSION: 1;
export type TunnelKind = 'frp' | 'custom-command';
/** Independent local listeners. They share one port number on different addresses. */
export declare const listenerSchema: z.ZodObject<{
    local: z.ZodDefault<z.ZodBoolean>;
    lan: z.ZodDefault<z.ZodBoolean>;
    tailscale: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    local: boolean;
    lan: boolean;
    tailscale: boolean;
}, {
    local?: boolean | undefined;
    lan?: boolean | undefined;
    tailscale?: boolean | undefined;
}>;
export declare const frpConfigSchema: z.ZodObject<{
    executablePath: z.ZodOptional<z.ZodString>;
    serverAddress: z.ZodOptional<z.ZodString>;
    serverPort: z.ZodOptional<z.ZodNumber>;
    authMethod: z.ZodDefault<z.ZodEnum<["token", "oidc", "none"]>>;
    tokenSecretRef: z.ZodOptional<z.ZodString>;
    stcpSecretRef: z.ZodOptional<z.ZodString>;
    transport: z.ZodDefault<z.ZodEnum<["http", "https", "stcp"]>>;
    customDomain: z.ZodOptional<z.ZodString>;
    tlsEnabled: z.ZodDefault<z.ZodBoolean>;
    startWithDsh: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    authMethod: "none" | "token" | "oidc";
    transport: "http" | "https" | "stcp";
    tlsEnabled: boolean;
    startWithDsh: boolean;
    executablePath?: string | undefined;
    serverAddress?: string | undefined;
    serverPort?: number | undefined;
    tokenSecretRef?: string | undefined;
    stcpSecretRef?: string | undefined;
    customDomain?: string | undefined;
}, {
    executablePath?: string | undefined;
    serverAddress?: string | undefined;
    serverPort?: number | undefined;
    authMethod?: "none" | "token" | "oidc" | undefined;
    tokenSecretRef?: string | undefined;
    stcpSecretRef?: string | undefined;
    transport?: "http" | "https" | "stcp" | undefined;
    customDomain?: string | undefined;
    tlsEnabled?: boolean | undefined;
    startWithDsh?: boolean | undefined;
}>;
export declare const configSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodLiteral<1>>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    listenPort: z.ZodDefault<z.ZodNumber>;
    listeners: z.ZodDefault<z.ZodObject<{
        local: z.ZodDefault<z.ZodBoolean>;
        lan: z.ZodDefault<z.ZodBoolean>;
        tailscale: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        local: boolean;
        lan: boolean;
        tailscale: boolean;
    }, {
        local?: boolean | undefined;
        lan?: boolean | undefined;
        tailscale?: boolean | undefined;
    }>>;
    tunnelEnabled: z.ZodDefault<z.ZodBoolean>;
    target: z.ZodDefault<z.ZodObject<{
        host: z.ZodDefault<z.ZodEffects<z.ZodString, string, string>>;
        port: z.ZodDefault<z.ZodNumber>;
        protocol: z.ZodDefault<z.ZodEnum<["http", "https"]>>;
    }, "strip", z.ZodTypeAny, {
        host: string;
        port: number;
        protocol: "http" | "https";
    }, {
        host?: string | undefined;
        port?: number | undefined;
        protocol?: "http" | "https" | undefined;
    }>>;
    publicBaseUrl: z.ZodOptional<z.ZodString>;
    trustedProxyCidrs: z.ZodDefault<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
    sessionTtlMinutes: z.ZodDefault<z.ZodNumber>;
    maxRequestBodyBytes: z.ZodDefault<z.ZodNumber>;
    adminConfigured: z.ZodDefault<z.ZodBoolean>;
    adminPasswordSecretRef: z.ZodOptional<z.ZodString>;
    frp: z.ZodOptional<z.ZodObject<{
        executablePath: z.ZodOptional<z.ZodString>;
        serverAddress: z.ZodOptional<z.ZodString>;
        serverPort: z.ZodOptional<z.ZodNumber>;
        authMethod: z.ZodDefault<z.ZodEnum<["token", "oidc", "none"]>>;
        tokenSecretRef: z.ZodOptional<z.ZodString>;
        stcpSecretRef: z.ZodOptional<z.ZodString>;
        transport: z.ZodDefault<z.ZodEnum<["http", "https", "stcp"]>>;
        customDomain: z.ZodOptional<z.ZodString>;
        tlsEnabled: z.ZodDefault<z.ZodBoolean>;
        startWithDsh: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        authMethod: "none" | "token" | "oidc";
        transport: "http" | "https" | "stcp";
        tlsEnabled: boolean;
        startWithDsh: boolean;
        executablePath?: string | undefined;
        serverAddress?: string | undefined;
        serverPort?: number | undefined;
        tokenSecretRef?: string | undefined;
        stcpSecretRef?: string | undefined;
        customDomain?: string | undefined;
    }, {
        executablePath?: string | undefined;
        serverAddress?: string | undefined;
        serverPort?: number | undefined;
        authMethod?: "none" | "token" | "oidc" | undefined;
        tokenSecretRef?: string | undefined;
        stcpSecretRef?: string | undefined;
        transport?: "http" | "https" | "stcp" | undefined;
        customDomain?: string | undefined;
        tlsEnabled?: boolean | undefined;
        startWithDsh?: boolean | undefined;
    }>>;
    customCommandEnabled: z.ZodDefault<z.ZodBoolean>;
    customCommand: z.ZodOptional<z.ZodObject<{
        command: z.ZodString;
        args: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        command: string;
        args: string[];
    }, {
        command: string;
        args: string[];
    }>>;
}, "strict", z.ZodTypeAny, {
    trustedProxyCidrs: string[];
    sessionTtlMinutes: number;
    maxRequestBodyBytes: number;
    enabled: boolean;
    tunnelEnabled: boolean;
    listenPort: number;
    target: {
        host: string;
        port: number;
        protocol: "http" | "https";
    };
    listeners: {
        local: boolean;
        lan: boolean;
        tailscale: boolean;
    };
    customCommandEnabled: boolean;
    version: 1;
    adminConfigured: boolean;
    publicBaseUrl?: string | undefined;
    adminPasswordSecretRef?: string | undefined;
    customCommand?: {
        command: string;
        args: string[];
    } | undefined;
    frp?: {
        authMethod: "none" | "token" | "oidc";
        transport: "http" | "https" | "stcp";
        tlsEnabled: boolean;
        startWithDsh: boolean;
        executablePath?: string | undefined;
        serverAddress?: string | undefined;
        serverPort?: number | undefined;
        tokenSecretRef?: string | undefined;
        stcpSecretRef?: string | undefined;
        customDomain?: string | undefined;
    } | undefined;
}, {
    publicBaseUrl?: string | undefined;
    trustedProxyCidrs?: string[] | undefined;
    sessionTtlMinutes?: number | undefined;
    maxRequestBodyBytes?: number | undefined;
    adminPasswordSecretRef?: string | undefined;
    customCommand?: {
        command: string;
        args: string[];
    } | undefined;
    enabled?: boolean | undefined;
    tunnelEnabled?: boolean | undefined;
    listenPort?: number | undefined;
    frp?: {
        executablePath?: string | undefined;
        serverAddress?: string | undefined;
        serverPort?: number | undefined;
        authMethod?: "none" | "token" | "oidc" | undefined;
        tokenSecretRef?: string | undefined;
        stcpSecretRef?: string | undefined;
        transport?: "http" | "https" | "stcp" | undefined;
        customDomain?: string | undefined;
        tlsEnabled?: boolean | undefined;
        startWithDsh?: boolean | undefined;
    } | undefined;
    target?: {
        host?: string | undefined;
        port?: number | undefined;
        protocol?: "http" | "https" | undefined;
    } | undefined;
    listeners?: {
        local?: boolean | undefined;
        lan?: boolean | undefined;
        tailscale?: boolean | undefined;
    } | undefined;
    customCommandEnabled?: boolean | undefined;
    version?: 1 | undefined;
    adminConfigured?: boolean | undefined;
}>;
export type RemoteAccessConfig = z.infer<typeof configSchema>;
export declare function isLoopbackHost(host: string): boolean;
export declare function hasDirectListener(listeners: RemoteAccessConfig['listeners']): boolean;
/** Tailscale hands out addresses from the 100.64.0.0/10 carrier-grade NAT range. */
export declare function isTailscaleAddress(address: string): boolean;
/**
 * Addresses the gateway binds for the enabled modes. Every mode shares one port, so the
 * firewall only ever needs a single port number open.
 */
export declare function resolveBindAddresses(config: RemoteAccessConfig, addresses?: import("./network/addresses.js").NetworkAddress[]): string[];
export declare function assertSafeConfig(value: unknown): RemoteAccessConfig;
export declare function migrateConfig(value: unknown): RemoteAccessConfig;
export declare function validateFrpcPath(path: string): void;
//# sourceMappingURL=config.d.ts.map