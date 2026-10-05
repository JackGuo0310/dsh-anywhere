import { createHash, randomBytes } from 'node:crypto'

export interface Session {
  id: string
  csrfToken: string
  expiresAt: number
}

export class SessionStore {
  private readonly sessions = new Map<string, Session>()

  create(ttlMinutes: number, now = Date.now()): Session {
    const session = { id: randomBytes(32).toString('base64url'), csrfToken: randomBytes(24).toString('base64url'), expiresAt: now + ttlMinutes * 60_000 }
    this.sessions.set(this.hash(session.id), session)
    return session
  }

  get(id: string | undefined, now = Date.now()): Session | undefined {
    if (!id) return undefined
    const session = this.sessions.get(this.hash(id))
    if (!session || session.expiresAt <= now) {
      if (session) this.sessions.delete(this.hash(id))
      return undefined
    }
    return session
  }

  revoke(id: string | undefined): void { if (id) this.sessions.delete(this.hash(id)) }
  revokeAll(): void { this.sessions.clear() }
  count(): number { return this.sessions.size }

  private hash(id: string): string { return createHash('sha256').update(id).digest('base64url') }
}
