export class SlidingWindowRateLimiter {
    limit;
    windowMs;
    counters = new Map();
    constructor(limit = 5, windowMs = 15 * 60_000) {
        this.limit = limit;
        this.windowMs = windowMs;
    }
    check(key, now = Date.now()) {
        const counter = this.counters.get(key);
        if (!counter || now >= counter.resetAt) {
            this.counters.set(key, { count: 1, resetAt: now + this.windowMs });
            return { allowed: true, retryAfterSeconds: 0 };
        }
        if (counter.count >= this.limit) {
            return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((counter.resetAt - now) / 1_000)) };
        }
        counter.count += 1;
        return { allowed: true, retryAfterSeconds: 0 };
    }
    reset(key) { this.counters.delete(key); }
    clearExpired(now = Date.now()) {
        for (const [key, counter] of this.counters)
            if (counter.resetAt <= now)
                this.counters.delete(key);
    }
}
//# sourceMappingURL=rate-limit.js.map