import { createHash, randomBytes } from 'node:crypto';
export class SessionStore {
    sessions = new Map();
    create(ttlMinutes, now = Date.now()) {
        this.clearExpired(now);
        const session = { id: randomBytes(32).toString('base64url'), csrfToken: randomBytes(24).toString('base64url'), expiresAt: now + ttlMinutes * 60_000 };
        this.sessions.set(this.hash(session.id), session);
        return session;
    }
    get(id, now = Date.now()) {
        if (!id)
            return undefined;
        const session = this.sessions.get(this.hash(id));
        if (!session || session.expiresAt <= now) {
            if (session)
                this.sessions.delete(this.hash(id));
            return undefined;
        }
        return session;
    }
    revoke(id) { if (id)
        this.sessions.delete(this.hash(id)); }
    revokeAll() { this.sessions.clear(); }
    count() { return this.sessions.size; }
    clearExpired(now = Date.now()) {
        for (const [key, session] of this.sessions)
            if (session.expiresAt <= now)
                this.sessions.delete(key);
    }
    hash(id) { return createHash('sha256').update(id).digest('base64url'); }
}
//# sourceMappingURL=session-store.js.map