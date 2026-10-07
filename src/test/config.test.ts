import test from 'node:test'
import assert from 'node:assert/strict'
import { assertSafeConfig, isTailscaleAddress, resolveBindAddresses } from '../config.js'

test('enabled gateway requires an administrator password reference', () => {
  assert.throws(() => assertSafeConfig({ enabled: true }), /credential reference/i)
})

test('private upstream authentication only exchanges tokens with a local HTTP listener', () => {
  assert.throws(() => assertSafeConfig({ enabled: true, target: { host: 'evil.example', port: 3000, protocol: 'http' }, adminPasswordSecretRef: 'DSH_REMOTE_HASH' }), /loopback/)
  assert.throws(() => assertSafeConfig({ enabled: true, target: { host: '127.0.0.1', port: 3000, protocol: 'https' }, adminPasswordSecretRef: 'DSH_REMOTE_HASH' }), /local HTTP/)
})

test('an enabled gateway needs at least one access mode', () => {
  assert.throws(() => assertSafeConfig({ enabled: true, adminPasswordSecretRef: 'DSH_REMOTE_HASH', listeners: { local: false, lan: false, tailscale: false } }), /at least one access mode/i)
  assert.equal(assertSafeConfig({ enabled: true, adminPasswordSecretRef: 'DSH_REMOTE_HASH', listeners: { local: true, lan: true, tailscale: true } }).listeners.lan, true)
})

test('the public tunnel keeps the local listener, because it forwards there', () => {
  const frp = { executablePath: process.execPath, serverAddress: 'frp.example', serverPort: 7000, tokenSecretRef: 'FRP_TOKEN', customDomain: 'dsh.example' }
  assert.throws(() => assertSafeConfig({ enabled: true, adminPasswordSecretRef: 'DSH_REMOTE_HASH', tunnelEnabled: true, publicBaseUrl: 'https://dsh.example', frp, listeners: { local: false, lan: true, tailscale: false } }), /local access mode must stay enabled/i)
})

test('tunnel requires HTTPS public address and provider', () => {
  assert.throws(() => assertSafeConfig({ tunnelEnabled: true, adminConfigured: true, publicBaseUrl: 'http://example.test' }), /HTTPS/)
  assert.throws(() => assertSafeConfig({ tunnelEnabled: true, adminConfigured: true, publicBaseUrl: 'https://example.test' }), /provider/)
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

test('Tailscale addresses are recognised from the carrier-grade NAT range', () => {
  assert.equal(isTailscaleAddress('100.64.0.1'), true)
  assert.equal(isTailscaleAddress('100.127.255.254'), true)
  assert.equal(isTailscaleAddress('100.63.0.1'), false)
  assert.equal(isTailscaleAddress('100.128.0.1'), false)
  assert.equal(isTailscaleAddress('192.168.1.5'), false)
  assert.equal(isTailscaleAddress('fd7a:115c:a1e0::1'), false)
})

test('listeners resolve to one shared port on several addresses', () => {
  // listLanAddresses never reports loopback, so the fixture must not either.
  const interfaces = [
    { address: '192.168.1.5', family: 'IPv4' as const, interface: 'Ethernet' },
    { address: '100.101.102.103', family: 'IPv4' as const, interface: 'Tailscale' },
    { address: 'fd7a:115c:a1e0::1', family: 'IPv6' as const, interface: 'Tailscale' },
  ]
  assert.deepEqual(resolveBindAddresses(assertSafeConfig({ listeners: { local: true, lan: false, tailscale: false } }), interfaces), ['127.0.0.1'])
  assert.deepEqual(resolveBindAddresses(assertSafeConfig({ listeners: { local: false, lan: true, tailscale: false } }), interfaces), ['192.168.1.5'])
  assert.deepEqual(resolveBindAddresses(assertSafeConfig({ listeners: { local: false, lan: false, tailscale: true } }), interfaces), ['100.101.102.103'])
  assert.deepEqual(resolveBindAddresses(assertSafeConfig({ listeners: { local: true, lan: true, tailscale: true } }), interfaces), ['127.0.0.1', '192.168.1.5', '100.101.102.103'])
})

test('legacy listenHost and mode settings migrate to listeners and a tunnel switch', () => {
  assert.deepEqual(assertSafeConfig({ listenHost: '127.0.0.1', mode: 'loopback' }).listeners, { local: true, lan: false, tailscale: false })
  assert.deepEqual(assertSafeConfig({ listenHost: '0.0.0.0', mode: 'lan' }).listeners, { local: true, lan: true, tailscale: true })
  assert.deepEqual(assertSafeConfig({ listenHost: '192.168.1.5', mode: 'lan' }).listeners, { local: false, lan: true, tailscale: false })
  assert.deepEqual(assertSafeConfig({ listenHost: '100.101.102.103', mode: 'tailscale' }).listeners, { local: false, lan: false, tailscale: true })
  const tunnel = assertSafeConfig({ listenHost: '127.0.0.1', mode: 'tunnel', publicBaseUrl: 'https://example.test', frp: { executablePath: process.execPath, serverAddress: 'frp.example', serverPort: 7000, tokenSecretRef: 'FRP_TOKEN', customDomain: 'dsh.example' } })
  assert.equal(tunnel.tunnelEnabled, true)
  assert.equal(tunnel.listeners.local, true)
})

test('safe loopback configuration has secure defaults', () => {
  const config = assertSafeConfig({})
  assert.deepEqual(config.listeners, { local: true, lan: false, tailscale: false })
  assert.equal(config.tunnelEnabled, false)
  assert.equal(config.enabled, false)
})
