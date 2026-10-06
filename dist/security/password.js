import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
function scrypt(password, salt, length, options) {
    return new Promise((resolve, reject) => {
        scryptCallback(password, salt, length, options, (error, derived) => error ? reject(error) : resolve(derived));
    });
}
const KEY_LENGTH = 32;
const N = 1 << 15;
const R = 8;
const P = 1;
/**
 * Versioned scrypt fallback. Deployments that package argon2 may replace this
 * implementation without changing stored-password handling; secrets never
 * leave this module.
 */
export async function hashPassword(password) {
    if (password.length < 10)
        throw new Error('Administrator password must contain at least 10 characters.');
    const salt = randomBytes(16);
    const derived = await scrypt(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: 256 * N * R });
    return `scrypt$v1$${N}$${R}$${P}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}
export async function verifyPassword(password, encoded) {
    const [algorithm, version, n, r, p, saltText, hashText] = encoded.split('$');
    if (algorithm !== 'scrypt' || version !== 'v1' || !n || !r || !p || !saltText || !hashText)
        return false;
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    const derived = await scrypt(password, salt, expected.length, {
        N: Number(n), r: Number(r), p: Number(p), maxmem: 256 * Number(n) * Number(r)
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
}
//# sourceMappingURL=password.js.map