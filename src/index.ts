import type { Context } from '@deepseek-ai/cordis'
import { assertSafeConfig, type RemoteAccessConfig } from './config.js'
import { RemoteAccessService } from './remote-service.js'

export { CONFIG_VERSION, assertSafeConfig, configSchema, migrateConfig } from './config.js'

/**
 * DSH Host plugin entry point. The gateway lifecycle is intentionally separate
 * from DSH's own webserver so it never exposes the original listener.
 */
export const inject = ['configEditor', 'credentials', 'typertGateway']

export async function apply(ctx: Context, rawConfig: RemoteAccessConfig): Promise<void> {
  const config = assertSafeConfig(rawConfig)
  const service = new RemoteAccessService(ctx, config)
  ctx.effect(() => () => service.stop())
  if (config.enabled) await service.start()
}
