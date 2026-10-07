import type { RemoteAccessConfig } from '../config.js';
import { RemoteGateway } from './remote-gateway.js';
/**
 * Telling a remount apart from a real teardown needs both rules: when the Loader applies the
 * new configuration first, the disposal follows a very recent reconcile; when the disposal
 * comes first, the apply that follows cancels the deferred stop.
 */
export declare const hostTiming: {
    /** A disposal this soon after a reconcile belongs to the same remount. */
    recentReconcileMs: number;
    /** How long a disposal waits for the matching re-apply before the gateway really stops. */
    releaseGraceMs: number;
};
export declare function hostedGateway(): RemoteGateway | undefined;
export declare function reconcileGateway(config: RemoteAccessConfig, passwordHash?: string, authenticatedUrl?: () => string): Promise<RemoteGateway>;
/** Stop the gateway now: used when the gateway is switched off or fails to persist state. */
export declare function shutdownGateway(): Promise<void>;
/**
 * The plugin was disposed. A remount re-applies immediately and re-adopts the running
 * gateway, so wait briefly before stopping; a disposal with no follow-up is a real teardown
 * and the deferred stop runs.
 */
export declare function releaseGateway(): void;
//# sourceMappingURL=host.d.ts.map