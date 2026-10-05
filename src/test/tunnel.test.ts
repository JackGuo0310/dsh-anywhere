import test from 'node:test'
import assert from 'node:assert/strict'
import { generateFrpcToml } from '../tunnel/frp.js'
import { formatAddress } from '../network/addresses.js'
import { parseTailscaleStatus } from '../network/tailscale.js'

test('FRP config emits an explicit loopback target', () => {
  const toml = generateFrpcToml({
    target: { host: '127.0.0.1', port: 4173, protocol: 'http' },
    token: 'not logged',
    frp: { executablePath: '/usr/local/bin/frpc', serverAddress: 'frp.example.test', serverPort: 7000, authMethod: 'token', tokenSecretRef: 'FRP_TOKEN', transport: 'https', customDomain: 'dsh.example.test', tlsEnabled: true, startWithDsh: false }
  })
  assert.match(toml, /localIP = "127\.0\.0\.1"/)
  assert.match(toml, /customDomains = \["dsh\.example\.test"\]/)
})

test('STCP uses a separate visitor secret', () => {
  const toml = generateFrpcToml({
    target: { host: '127.0.0.1', port: 4173, protocol: 'http' },
    token: 'server-token',
    stcpSecret: 'visitor-secret',
    frp: { executablePath: '/usr/local/bin/frpc', serverAddress: 'frp.example.test', serverPort: 7000, authMethod: 'token', tokenSecretRef: 'FRP_TOKEN', stcpSecretRef: 'STCP_SECRET', transport: 'stcp', tlsEnabled: true, startWithDsh: false }
  })
  assert.match(toml, /token = "server-token"/)
  assert.match(toml, /secretKey = "visitor-secret"/)
})

test('tailscale parser reports addresses and magic DNS', () => {
  const status = parseTailscaleStatus(JSON.stringify({ BackendState: 'Running', Self: { TailscaleIPs: ['100.64.0.2', 'fd7a:115c:a1e0::1'], DNSName: 'machine.tailnet.ts.net.' } }))
  assert.equal(status.connected, true)
  assert.deepEqual(status.ipv4, ['100.64.0.2'])
  assert.equal(status.magicDnsName, 'machine.tailnet.ts.net')
})

test('IPv6 access URLs use brackets', () => assert.equal(formatAddress('fd7a::1', 4173), 'http://[fd7a::1]:4173'))
