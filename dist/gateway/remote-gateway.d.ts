import type { RemoteAccessConfig } from '../config.js';
export declare class RemoteGateway {
    private readonly config;
    private server;
    private readonly sockets;
    private readonly auth;
    private readonly allowedAuthorities;
    constructor(config: RemoteAccessConfig, passwordHash?: string);
    start(): Promise<void>;
    stop(): Promise<void>;
    bootstrapAdmin(password: string): Promise<string>;
    changeAdminPassword(currentPassword: string, nextPassword: string): Promise<string>;
    passwordRecord(): string | undefined;
    revokeAllSessions(): void;
    private writeSecurity;
    private json;
    private showLogin;
    private loginRedirect;
    private readJson;
    private handle;
    private handleUpgrade;
}
//# sourceMappingURL=remote-gateway.d.ts.map