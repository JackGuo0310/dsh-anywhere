import { type RemoteAccessConfig } from '../config.js';
export declare class RemoteGateway {
    private readonly config;
    private readonly authenticatedUrl?;
    private server;
    private readonly sockets;
    private readonly auth;
    private readonly allowedAuthorities;
    private readonly wildcardListen;
    private readonly upstreamSessions;
    private readonly pendingUpstreamSessions;
    private readonly sessionGenerations;
    private authEpoch;
    constructor(config: RemoteAccessConfig, passwordHash?: string, authenticatedUrl?: (() => string) | undefined);
    start(): Promise<void>;
    stop(): Promise<void>;
    bootstrapAdmin(password: string): Promise<string>;
    changeAdminPassword(currentPassword: string, nextPassword: string): Promise<string>;
    passwordRecord(): string | undefined;
    revokeAllSessions(): void;
    /** Drop cached upstream cookies whose gateway session is gone or expired. */
    private pruneUpstreamSessions;
    private privateCookie;
    private writeSecurity;
    private json;
    private showLogin;
    private loginRedirect;
    private readJson;
    private handle;
    private handleUpgrade;
}
//# sourceMappingURL=remote-gateway.d.ts.map