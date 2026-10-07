import type { RemoteAccessConfig } from '../config.js';
import { RemoteGateway } from './remote-gateway.js';
export declare function hostedGateway(): RemoteGateway | undefined;
export declare function reconcileGateway(config: RemoteAccessConfig, passwordHash?: string, authenticatedUrl?: () => string): Promise<RemoteGateway>;
/** Stop the gateway now: used when the gateway is switched off or fails to persist state. */
export declare function shutdownGateway(): Promise<void>;
/**
 * Release the gateway because the plugin was disposed. A remount immediately re-adopts the
 * running gateway, so keep it; any later disposal is a real teardown and stops it at once.
 */
export declare function releaseGateway(): void;
//# sourceMappingURL=host.d.ts.map