import { type RemoteAccessConfig } from '../config.js';
export declare class RemoteGateway {
    private readonly config;
    private readonly authenticatedUrl?;
    private readonly servers;
    private readonly sockets;
    private readonly auth;
    private allowedAuthorities;
    private publicAuthority;
    private readonly upstreamSessions;
    private readonly pendingUpstreamSessions;
    private readonly sessionGenerations;
    private authEpoch;
    constructor(config: RemoteAccessConfig, passwordHash?: string, authenticatedUrl?: (() => string) | undefined);
    start(): Promise<void>;
    private listen;
    stop(): Promise<void>;
    bootstrapAdmin(password: string): Promise<string>;
    changeAdminPassword(currentPassword: string, nextPassword: string): Promise<string>;
    passwordRecord(): string | undefined;
    revokeAllSessions(): void;
    /** Addresses this gateway actually bound, for the settings page. */
    boundAuthorities(): string[];
    /** Drop cached upstream cookies whose gateway session is gone or expired. */
    private pruneUpstreamSessions;
    private privateCookie;
    private writeSecurity;
    /** Chrome honours COOP only on HTTPS or a loopback origin; elsewhere it just warns. */
    private trustworthyOrigin;
    private json;
    private showLogin;
    private loginRedirect;
    private readJson;
    private handle;
    private handleUpgrade;
}
//# sourceMappingURL=remote-gateway.d.ts.map