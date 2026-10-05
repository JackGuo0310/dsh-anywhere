export interface RateLimitResult {
    allowed: boolean;
    retryAfterSeconds: number;
}
export declare class SlidingWindowRateLimiter {
    private readonly limit;
    private readonly windowMs;
    private readonly counters;
    constructor(limit?: number, windowMs?: number);
    check(key: string, now?: number): RateLimitResult;
    reset(key: string): void;
    clearExpired(now?: number): void;
}
//# sourceMappingURL=rate-limit.d.ts.map