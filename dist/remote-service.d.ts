import { type RemoteAccessConfig } from './config.js';
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
type PasswordChangeRequest = {
    currentPassword?: unknown;
    newPassword?: unknown;
};
type CommonConfigRequest = {
    enabled?: unknown;
    mode?: unknown;
    listenHost?: unknown;
    listenPort?: unknown;
    targetPort?: unknown;
};
/** Host RPC surface. It never returns passwords, password hashes, tokens, or credential references. */
export declare class RemoteAccessService extends TypertRemoteService {
    private readonly config;
    private gateway;
    private tunnel;
    constructor(ctx: Context, config: RemoteAccessConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    status(): Promise<unknown>;
    saveCommonConfig(request: CommonConfigRequest): Promise<unknown>;
    discoverNetwork(): Promise<unknown>;
    detectTailscale(): Promise<unknown>;
    startTunnel(): Promise<unknown>;
    restartTunnel(): Promise<unknown>;
    changePassword(request: PasswordChangeRequest): Promise<unknown>;
    revokeAllSessions(): Promise<unknown>;
    private createTunnel;
    private credentials;
    private resolveCredential;
    private loadPasswordHash;
}
export {};
//# sourceMappingURL=remote-service.d.ts.map