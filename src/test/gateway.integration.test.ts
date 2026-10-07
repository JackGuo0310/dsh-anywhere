import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer, request as httpRequest } from 'node:http'
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

function config(targetPort: number, listenPort: number, listenHost = '127.0.0.1'): RemoteAccessConfig {
  return {
    version: 1, enabled: true, listenHost, listenPort, mode: 'direct',
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

/** `fetch` rewrites a Host header, so Host-header routing checks need a raw client. */
function requestWithHost(port: number, headers: Record<string, string>, method = 'GET', body?: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = httpRequest({ host: '127.0.0.1', port, path: '/_dsh_remote/health', method, headers }, (response) => { response.resume(); resolve(response.statusCode ?? 0) })
    request.on('error', reject)
    request.end(body)
  })
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
    const unsafeProxy = await fetch(`${base}/app`, { method: 'POST', headers: { cookie, origin: 'http://evil.example' } })
    assert.equal(unsafeProxy.status, 403)
    const nativeRpc = await fetch(`${base}/api`, { method: 'POST', headers: { cookie, origin: base } })
    assert.equal(nativeRpc.status, 200)
    const nativeFetch = await fetch(`${base}/api`, { method: 'POST', headers: { cookie, 'sec-fetch-site': 'same-origin' } })
    assert.equal(nativeFetch.status, 200)
    const crossSite = await fetch(`${base}/api`, { method: 'POST', headers: { cookie, 'sec-fetch-site': 'cross-site', origin: base } })
    assert.equal(crossSite.status, 403)
    const noOrigin = await fetch(`${base}/api`, { method: 'POST', headers: { cookie } })
    assert.equal(noOrigin.status, 403)
    const sameReferer = await fetch(`${base}/api`, { method: 'POST', headers: { cookie, referer: `${base}/` } })
    assert.equal(sameReferer.status, 200)
    const foreignReferer = await fetch(`${base}/api`, { method: 'POST', headers: { cookie, referer: 'http://evil.example/' } })
    assert.equal(foreignReferer.status, 403)
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

test('upstream response cannot override gateway security policy or redirect outside gateway', async () => {
  const upstream = createServer((req, res) => {
    const targets: Record<string, string> = {
      '/redirect-local': `http://127.0.0.1:${upstreamPort}/app`,
      '/redirect-relative': './app?x=1#frag',
      '/redirect-rooted': '/app',
      '/redirect-token': '/app?token=leaked',
      '/redirect-scheme': '//attacker.example/capture',
      '/redirect-protocol': 'javascript:alert(1)',
    }
    res.writeHead(302, { location: targets[req.url ?? ''] ?? 'https://attacker.example/capture', 'x-frame-options': 'ALLOWALL', 'access-control-allow-origin': '*', 'set-cookie': 'evil=1' })
    res.end()
  })
  const upstreamPort = await listen(upstream)
  const probe = createServer()
  const gatewayPort = await listen(probe)
  await new Promise<void>((resolve) => probe.close(() => resolve()))
  const gateway = new RemoteGateway(config(upstreamPort, gatewayPort), await hashPassword('correct horse battery staple'))
  await gateway.start()
  const base = `http://127.0.0.1:${gatewayPort}`
  try {
    const { cookie } = await login(base)
    const local = await fetch(`${base}/redirect-local`, { headers: { cookie }, redirect: 'manual' })
    assert.equal(local.status, 302)
    assert.equal(local.headers.get('location'), '/app')
    assert.equal(local.headers.get('x-frame-options'), 'DENY')
    assert.equal(local.headers.get('access-control-allow-origin'), null)
    assert.equal(local.headers.get('set-cookie'), null)
    const external = await fetch(`${base}/redirect-external`, { headers: { cookie }, redirect: 'manual' })
    assert.equal(external.status, 502)
    assert.equal(external.headers.get('location'), null)
    const relative = await fetch(`${base}/redirect-relative`, { headers: { cookie }, redirect: 'manual' })
    assert.equal(relative.status, 302)
    assert.equal(relative.headers.get('location'), '/app?x=1#frag')
    const rooted = await fetch(`${base}/redirect-rooted`, { headers: { cookie }, redirect: 'manual' })
    assert.equal(rooted.headers.get('location'), '/app')
    for (const unsafe of ['/redirect-token', '/redirect-scheme', '/redirect-protocol']) {
      const response = await fetch(`${base}${unsafe}`, { headers: { cookie }, redirect: 'manual' })
      assert.equal(response.status, 502, `${unsafe} must not reach the browser`)
      assert.equal(response.headers.get('location'), null)
    }
  } finally {
    await gateway.stop()
    await new Promise<void>((resolve) => upstream.close(() => resolve()))
  }
})

test('private Connection exchange authenticates upstream without exposing its cookie or token', async () => {
  const issued = 'dsh-auth-example=v1.secret.signature'
  const upstream = createServer((req, res) => {
    if (req.url === '/?token=private-launch-token' && req.headers.host === `127.0.0.1:${upstreamPort}`) {
      res.writeHead(303, { location: './', 'set-cookie': `${issued}; Path=/; HttpOnly` })
      res.end()
      return
    }
    if (req.headers.cookie !== issued) { res.writeHead(401); res.end('upstream login required'); return }
    res.writeHead(200, { 'content-type': 'application/json', 'set-cookie': `${issued}; Path=/; HttpOnly` })
    res.end(JSON.stringify({ path: req.url, cookie: req.headers.cookie }))
  })
  const upstreamPort = await listen(upstream)
  const probe = createServer()
  const gatewayPort = await listen(probe)
  await new Promise<void>((resolve) => probe.close(() => resolve()))
  let exchanges = 0
  const gateway = new RemoteGateway(config(upstreamPort, gatewayPort), await hashPassword('correct horse battery staple'), () => {
    exchanges++
    return `http://127.0.0.1:${upstreamPort}/?token=private-launch-token`
  })
  await gateway.start()
  const base = `http://127.0.0.1:${gatewayPort}`
  try {
    const { cookie, csrfToken } = await login(base)
    const response = await fetch(`${base}/app`, { headers: { cookie } })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('set-cookie'), null)
    assert.deepEqual(await response.json(), { path: '/app', cookie: issued })
    assert.equal(exchanges, 1)
    assert.equal((await fetch(`${base}/app`, { headers: { cookie } })).status, 200)
    assert.equal(exchanges, 1)
    assert.equal((await fetch(`${base}/_dsh_remote/session`, { headers: { cookie } })).status, 200)
    assert.deepEqual(await (await fetch(`${base}/_dsh_remote/session`, { headers: { cookie } })).json(), { csrfToken })
    assert.equal((await fetch(`${base}/?token=private-launch-token`, { headers: { cookie } })).status, 400)
    const logout = await fetch(`${base}/_dsh_remote/logout`, { method: 'POST', headers: { cookie, origin: base, 'x-csrf-token': csrfToken } })
    assert.equal(logout.status, 204)
    assert.equal((await fetch(`${base}/_dsh_remote/session`, { headers: { cookie } })).status, 401)
  } finally {
    await gateway.stop()
    await new Promise<void>((resolve) => upstream.close(() => resolve()))
  }
})

test('logout during a private upstream exchange cannot restore revoked authentication', async () => {
  let releaseExchange: (() => void) | undefined
  let exchangeStarted: (() => void) | undefined
  const started = new Promise<void>((resolve) => { exchangeStarted = resolve })
  const exchangeGate = new Promise<void>((resolve) => { releaseExchange = resolve })
  let exchanges = 0
  let proxied = 0
  const issued = 'dsh-auth-example=v1.secret.signature'
  const upstream = createServer((req, res) => {
    if (req.url === '/?token=private-launch-token') {
      exchanges++
      exchangeStarted?.()
      void exchangeGate.then(() => { res.writeHead(303, { location: './', 'set-cookie': `${issued}; Path=/; HttpOnly` }); res.end() })
      return
    }
    proxied++
    res.writeHead(req.headers.cookie === issued ? 200 : 401)
    res.end()
  })
  const upstreamPort = await listen(upstream)
  const probe = createServer()
  const gatewayPort = await listen(probe)
  await new Promise<void>((resolve) => probe.close(() => resolve()))
  const gateway = new RemoteGateway(config(upstreamPort, gatewayPort), await hashPassword('correct horse battery staple'), () => `http://127.0.0.1:${upstreamPort}/?token=private-launch-token`)
  await gateway.start()
  const base = `http://127.0.0.1:${gatewayPort}`
  try {
    const { cookie, csrfToken } = await login(base)
    const inFlight = fetch(`${base}/app`, { headers: { cookie } })
    await started
    const logout = await fetch(`${base}/_dsh_remote/logout`, { method: 'POST', headers: { cookie, origin: base, 'x-csrf-token': csrfToken } })
    assert.equal(logout.status, 204)
    releaseExchange?.()
    assert.equal((await inFlight).status, 401)
    assert.equal((await fetch(`${base}/app`, { headers: { cookie } })).status, 401)
    assert.equal(exchanges, 1)
    assert.equal(proxied, 0)
  } finally {
    releaseExchange?.()
    await gateway.stop()
    await new Promise<void>((resolve) => upstream.close(() => resolve()))
  }
})

test('browser navigation opens login while APIs remain private and favicon stays quiet', async () => {
  const upstream = createServer((_req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<h1>Private DSH</h1>') })
  const upstreamPort = await listen(upstream)
  const probe = createServer()
  const gatewayPort = await listen(probe)
  await new Promise<void>((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  const gateway = new RemoteGateway(config(upstreamPort, gatewayPort), await hashPassword('correct horse battery staple'))
  await gateway.start()
  const base = `http://127.0.0.1:${gatewayPort}`
  try {
    const navigation = await fetch(`${base}/app?tab=2`, { headers: { accept: 'text/html,application/xhtml+xml' }, redirect: 'manual' })
    assert.equal(navigation.status, 303)
    assert.equal(navigation.headers.get('location'), '/_dsh_remote/login?next=%2Fapp%3Ftab%3D2')
    const loginPage = await fetch(`${base}${navigation.headers.get('location')}`)
    assert.equal(loginPage.status, 200)
    assert.match(loginPage.headers.get('content-type') ?? '', /text\/html/)
    const csp = loginPage.headers.get('content-security-policy') ?? ''
    assert.match(csp, /script-src 'sha256-/)
    // The login form fetches over the same origin; default-src 'none' would block it otherwise.
    assert.match(csp, /connect-src 'self'/)
    const body = await loginPage.text()
    assert.match(body, /登录远程访问网关/)
    assert.match(body, /_dsh_remote\/login/)
    assert.doesNotMatch(body, /Private DSH/)
    assert.equal((await fetch(`${base}/favicon.ico`)).status, 200)
    assert.equal((await fetch(`${base}/_dsh_remote/health`)).status, 200)
    // The manifest is fetched without credentials, so it must not require a session.
    const manifest = await fetch(`${base}/manifest.webmanifest`)
    assert.equal(manifest.status, 200)
    assert.match(manifest.headers.get('content-type') ?? '', /text\/html/)
    assert.equal((await fetch(`${base}/api`, { headers: { accept: 'application/json' } })).status, 401)
    assert.equal((await fetch(`${base}/app`, { method: 'POST', headers: { accept: 'text/html' } })).status, 401)
    const { cookie } = await login(base)
    assert.match(await (await fetch(`${base}/app`, { headers: { cookie, accept: 'text/html' } })).text(), /Private DSH/)
    assert.equal((await fetch(`${base}/_dsh_remote/login`, { headers: { cookie }, redirect: 'manual' })).headers.get('location'), '/')
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
    await assert.rejects(() => openSocket(`ws://127.0.0.1:${gatewayPort}/socket?token=private-launch-token`, { cookie, origin: base }))
    await assert.rejects(() => openSocket(`ws://127.0.0.1:${gatewayPort}/socket`, { cookie, origin: 'http://evil.example' }))
    await assert.rejects(() => openSocket(`ws://127.0.0.1:${gatewayPort}/socket`, { cookie }))
  } finally {
    await gateway.stop()
    await new Promise<void>((resolve, reject) => upstream.close((error) => error ? reject(error) : resolve()))
  }
})

test('a wildcard listener serves local IP literals and still rejects foreign Host headers', async () => {
  const upstream = createServer((_req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<h1>Private DSH</h1>') })
  const upstreamPort = await listen(upstream)
  const probe = createServer()
  const gatewayPort = await listen(probe)
  await new Promise<void>((resolve) => probe.close(() => resolve()))
  const gateway = new RemoteGateway(config(upstreamPort, gatewayPort, '0.0.0.0'), await hashPassword('correct horse battery staple'))
  await gateway.start()
  const base = `http://127.0.0.1:${gatewayPort}`
  try {
    assert.equal((await fetch(`${base}/_dsh_remote/health`)).status, 200)
    assert.equal(await requestWithHost(gatewayPort, { host: `localhost:${gatewayPort}` }), 200)
    assert.equal(await requestWithHost(gatewayPort, { host: `192.168.1.5:${gatewayPort}` }), 200)
    assert.equal(await requestWithHost(gatewayPort, { host: `100.101.102.103:${gatewayPort}` }), 200)
    assert.equal(await requestWithHost(gatewayPort, { host: `evil.example:${gatewayPort}` }), 421)
    assert.equal(await requestWithHost(gatewayPort, { host: `127.0.0.1:${gatewayPort}` }), 200)
    const navigation = await fetch(`${base}/`, { headers: { accept: 'text/html' }, redirect: 'manual' })
    assert.equal(navigation.status, 303)
    const { cookie } = await login(base)
    assert.match(await (await fetch(`${base}/`, { headers: { cookie, accept: 'text/html' } })).text(), /Private DSH/)
    assert.equal(await requestWithHost(gatewayPort, { host: `evil.example:${gatewayPort}`, cookie }, 'GET'), 421)
  } finally {
    await gateway.stop()
    await new Promise<void>((resolve) => upstream.close(() => resolve()))
  }
})
