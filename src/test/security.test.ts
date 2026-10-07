import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from '../security/password.js'
import { SessionStore } from '../security/session-store.js'
import { SlidingWindowRateLimiter } from '../security/rate-limit.js'
import { redactValue } from '../security/redact.js'
import { canonicalAuthority, isTrustedProxy, parseCookies, effectiveAuthority, remoteClientIp, hostAllowed } from '../security/request-policy.js'
import type { IncomingMessage } from 'node:http'
import { AuthService, normalizeAuthority } from '../security/auth.js'

test('each listener authority is matched exactly', () => {
  const authorities = ['127.0.0.1:4173', 'localhost:4173', '192.168.1.5:4173', '100.101.102.103:4173', 'dsh.example.com']
  const requestFor = (host: string) => ({ socket: { remoteAddress: '127.0.0.1' }, headers: { host } }) as unknown as IncomingMessage
  for (const authority of authorities) assert.equal(hostAllowed(requestFor(authority), authorities, []), true, `${authority} must be accepted`)
  for (const rejected of ['192.168.1.6:4173', 'evil.example:4173', '100.101.102.103:4174', 'dsh.example.com:4173']) {
    assert.equal(hostAllowed(requestFor(rejected), authorities, []), false, `${rejected} must be rejected`)
  }
})

test('loopback aliases name one logical entry', () => {
  assert.equal(normalizeAuthority('localhost:4173'), '127.0.0.1:4173')
  assert.equal(normalizeAuthority('localhost'), '127.0.0.1')
  assert.equal(normalizeAuthority('192.168.1.5:4173'), '192.168.1.5:4173')
})

test('a session authenticates only the entry that created it', () => {
  const sessions = new SessionStore()
  const session = sessions.create(60, '127.0.0.1:4173')
  assert.ok(sessions.get(session.id, '127.0.0.1:4173'))
  assert.equal(sessions.get(session.id, 'dsh.example.com'), undefined)
  assert.equal(sessions.get(session.id, '192.168.1.5:4173'), undefined)
  // Internal bookkeeping still sees the session regardless of entry.
  assert.ok(sessions.find(session.id))
})

test('trusted proxy rejects ambiguous forwarding chains', () => {
  const request = { socket: { remoteAddress: '127.0.0.1' }, headers: { host: '127.0.0.1:4173', 'x-forwarded-host': 'good.example, evil.example', 'x-forwarded-for': '203.0.113.1, 192.168.1.2' } } as unknown as IncomingMessage
  assert.equal(effectiveAuthority(request, ['127.0.0.1']), undefined)
  assert.equal(remoteClientIp(request, ['127.0.0.1']), '127.0.0.1')
})

test('password hash verifies only the original password', async () => {
  const hash = await hashPassword('correct horse battery staple')
  assert.equal(await verifyPassword('correct horse battery staple', hash), true)
  assert.equal(await verifyPassword('incorrect horse battery staple', hash), false)
  await assert.rejects(() => hashPassword('short'), /10 characters/)
})

test('password bootstrap requires ten characters and can run only once', async () => {
  const auth = new AuthService({ sessionTtlMinutes: 60, trustedProxies: [] })
  await assert.rejects(() => auth.bootstrap('too-short'), /10 characters/i)
  await auth.bootstrap('ten-chars!')
  assert.equal(auth.configured, true)
  await assert.rejects(() => auth.bootstrap('another password'), /already configured/i)
})

test('password change verifies the current password and revokes sessions', async () => {
  const auth = new AuthService({ passwordHash: await hashPassword('correct horse battery staple'), sessionTtlMinutes: 60, trustedProxies: [] })
  const session = auth.sessions.create(60, '127.0.0.1:4173')
  await assert.rejects(() => auth.changePassword('wrong password', 'another correct horse battery staple'), /invalid/i)
  await assert.rejects(() => auth.changePassword('correct horse battery staple', 'short'), /10 characters/i)
  const replacement = await auth.changePassword('correct horse battery staple', 'another correct horse battery staple')
  assert.equal(await verifyPassword('another correct horse battery staple', replacement), true)
  assert.equal(auth.sessions.find(session.id), undefined)
})

test('session store uses opaque id and expires sessions', () => {
  const sessions = new SessionStore()
  const session = sessions.create(1, '127.0.0.1:4173', 1_000)
  assert.ok(sessions.get(session.id, '127.0.0.1:4173', 2_000))
  assert.equal(sessions.get(session.id, '127.0.0.1:4173', 62_000), undefined)
})

test('session store bounds retained sessions and evicts the oldest', () => {
  const sessions = new SessionStore()
  const first = sessions.create(60, '127.0.0.1:4173')
  for (let index = 0; index < 1_024; index++) sessions.create(60, '127.0.0.1:4173')
  assert.equal(sessions.count(), 1_024)
  assert.equal(sessions.find(first.id), undefined)
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
  assert.equal(isTrustedProxy('fd12:3456:789a::42', ['fd12:3456:789a::/48']), true)
  assert.equal(isTrustedProxy('fd12:3456:789b::42', ['fd12:3456:789a::/48']), false)
})
