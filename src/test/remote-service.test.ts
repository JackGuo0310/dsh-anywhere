import test from 'node:test'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import { RemoteAccessService } from '../remote-service.js'
import { assertSafeConfig } from '../config.js'
import { verifyPassword } from '../security/password.js'

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
    async set(ref: string, value: string) { values.set(ref, value) },
  }
  const configEditor = {
    entries: () => [{ id: 'dsh-remote-access', name: '@dsh-community/dsh-remote-access' }],
    async edit(_entry: unknown, change: (current: Record<string, unknown>, inherited: Record<string, unknown>) => Record<string, unknown>) { saved = change({ enabled: false }, {}) },
  }
  ;(ctx as unknown as { get(name: string): unknown }).get = (name: string) => name === 'credentials' ? credentials : name === 'configEditor' ? configEditor : undefined
  const service = new RemoteAccessService(ctx, assertSafeConfig({ adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH' }))
  assert.deepEqual(await service.saveCommonConfig({ enabled: true, mode: 'lan', listenHost: '0.0.0.0', listenPort: 4173, targetPort: 3080 }), { saved: true })
  assert.equal(saved?.enabled, true)
  assert.equal(saved?.mode, 'lan')
  assert.equal(saved?.listenHost, '0.0.0.0')
  assert.equal(saved?.listenPort, 4173)
  assert.deepEqual(saved?.target, { host: '127.0.0.1', port: 3080, protocol: 'http' })
  assert.equal(saved?.adminConfigured, true)
})
