import test from 'node:test'
import assert from 'node:assert/strict'
import { Context, type Plugin } from '@deepseek-ai/cordis'
import { createClientModule } from '../client-module.js'

/**
 * Cordis v4 throws on reading an undeclared service property, so a Client half
 * that touches a service outside its `inject` list fails activation, and the Web
 * UI then reports the whole plugin as failed without a usable reason. These tests
 * boot the real Client half inside cordis to keep that contract honest.
 */
const reactStub = {
  createElement: () => undefined,
  useCallback: (callback: unknown) => callback,
  useEffect: () => undefined,
  useState: (initial: unknown) => [initial, () => undefined],
}

type SlotRow = { name: string, id: string }
type HostCall = (method: string, args?: unknown) => Promise<unknown>

function clientHalf() {
  return createClientModule(reactStub as unknown as Parameters<typeof createClientModule>[0])
}

function bootClientModule() {
  const ctx = new Context()
  const slots: SlotRow[] = []
  const rpcCalls: { endpoint: string, payload: { args: unknown } }[] = []
  const localeRegistrations: { namespace: string, locale: string, dict: Record<string, string> }[] = []
  let disposals = 0
  for (const name of ['slots', 'locale', 'connection']) ctx.provide(name, undefined as never)
  ctx.set('connection', {
    rpc: {
      call: async (_channel: string, endpoint: string, payload: { args: unknown }) => {
        rpcCalls.push({ endpoint, payload })
        return { ok: true, value: { endpoint } }
      },
    },
  })
  ctx.set('slots', {
    inject: (_key: string, callback: () => unknown) => { callback(); return () => { disposals++ } },
    register: (options: SlotRow) => { slots.push(options); return () => { disposals++ } },
  })
  ctx.set('locale', {
    register: (namespace: string, locale: string, dict: Record<string, string>) => {
      localeRegistrations.push({ namespace, locale, dict })
      return () => { disposals++ }
    },
    bind: (namespace: string) => (key: string) => `${namespace}.${key}`,
  })
  return { ctx, slots, rpcCalls, localeRegistrations, getDisposals: () => disposals }
}

async function boot(ctx: Context) {
  const fork = ctx.plugin(clientHalf() as Plugin)
  await fork.await?.()
  return fork
}

test('client half activates under cordis and registers its settings section', async () => {
  const { ctx, slots } = bootClientModule()
  const fork = await boot(ctx)
  assert.equal(fork.state, 2, 'the Client half must reach ACTIVE, not FAILED')
  assert.deepEqual(slots.map((row) => `${row.name}#${row.id}`), ['settings.section#dsh-remote-access'])
})

test('client half releases slot and locale resources on disposal', async () => {
  const { ctx, getDisposals } = bootClientModule()
  const fork = await boot(ctx)
  await fork.dispose()
  assert.equal(getDisposals(), 3)
})

test('client half injects every service it reads', () => {
  assert.deepEqual([...clientHalf().inject].sort(), ['connection', 'locale', 'slots'])
})

test('client half registers its runtime dictionaries for every shipped locale', async () => {
  const { ctx, localeRegistrations } = bootClientModule()
  await boot(ctx)
  assert.deepEqual(localeRegistrations.map((row) => `${row.namespace}/${row.locale}`).sort(), [
    'dsh-remote-access/en',
    'dsh-remote-access/zh',
  ])
  const english = localeRegistrations.find((row) => row.locale === 'en')!.dict
  assert.equal(typeof english.title, 'string')
  assert.equal(english.title.length > 0, true)
  for (const row of localeRegistrations) {
    assert.deepEqual(Object.keys(row.dict).sort(), Object.keys(english).sort(), `${row.locale} must mirror en.json keys`)
  }
})

test('settings section calls the Host Remote namespace over the connection channel', async () => {
  const { ctx, slots, rpcCalls } = bootClientModule()
  await boot(ctx)
  const injected = (slots[0] as unknown as { inject: () => { call: HostCall } }).inject()
  const result = await injected.call('changePassword', { request: { currentPassword: 'a', newPassword: 'b' } })
  assert.deepEqual(result, { endpoint: 'dshRemoteAccess/changePassword' })
  assert.deepEqual(rpcCalls, [{
    endpoint: 'dshRemoteAccess/changePassword',
    payload: { args: { request: { currentPassword: 'a', newPassword: 'b' } } },
  }])
})
