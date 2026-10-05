export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

interface Counter { count: number; resetAt: number }

export class SlidingWindowRateLimiter {
  private readonly counters = new Map<string, Counter>()

  constructor(private readonly limit = 5, private readonly windowMs = 15 * 60_000) {}

  check(key: string, now = Date.now()): RateLimitResult {
    const counter = this.counters.get(key)
    if (!counter || now >= counter.resetAt) {
      this.counters.set(key, { count: 1, resetAt: now + this.windowMs })
      return { allowed: true, retryAfterSeconds: 0 }
    }
    if (counter.count >= this.limit) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((counter.resetAt - now) / 1_000)) }
    }
    counter.count += 1
    return { allowed: true, retryAfterSeconds: 0 }
  }

  reset(key: string): void { this.counters.delete(key) }
  clearExpired(now = Date.now()): void {
    for (const [key, counter] of this.counters) if (counter.resetAt <= now) this.counters.delete(key)
  }
}
