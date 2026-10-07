import { type RemoteAccessConfig } from '../config.js';
export declare class RemoteGateway {
    private config;
    private authenticatedUrl?;
    /** One server per bound address; a config change only touches the addresses that changed. */
    private readonly servers;
    private readonly sockets;
    /** Sockets per bound address, so releasing one listener never touches another's traffic. */
    private readonly addressSockets;
    private readonly auth;
    private allowedAuthorities;
    private boundAddresses;
    private publicAuthority;
    private readonly upstreamSessions;
    private readonly pendingUpstreamSessions;
    private readonly sessionGenerations;
    private authEpoch;
    constructor(config: RemoteAccessConfig, passwordHash?: string, authenticatedUrl?: (() => string) | undefined);
    start(): Promise<void>;
    /**
     * Adopt a new configuration without dropping unrelated connections. Existing listeners and
     * their live sockets stay up; only added addresses bind and only removed ones close. Sessions
     * survive, so saving settings does not log every browser out.
     */
    reconfigure(config: RemoteAccessConfig, passwordHash?: string, authenticatedUrl?: () => string): Promise<void>;
    /** Bind newly enabled addresses and release disabled ones, leaving everything else untouched. */
    private syncListeners;
    private release;
    private listen;
    stop(): Promise<void>;
    bootstrapAdmin(password: string): Promise<string>;
    changeAdminPassword(currentPassword: string, nextPassword: string): Promise<string>;
    passwordRecord(): string | undefined;
    revokeAllSessions(): void;
    /** Addresses this gateway actually bound, for the settings page. */
    boundAuthorities(): string[];
    /** Raw bound addresses, so the settings page can show which mode covers which address. */
    listenAddresses(): string[];
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