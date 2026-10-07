import test from 'node:test'
import assert from 'node:assert/strict'
import { assertSafeConfig } from '../config.js'

test('enabled gateway requires an administrator password reference', () => {
  assert.throws(() => assertSafeConfig({ enabled: true }), /credential reference/i)
})

test('private upstream authentication only exchanges tokens with a local HTTP listener', () => {
  assert.throws(() => assertSafeConfig({ enabled: true, target: { host: 'evil.example', port: 3000, protocol: 'http' }, adminPasswordSecretRef: 'DSH_REMOTE_HASH' }), /loopback/)
  assert.throws(() => assertSafeConfig({ enabled: true, target: { host: '127.0.0.1', port: 3000, protocol: 'https' }, adminPasswordSecretRef: 'DSH_REMOTE_HASH' }), /local HTTP/)
})

test('external listener requires a password credential reference', () => {
  assert.throws(() => assertSafeConfig({ enabled: true, listenHost: '0.0.0.0' }), /credential reference/i)
  assert.equal(assertSafeConfig({ enabled: true, listenHost: '0.0.0.0', adminPasswordSecretRef: 'DSH_REMOTE_HASH' }).listenHost, '0.0.0.0')
})

test('tunnel requires HTTPS public address and provider', () => {
  assert.throws(() => assertSafeConfig({ mode: 'tunnel', adminConfigured: true, publicBaseUrl: 'http://example.test' }), /HTTPS/)
  assert.throws(() => assertSafeConfig({ mode: 'tunnel', adminConfigured: true, publicBaseUrl: 'https://example.test' }), /provider/)
})

test('FRP configuration fails closed when incomplete or ambiguous', () => {
  assert.throws(() => assertSafeConfig({ frp: {} }), /executablePath/i)
  assert.throws(() => assertSafeConfig({ frp: { executablePath: 'missing-frpc', serverAddress: 'frp.example', serverPort: 7000 } }), /tokenSecretRef/i)
  assert.throws(() => assertSafeConfig({ frp: { executablePath: 'missing-frpc', serverAddress: 'frp.example', serverPort: 7000, tokenSecretRef: 'FRP_TOKEN', customDomain: 'dsh.example' }, customCommandEnabled: true, customCommand: { command: 'x', args: [] } }), /exactly one/i)
})

test('trusted proxy entries require valid IP addresses or CIDRs', () => {
  assert.throws(() => assertSafeConfig({ trustedProxyCidrs: ['proxy.local'] }), /trusted proxy/i)
  assert.throws(() => assertSafeConfig({ trustedProxyCidrs: ['10.0.0.0/33'] }), /trusted proxy/i)
  assert.deepEqual(assertSafeConfig({ trustedProxyCidrs: ['10.0.0.0/8', 'fd00::/8'] }).trustedProxyCidrs, ['10.0.0.0/8', 'fd00::/8'])
})

test('safe loopback configuration has secure defaults', () => {
  const config = assertSafeConfig({})
  assert.equal(config.listenHost, '127.0.0.1')
  assert.equal(config.enabled, false)
})
