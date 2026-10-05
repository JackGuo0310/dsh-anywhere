import { assertSafeConfig } from './config.js';
import { RemoteAccessService } from './remote-service.js';
export { CONFIG_VERSION, assertSafeConfig, configSchema, migrateConfig } from './config.js';
/**
 * DSH Host plugin entry point. The gateway lifecycle is intentionally separate
 * from DSH's own webserver so it never exposes the original listener.
 */
export async function apply(ctx, rawConfig) {
    const config = assertSafeConfig(rawConfig);
    const service = new RemoteAccessService(ctx, config);
    if (config.enabled) {
        await service.start();
        ctx.effect(() => () => service.stop());
    }
}
//# sourceMappingURL=index.js.map