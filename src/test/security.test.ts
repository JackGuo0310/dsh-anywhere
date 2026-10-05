import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from '../security/password.js'
import { SessionStore } from '../security/session-store.js'
import { SlidingWindowRateLimiter } from '../security/rate-limit.js'
import { redactValue } from '../security/redact.js'
import { canonicalAuthority, isTrustedProxy, parseCookies } from '../security/request-policy.js'
import { AuthService } from '../security/auth.js'

test('password hash verifies only the original password', async () => {
  const hash = await hashPassword('correct horse battery staple')
  assert.equal(await verifyPassword('correct horse battery staple', hash), true)
  assert.equal(await verifyPassword('incorrect horse battery staple', hash), false)
  await assert.rejects(() => hashPassword('short'), /12 characters/)
})

test('password change verifies the current password and revokes sessions', async () => {
  const auth = new AuthService({ passwordHash: await hashPassword('correct horse battery staple'), sessionTtlMinutes: 60, secureCookie: false, trustedProxies: [] })
  const session = auth.sessions.create(60)
  await assert.rejects(() => auth.changePassword('wrong password', 'another correct horse battery staple'), /invalid/i)
  await assert.rejects(() => auth.changePassword('correct horse battery staple', 'short'), /12 characters/i)
  const replacement = await auth.changePassword('correct horse battery staple', 'another correct horse battery staple')
  assert.equal(await verifyPassword('another correct horse battery staple', replacement), true)
  assert.equal(auth.sessions.get(session.id), undefined)
})

test('session store uses opaque id and expires sessions', () => {
  const sessions = new SessionStore()
  const session = sessions.create(1, 1_000)
  assert.ok(sessions.get(session.id, 2_000))
  assert.equal(sessions.get(session.id, 62_000), undefined)
})

test('rate limiter blocks after configured budget', () => {
  const limiter = new SlidingWindowRateLimiter(2, 1_000)
  assert.equal(limiter.check('a', 0).allowed, true)
  assert.equal(limiter.check('a', 1).allowed, true)
  assert.equal(limiter.check('a', 2).allowed, false)
  assert.equal(limiter.check('a', 1_001).allowed, true)
})

test('redaction and authority parsing avoid accidental disclosures', () => {
  assert.deepEqual(redactValue({ password: 'secret', label: 'ok' }), { password: '[REDACTED]', label: 'ok' })
  assert.equal(parseCookies('a=1; b=hello%20world').b, 'hello world')
  assert.deepEqual(parseCookies('bad=%; good=value'), { good: 'value' })
  assert.equal(canonicalAuthority('EXAMPLE.test:443'), 'example.test:443')
  assert.equal(canonicalAuthority('user@example.test'), undefined)
  assert.equal(isTrustedProxy('192.168.1.42', ['192.168.1.0/24']), true)
  assert.equal(isTrustedProxy('192.168.2.42', ['192.168.1.0/24']), false)
  assert.equal(isTrustedProxy('::ffff:10.2.3.4', ['10.0.0.0/8']), true)
})
