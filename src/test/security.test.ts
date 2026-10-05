import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from '../security/password.js'
import { SessionStore } from '../security/session-store.js'
import { SlidingWindowRateLimiter } from '../security/rate-limit.js'
import { redactValue } from '../security/redact.js'
import { canonicalAuthority, parseCookies } from '../security/request-policy.js'

test('password hash verifies only the original password', async () => {
  const hash = await hashPassword('correct horse battery staple')
  assert.equal(await verifyPassword('correct horse battery staple', hash), true)
  assert.equal(await verifyPassword('incorrect horse battery staple', hash), false)
  await assert.rejects(() => hashPassword('short'), /12 characters/)
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
  assert.equal(canonicalAuthority('EXAMPLE.test:443'), 'example.test:443')
  assert.equal(canonicalAuthority('user@example.test'), undefined)
})
