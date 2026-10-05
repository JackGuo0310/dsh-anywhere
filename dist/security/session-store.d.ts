export interface Session {
    id: string;
    csrfToken: string;
    expiresAt: number;
}
export declare class SessionStore {
    private readonly sessions;
    create(ttlMinutes: number, now?: number): Session;
    get(id: string | undefined, now?: number): Session | undefined;
    revoke(id: string | undefined): void;
    revokeAll(): void;
    count(): number;
    private hash;
}
//# sourceMappingURL=session-store.d.ts.map