import test from 'node:test'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { RemoteAccessService } from '../remote-service.js'
import { assertSafeConfig } from '../config.js'
import { verifyPassword } from '../security/password.js'

async function freePort(): Promise<number> {
  const probe = createServer()
  probe.listen(0, '127.0.0.1')
  await once(probe, 'listening')
  const address = probe.address()
  if (!address || typeof address === 'string') throw new Error('Expected bound port')
  await new Promise<void>((resolve) => probe.close(() => resolve()))
  return address.port
}

test('gateway lifecycle survives a bind failure and releases the listener on stop', async () => {
  const port = await freePort()
  const config = assertSafeConfig({ enabled: true, listenPort: port, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' })
  const ownerCtx = new Context()
  const contenderCtx = new Context()
  for (const ctx of [ownerCtx, contenderCtx]) {
    ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials' ? { resolve: async () => undefined } : name === 'connection' ? { authenticatedUrl: (url: string) => url + '?token=test' } : undefined
  }
  const owner = new RemoteAccessService(ownerCtx, config)
  const contender = new RemoteAccessService(contenderCtx, config)
  await owner.start()
  try {
    await assert.rejects(() => contender.start(), /EADDRINUSE/)
    assert.equal((await contender.status() as { running: boolean }).running, false)
  } finally {
    await contender.stop()
    await owner.stop()
  }
  await contender.start()
  assert.equal((await contender.status() as { running: boolean }).running, true)
  await contender.stop()
  await contender.stop()
})

test('initial administrator password can be stored while gateway is stopped', async () => {
  const values = new Map<string, string>()
  const ctx = new Context()
  const credentials = {
    async resolve(ref: string) {
      const value = values.get(ref)
      return value === undefined ? undefined : { value }
    },
    async set(ref: string, value: string) { values.set(ref, value) },
  }
  ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials' ? credentials : undefined
  const service = new RemoteAccessService(ctx, assertSafeConfig({
    adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH',
  }))

  assert.deepEqual(await service.changePassword({ newPassword: 'ten-chars!' }), {
    changed: true,
    initialized: true,
    sessionsRevoked: false,
  })
  const hash = values.get('DSH_REMOTE_ADMIN_HASH')
  assert.ok(hash)
  assert.equal(await verifyPassword('ten-chars!', hash), true)
  await assert.rejects(() => service.changePassword({ newPassword: 'replacement password' }), /Gateway is not running/)
})

test('common settings are persisted through configEditor', async () => {
  const values = new Map([['DSH_REMOTE_ADMIN_HASH', 'configured-hash']])
  let saved: Record<string, unknown> | undefined
  const ctx = new Context()
  const credentials = {
    async resolve(ref: string) { const value = values.get(ref); return value ? { value } : undefined },
    async describe(ref: string) { return { configured: values.has(ref), writable: true } },
    async set(ref: string, value: string) { values.set(ref, value) },
  }
  const configEditor = {
    entries: () => [{ options: { id: 'dsh-remote-access', name: '@dsh-community/dsh-remote-access' } }],
    async edit(_entry: unknown, change: (current: Record<string, unknown>, inherited: Record<string, unknown>) => Record<string, unknown>) { saved = change({ enabled: false }, {}) },
  }
  ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials' ? credentials : name === 'configEditor' ? configEditor : undefined
  const service = new RemoteAccessService(ctx, assertSafeConfig({ adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' }))
  assert.deepEqual(await service.saveConfig({ config: { enabled: true, mode: 'direct', listenHost: '0.0.0.0', listenPort: 4173, target: { host: '127.0.0.1', port: 3080, protocol: 'http' }, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' } }), { saved: true, secretsUpdated: 0 })
  assert.equal(saved?.enabled, true)
  assert.equal(saved?.mode, 'direct')
  assert.equal(saved?.listenHost, '0.0.0.0')
  assert.equal(saved?.listenPort, 4173)
  assert.deepEqual(saved?.target, { host: '127.0.0.1', port: 3080, protocol: 'http' })
  assert.equal(saved?.adminConfigured, true)
})

test('full FRP settings and new secrets are persisted without returning secret values', async () => {
  const values = new Map([['DSH_REMOTE_ADMIN_HASH', 'configured-hash']])
  let saved: Record<string, unknown> | undefined
  const ctx = new Context()
  const credentials = {
    async resolve(ref: string) { const value = values.get(ref); return value ? { value } : undefined },
    async describe(ref: string) { return { configured: values.has(ref), writable: true } },
    async set(ref: string, value: string) { values.set(ref, value) },
  }
  const configEditor = {
    entries: () => [{ options: { id: 'dsh-remote-access' } }],
    async edit(_entry: unknown, change: (current: Record<string, unknown>) => Record<string, unknown>) { saved = change({}) },
  }
  ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials' ? credentials : name === 'configEditor' ? configEditor : undefined
  const service = new RemoteAccessService(ctx, assertSafeConfig({ adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' }))
  const config = {
    enabled: false, mode: 'tunnel', listenHost: '127.0.0.1', listenPort: 4173,
    target: { host: '127.0.0.1', port: 3080, protocol: 'http' }, publicBaseUrl: 'https://dsh.example.com',
    adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH', trustedProxyCidrs: ['127.0.0.1'], sessionTtlMinutes: 60,
    maxRequestBodyBytes: 2048, frp: { executablePath: process.execPath, serverAddress: 'frp.example.com', serverPort: 7000, authMethod: 'token', tokenSecretRef: 'DSH_REMOTE_FRP_TOKEN', transport: 'https', customDomain: 'dsh.example.com', tlsEnabled: true, startWithDsh: false },
  }
  const result = await service.saveConfig({ config, secrets: { frpToken: 'top-secret-token' } })
  assert.deepEqual(result, { saved: true, secretsUpdated: 1 })
  assert.equal(values.get('DSH_REMOTE_FRP_TOKEN'), 'top-secret-token')
  assert.deepEqual((saved?.frp as Record<string, unknown>).tokenSecretRef, 'DSH_REMOTE_FRP_TOKEN')
  assert.equal(JSON.stringify(saved).includes('top-secret-token'), false)
})

test('saving configuration remounts the gateway on the new listener without a DSH restart', async () => {
  const values = new Map([['DSH_REMOTE_ADMIN_HASH', 'configured-hash']])
  let persisted: Record<string, unknown> = {}
  let reconciliations = 0
  const targetPort = await freePort()
  const ctx = new Context()
  ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials'
    ? {
        async resolve(ref: string) { const value = values.get(ref); return value ? { value } : undefined },
        async describe(ref: string) { return { configured: values.has(ref), writable: true } },
        async set(ref: string, value: string) { values.set(ref, value) },
      }
    : name === 'connection' ? { authenticatedUrl: (url: string) => `${url}?token=test` }
    : name === 'configEditor'
      ? {
          entries: () => [{ options: { id: 'dsh-remote-access', name: '@dsh-community/dsh-remote-access' } }],
          async edit(_entry: unknown, change: (current: Record<string, unknown>) => Record<string, unknown>) {
            persisted = change(persisted)
            reconciliations++
          },
        }
      : undefined

  const mount = (config: Record<string, unknown>) => {
    const mounted = new Context()
    ;(mounted as unknown as { get(name: string): unknown }).get = ctx.get.bind(ctx)
    return new RemoteAccessService(mounted, assertSafeConfig(config))
  }
  const common = { enabled: true, target: { host: '127.0.0.1', port: targetPort, protocol: 'http' }, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' }
  const before = mount({ ...common, listenPort: await freePort() })
  await before.start()
  assert.equal((await before.status() as { running: boolean }).running, true)

  const nextPort = await freePort()
  assert.deepEqual(await before.saveConfig({ config: { enabled: true, listenPort: nextPort, target: { host: '127.0.0.1', port: targetPort, protocol: 'http' }, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' } }), { saved: true, secretsUpdated: 0 })
  assert.equal(reconciliations, 1)
  assert.equal(persisted.listenPort, nextPort)
  // Loader remounts the plugin for the new configuration; the released port must be free again.
  await before.stop()

  // Loader remounts the plugin from the persisted configuration, so the new listener
  // becomes active without restarting DSH, and the released port is immediately reusable.
  const after = mount(persisted)
  await after.start()
  try {
    const status = await after.status() as { running: boolean, configured: { listenPort: number } }
    assert.equal(status.running, true)
    assert.equal(status.configured.listenPort, nextPort)
    const health = await fetch(`http://127.0.0.1:${nextPort}/_dsh_remote/health`)
    assert.equal(health.status, 200)
    assert.deepEqual(await health.json(), { status: 'ok' })
  } finally {
    await after.stop()
  }
  const released = await new Promise<number>((resolve, reject) => {
    const probe = createServer()
    probe.once('error', reject)
    probe.listen(nextPort, '127.0.0.1', () => probe.close((error) => error ? reject(error) : resolve(nextPort)))
  })
  assert.equal(released, nextPort)
})

test('full configuration rejects invalid public tunnel settings before persistence', async () => {
  const ctx = new Context()
  ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials' ? { resolve: async () => ({ value: 'hash' }), describe: async () => ({ configured: true, writable: true }), set: async () => {} } : undefined
  const service = new RemoteAccessService(ctx, assertSafeConfig({ adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' }))
  await assert.rejects(() => service.saveConfig({ config: { mode: 'tunnel', publicBaseUrl: 'http://unsafe.example.com', adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' } }), /HTTPS publicBaseUrl/)
})
