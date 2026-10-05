import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { WebSocket, WebSocketServer } from 'ws'
import { RemoteGateway } from '../gateway/remote-gateway.js'
import { hashPassword } from '../security/password.js'
import type { RemoteAccessConfig } from '../config.js'

async function listen(server: ReturnType<typeof createServer>): Promise<number> {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected TCP listener')
  return address.port
}

function config(targetPort: number, listenPort: number): RemoteAccessConfig {
  return {
    version: 1, enabled: true, listenHost: '127.0.0.1', listenPort, mode: 'loopback',
    target: { host: '127.0.0.1', port: targetPort, protocol: 'http' }, publicBaseUrl: undefined,
    trustedProxyCidrs: [], sessionTtlMinutes: 60, maxRequestBodyBytes: 1_024_000,
    adminConfigured: true, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH', frp: undefined,
    customCommandEnabled: false, customCommand: undefined,
  }
}

async function login(base: string): Promise<{ cookie: string; csrfToken: string }> {
  const response = await fetch(`${base}/_dsh_remote/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify({ username: 'admin', password: 'correct horse battery staple' }),
  })
  assert.equal(response.status, 200)
  const { csrfToken } = await response.json() as { csrfToken: string }
  const cookie = response.headers.get('set-cookie')?.split(';')[0]
  assert.ok(cookie)
  return { cookie, csrfToken }
}

function openSocket(url: string, headers: Record<string, string>): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, { headers })
    socket.once('open', () => resolve(socket))
    socket.once('error', reject)
  })
}

test('gateway authenticates then proxies HTTP and enforces CSRF logout', async () => {
  const upstream = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json', 'set-cookie': '__Host-dsh_remote_session=attacker; Path=/; HttpOnly' })
    res.end(JSON.stringify({ path: req.url, host: req.headers.host, cookie: req.headers.cookie, origin: req.headers.origin, csrf: req.headers['x-csrf-token'], forwardedFor: req.headers['x-forwarded-for'] }))
  })
  const upstreamPort = await listen(upstream)
  const probe = createServer()
  const gatewayPort = await listen(probe)
  await new Promise<void>((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))

  const gateway = new RemoteGateway(config(upstreamPort, gatewayPort), await hashPassword('correct horse battery staple'))
  await gateway.start()
  const base = `http://127.0.0.1:${gatewayPort}`
  try {
    const unauthenticated = await fetch(`${base}/app`)
    assert.equal(unauthenticated.status, 401)

    const { cookie, csrfToken } = await login(base)
    const proxied = await fetch(`${base}/app?x=1`, { headers: { cookie } })
    assert.equal(proxied.status, 200)
    assert.deepEqual(await proxied.json(), { path: '/app?x=1', host: `127.0.0.1:${upstreamPort}` })
    const stripped = await fetch(`${base}/headers`, { headers: { cookie, origin: base, 'x-csrf-token': csrfToken, 'x-forwarded-for': '203.0.113.8' } })
    assert.equal(stripped.headers.get('set-cookie'), null)
    assert.deepEqual(await stripped.json(), { path: '/headers', host: `127.0.0.1:${upstreamPort}` })
    const unsafeProxy = await fetch(`${base}/app`, { method: 'POST', headers: { cookie, origin: base } })
    assert.equal(unsafeProxy.status, 403)
    const safeProxy = await fetch(`${base}/app`, { method: 'POST', headers: { cookie, origin: base, 'x-csrf-token': csrfToken } })
    assert.equal(safeProxy.status, 200)
    const oversized = await fetch(`${base}/app`, { method: 'POST', headers: { cookie, origin: base, 'x-csrf-token': csrfToken }, body: 'x'.repeat(1_024_001) })
    assert.equal(oversized.status, 413)

    const badLogout = await fetch(`${base}/_dsh_remote/logout`, { method: 'POST', headers: { cookie, origin: base } })
    assert.equal(badLogout.status, 403)
    const logout = await fetch(`${base}/_dsh_remote/logout`, { method: 'POST', headers: { cookie, origin: base, 'x-csrf-token': csrfToken } })
    assert.equal(logout.status, 204)
    const afterLogout = await fetch(`${base}/app`, { headers: { cookie } })
    assert.equal(afterLogout.status, 401)
  } finally {
    await gateway.stop()
    await new Promise<void>((resolve, reject) => upstream.close((error) => error ? reject(error) : resolve()))
  }
})

test('gateway bridges authenticated WebSocket traffic', async () => {
  const upstream = createServer()
  const websocket = new WebSocketServer({ server: upstream })
  websocket.on('connection', (socket) => socket.on('message', (message) => socket.send(`echo:${message}`)))
  const upstreamPort = await listen(upstream)
  const probe = createServer()
  const gatewayPort = await listen(probe)
  await new Promise<void>((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  const gateway = new RemoteGateway(config(upstreamPort, gatewayPort), await hashPassword('correct horse battery staple'))
  await gateway.start()
  const base = `http://127.0.0.1:${gatewayPort}`
  try {
    const { cookie } = await login(base)
    const socket = await openSocket(`ws://127.0.0.1:${gatewayPort}/socket`, { cookie, origin: base })
    const echoed = await new Promise<string>((resolve, reject) => {
      socket.once('message', (message) => resolve(message.toString()))
      socket.once('error', reject)
      socket.send('hello')
    })
    assert.equal(echoed, 'echo:hello')
    socket.close()
  } finally {
    await gateway.stop()
    await new Promise<void>((resolve, reject) => upstream.close((error) => error ? reject(error) : resolve()))
  }
})
