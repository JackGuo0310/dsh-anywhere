export interface Session {
    id: string;
    csrfToken: string;
    expiresAt: number;
    /** Authority (host:port) this session was created on. Other entries cannot reuse it. */
    authority: string;
}
export declare class SessionStore {
    private readonly sessions;
    private readonly maxSessions;
    create(ttlMinutes: number, authority: string, now?: number): Session;
    get(id: string | undefined, authority: string, now?: number): Session | undefined;
    /** Session lookup without the entry check, for internal bookkeeping only. */
    find(id: string | undefined, now?: number): Session | undefined;
    revoke(id: string | undefined): void;
    revokeAll(): void;
    count(): number;
    clearExpired(now?: number): void;
    private hash;
}
//# sourceMappingURL=session-store.d.ts.map