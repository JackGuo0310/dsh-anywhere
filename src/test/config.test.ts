import test from 'node:test'
import assert from 'node:assert/strict'
import { assertSafeConfig } from '../config.js'

test('enabled gateway requires an administrator password reference', () => {
  assert.throws(() => assertSafeConfig({ enabled: true }), /credential reference/i)
})

test('external listener requires administrator configuration and password reference', () => {
  assert.throws(() => assertSafeConfig({ enabled: true, listenHost: '0.0.0.0' }), /credential reference/i)
  assert.throws(() => assertSafeConfig({ enabled: true, listenHost: '0.0.0.0', adminPasswordSecretRef: 'DSH_REMOTE_HASH' }), /administrator/i)
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

test('safe loopback configuration has secure defaults', () => {
  const config = assertSafeConfig({})
  assert.equal(config.listenHost, '127.0.0.1')
  assert.equal(config.enabled, false)
})
