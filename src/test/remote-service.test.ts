import test from 'node:test'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { RemoteAccessService } from '../remote-service.js'
import { hostedGateway, hostTiming, shutdownGateway } from '../gateway/host.js'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
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

test('a bind failure leaves no gateway behind and the port is reusable', async () => {
  const port = await freePort()
  const config = assertSafeConfig({ enabled: true, listenPort: port, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' })
  const blocker = createServer()
  blocker.listen(port, '127.0.0.1')
  await once(blocker, 'listening')
  const ctx = new Context()
  ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials' ? { resolve: async () => undefined } : name === 'connection' ? { authenticatedUrl: (url: string) => url + '?token=test' } : undefined
  const service = new RemoteAccessService(ctx, config)
  try {
    await assert.rejects(() => service.start(), /EADDRINUSE/)
    assert.equal(hostedGateway(), undefined, 'a failed start must not leave a hosted gateway')
    assert.equal((await service.status() as { running: boolean }).running, false)
  } finally {
    await new Promise<void>((resolve) => blocker.close(() => resolve()))
  }
  await service.start()
  assert.equal((await service.status() as { running: boolean }).running, true)
  await service.stop()
  assert.equal(hostedGateway(), undefined)
  await service.stop()
})

test('a configuration remount re-adopts the running gateway instead of restarting it', async () => {
  const port = await freePort()
  const context = () => {
    const ctx = new Context()
    ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials'
      ? { resolve: async () => undefined }
      : name === 'connection' ? { authenticatedUrl: (url: string) => `${url}?token=test` } : undefined
    return ctx
  }
  const config = assertSafeConfig({ enabled: true, listenPort: port, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' })
  const first = new RemoteAccessService(context(), config)
  await first.start()
  const running = hostedGateway()
  assert.ok(running)
  try {
    // What the Loader does on save: dispose the old plugin instance, then apply the new config.
    first.release()
    const second = new RemoteAccessService(context(), assertSafeConfig({ enabled: true, listenPort: port, sessionTtlMinutes: 30, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' }))
    await second.start()
    assert.equal(hostedGateway(), running, 'the running gateway must survive a configuration save')
    assert.deepEqual(running.listenAddresses(), ['127.0.0.1'])
    await second.stop()
  } finally {
    await shutdownGateway()
  }
  assert.equal(hostedGateway(), undefined)
})

test('a disposal whose re-apply is delayed still keeps the gateway', async () => {
  const port = await freePort()
  const context = () => {
    const ctx = new Context()
    ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials'
      ? { resolve: async () => undefined }
      : name === 'connection' ? { authenticatedUrl: (url: string) => `${url}?token=test` } : undefined
    return ctx
  }
  const config = assertSafeConfig({ enabled: true, listenPort: port, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' })
  const service = new RemoteAccessService(context(), config)
  await service.start()
  const running = hostedGateway()
  const timing = { ...hostTiming }
  hostTiming.recentReconcileMs = 0
  hostTiming.releaseGraceMs = 40
  try {
    // Dispose first, apply second: the deferred stop must be cancelled by the re-apply.
    service.release()
    const second = new RemoteAccessService(context(), config)
    await second.start()
    await delay(120)
    assert.equal(hostedGateway(), running, 'a delayed re-apply must still keep the running gateway')
    await second.stop()
  } finally {
    hostTiming.recentReconcileMs = timing.recentReconcileMs
    hostTiming.releaseGraceMs = timing.releaseGraceMs
    await shutdownGateway()
  }
})

test('a disposal with no re-apply stops the gateway after the grace period', async () => {
  const port = await freePort()
  const ctx = new Context()
  ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials'
    ? { resolve: async () => undefined }
    : name === 'connection' ? { authenticatedUrl: (url: string) => `${url}?token=test` } : undefined
  const service = new RemoteAccessService(ctx, assertSafeConfig({ enabled: true, listenPort: port, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' }))
  await service.start()
  const timing = { ...hostTiming }
  hostTiming.recentReconcileMs = 0
  hostTiming.releaseGraceMs = 40
  try {
    service.release()
    assert.equal(hostedGateway() !== undefined, true, 'the gateway survives until the grace period elapses')
    await delay(150)
    assert.equal(hostedGateway(), undefined, 'an abandoned disposal must stop the gateway')
  } finally {
    hostTiming.recentReconcileMs = timing.recentReconcileMs
    hostTiming.releaseGraceMs = timing.releaseGraceMs
    await shutdownGateway()
  }
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
  assert.deepEqual(await service.saveConfig({ config: { enabled: true, listeners: { local: true, lan: true, tailscale: false }, listenPort: 4173, target: { host: '127.0.0.1', port: 3080, protocol: 'http' }, adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' } }), { saved: true, secretsUpdated: 0 })
  assert.equal(saved?.enabled, true)
  assert.deepEqual(saved?.listeners, { local: true, lan: true, tailscale: false })
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
