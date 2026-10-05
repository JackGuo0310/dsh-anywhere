import test from 'node:test'
import assert from 'node:assert/strict'
import { assertSafeConfig } from '../config.js'

test('external listener requires administrator configuration', () => {
  assert.throws(() => assertSafeConfig({ enabled: true, listenHost: '0.0.0.0' }), /administrator/i)
})

test('tunnel requires HTTPS public address and provider', () => {
  assert.throws(() => assertSafeConfig({ mode: 'tunnel', adminConfigured: true, publicBaseUrl: 'http://example.test' }), /HTTPS/)
  assert.throws(() => assertSafeConfig({ mode: 'tunnel', adminConfigured: true, publicBaseUrl: 'https://example.test' }), /provider/)
})

test('safe loopback configuration has secure defaults', () => {
  const config = assertSafeConfig({})
  assert.equal(config.listenHost, '127.0.0.1')
  assert.equal(config.enabled, false)
})
