import type { IncomingMessage, ServerResponse } from 'node:http';
import { SessionStore } from './session-store.js';
export interface AuthOptions {
    passwordHash?: string;
    sessionTtlMinutes: number;
    trustedProxies: string[];
}
/**
 * Every enabled access mode is its own entry with its own sessions, so a session taken
 * from one entry cannot authenticate another. Cookies ignore the port, so the loopback
 * aliases (`localhost` and `127.0.0.1`) are folded together.
 */
export declare function normalizeAuthority(authority: string): string;
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
    /** The entry a request arrived on, or undefined when its Host is not one of them. */
    entryAuthority(req: IncomingMessage): string | undefined;
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
    setSessionCookie(res: ServerResponse, sessionId: string, secure: boolean): void;
    clearSessionCookie(res: ServerResponse, secure: boolean): void;
    logout(req: IncomingMessage, res: ServerResponse, secure: boolean): void;
    revokeAll(): void;
    passwordRecord(): string | undefined;
}
export declare const sessionCookieName = "dsh_remote_session";
//# sourceMappingURL=auth.d.ts.map