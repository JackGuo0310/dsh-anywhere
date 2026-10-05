import type { IncomingMessage, ServerResponse } from 'node:http';
import { SessionStore } from './session-store.js';
export interface AuthOptions {
    passwordHash?: string;
    sessionTtlMinutes: number;
    secureCookie: boolean;
    trustedProxies: string[];
}
export declare class AuthService {
    private readonly options;
    private passwordHash;
    readonly sessions: SessionStore;
    private readonly ipLimiter;
    private readonly accountLimiter;
    constructor(options: AuthOptions);
    get configured(): boolean;
    bootstrap(password: string): Promise<void>;
    changePassword(currentPassword: string, nextPassword: string): Promise<string>;
    login(username: string, password: string, req: IncomingMessage): Promise<{
        ok: boolean;
        retryAfterSeconds?: number;
        session?: {
            id: string;
            csrfToken: string;
        };
    }>;
    requireSession(req: IncomingMessage): {
        id: string;
        csrfToken: string;
    } | undefined;
    requireCsrf(req: IncomingMessage): boolean;
    setSessionCookie(res: ServerResponse, sessionId: string): void;
    clearSessionCookie(res: ServerResponse): void;
    logout(req: IncomingMessage, res: ServerResponse): void;
    revokeAll(): void;
    passwordRecord(): string | undefined;
}
export declare const sessionCookieName = "__Host-dsh_remote_session";
//# sourceMappingURL=auth.d.ts.map