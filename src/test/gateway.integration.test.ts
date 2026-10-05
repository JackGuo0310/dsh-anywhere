import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
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

test('gateway authenticates then proxies HTTP and enforces CSRF logout', async () => {
  const upstream = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ path: req.url, host: req.headers.host }))
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

    const login = await fetch(`${base}/_dsh_remote/login`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: base },
      body: JSON.stringify({ username: 'admin', password: 'correct horse battery staple' }),
    })
    assert.equal(login.status, 200)
    const { csrfToken } = await login.json() as { csrfToken: string }
    const cookie = login.headers.get('set-cookie')?.split(';')[0]
    assert.ok(cookie)

    const proxied = await fetch(`${base}/app?x=1`, { headers: { cookie: cookie! } })
    assert.equal(proxied.status, 200)
    assert.deepEqual(await proxied.json(), { path: '/app?x=1', host: `127.0.0.1:${upstreamPort}` })

    const badLogout = await fetch(`${base}/_dsh_remote/logout`, { method: 'POST', headers: { cookie: cookie!, origin: base } })
    assert.equal(badLogout.status, 403)
    const logout = await fetch(`${base}/_dsh_remote/logout`, { method: 'POST', headers: { cookie: cookie!, origin: base, 'x-csrf-token': csrfToken } })
    assert.equal(logout.status, 204)
    const afterLogout = await fetch(`${base}/app`, { headers: { cookie: cookie! } })
    assert.equal(afterLogout.status, 401)
  } finally {
    await gateway.stop()
    await new Promise<void>((resolve, reject) => upstream.close((error) => error ? reject(error) : resolve()))
  }
})
