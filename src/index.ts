import type { Context } from '@deepseek-ai/cordis'
import { assertSafeConfig, type RemoteAccessConfig } from './config.js'

export { CONFIG_VERSION, assertSafeConfig, configSchema, migrateConfig } from './config.js'

/**
 * DSH Host plugin entry point. The gateway lifecycle is intentionally separate
 * from DSH's own webserver so it never exposes the original listener.
 */
export async function apply(ctx: Context, rawConfig: RemoteAccessConfig): Promise<void> {
  const config = assertSafeConfig(rawConfig)
  if (!config.enabled) return

  const { RemoteGateway } = await import('./gateway/remote-gateway.js')
  const gateway = new RemoteGateway(config)
  await gateway.start()
  ctx.effect(() => () => gateway.stop())
}
