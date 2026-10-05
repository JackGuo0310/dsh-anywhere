import type { Context } from '@deepseek-ai/cordis';
import { type RemoteAccessConfig } from './config.js';
export { CONFIG_VERSION, assertSafeConfig, configSchema, migrateConfig } from './config.js';
/**
 * DSH Host plugin entry point. The gateway lifecycle is intentionally separate
 * from DSH's own webserver so it never exposes the original listener.
 */
export declare function apply(ctx: Context, rawConfig: RemoteAccessConfig): Promise<void>;
//# sourceMappingURL=index.d.ts.map