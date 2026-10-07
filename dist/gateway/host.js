import { RemoteGateway } from './remote-gateway.js';
/**
 * Telling a remount apart from a real teardown needs both rules: when the Loader applies the
 * new configuration first, the disposal follows a very recent reconcile; when the disposal
 * comes first, the apply that follows cancels the deferred stop.
 */
export const hostTiming = {
    /** A disposal this soon after a reconcile belongs to the same remount. */
    recentReconcileMs: 1_500,
    /** How long a disposal waits for the matching re-apply before the gateway really stops. */
    releaseGraceMs: 1_000,
};
let hosted;
let pendingShutdown;
function cancelPendingShutdown() {
    if (!pendingShutdown)
        return;
    clearTimeout(pendingShutdown);
    pendingShutdown = undefined;
}
export function hostedGateway() { return hosted?.gateway; }
export async function reconcileGateway(config, passwordHash, authenticatedUrl) {
    // A re-apply cancels any teardown the disposal that preceded it had scheduled.
    cancelPendingShutdown();
    if (hosted) {
        hosted.reconciledAt = Date.now();
        await hosted.gateway.reconfigure(config, passwordHash, authenticatedUrl);
        return hosted.gateway;
    }
    const gateway = new RemoteGateway(config, passwordHash, authenticatedUrl);
    await gateway.start();
    hosted = { gateway, reconciledAt: Date.now() };
    return gateway;
}
/** Stop the gateway now: used when the gateway is switched off or fails to persist state. */
export async function shutdownGateway() {
    cancelPendingShutdown();
    const current = hosted;
    hosted = undefined;
    await current?.gateway.stop();
}
/**
 * The plugin was disposed. A remount re-applies immediately and re-adopts the running
 * gateway, so wait briefly before stopping; a disposal with no follow-up is a real teardown
 * and the deferred stop runs.
 */
export function releaseGateway() {
    const current = hosted;
    if (!current)
        return;
    if (Date.now() - current.reconciledAt < hostTiming.recentReconcileMs)
        return;
    cancelPendingShutdown();
    pendingShutdown = setTimeout(() => {
        pendingShutdown = undefined;
        void shutdownGateway();
    }, hostTiming.releaseGraceMs);
    pendingShutdown.unref?.();
}
//# sourceMappingURL=host.js.map