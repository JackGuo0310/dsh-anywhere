/**
 * Versioned scrypt fallback. Deployments that package argon2 may replace this
 * implementation without changing stored-password handling; secrets never
 * leave this module.
 */
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, encoded: string): Promise<boolean>;
//# sourceMappingURL=password.d.ts.map