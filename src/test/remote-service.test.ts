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
