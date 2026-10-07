import { RemoteGateway } from './remote-gateway.js';
/** A disposal this soon after a reconcile is a remount, not a real teardown. */
const REMOUNT_WINDOW_MS = 1_500;
let hosted;
export function hostedGateway() { return hosted?.gateway; }
export async function reconcileGateway(config, passwordHash, authenticatedUrl) {
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
    const current = hosted;
    hosted = undefined;
    await current?.gateway.stop();
}
/**
 * Release the gateway because the plugin was disposed. A remount immediately re-adopts the
 * running gateway, so keep it; any later disposal is a real teardown and stops it at once.
 */
export function releaseGateway() {
    const current = hosted;
    if (!current)
        return;
    if (Date.now() - current.reconciledAt < REMOUNT_WINDOW_MS)
        return;
    void shutdownGateway();
}
//# sourceMappingURL=host.js.map