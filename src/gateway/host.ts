import type { RemoteAccessConfig } from '../config.js'
import { RemoteGateway } from './remote-gateway.js'

/**
 * Saving settings makes the Loader dispose and re-apply this plugin. Without a host that
 * outlives that remount, every save would close all listeners and revoke all sessions, so
 * disabling one access mode would also drop the connections of the modes left enabled.
 *
 * The host keeps one gateway across remounts and hands the new configuration to it, which
 * only rebinds the addresses that actually changed.
 */
interface HostedGateway {
  gateway: RemoteGateway
  reconciledAt: number
}

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
}

let hosted: HostedGateway | undefined
let pendingShutdown: NodeJS.Timeout | undefined

function cancelPendingShutdown(): void {
  if (!pendingShutdown) return
  clearTimeout(pendingShutdown)
  pendingShutdown = undefined
}

export function hostedGateway(): RemoteGateway | undefined { return hosted?.gateway }

export async function reconcileGateway(config: RemoteAccessConfig, passwordHash?: string, authenticatedUrl?: () => string): Promise<RemoteGateway> {
  // A re-apply cancels any teardown the disposal that preceded it had scheduled.
  cancelPendingShutdown()
  if (hosted) {
    hosted.reconciledAt = Date.now()
    await hosted.gateway.reconfigure(config, passwordHash, authenticatedUrl)
    return hosted.gateway
  }
  const gateway = new RemoteGateway(config, passwordHash, authenticatedUrl)
  await gateway.start()
  hosted = { gateway, reconciledAt: Date.now() }
  return gateway
}

/** Stop the gateway now: used when the gateway is switched off or fails to persist state. */
export async function shutdownGateway(): Promise<void> {
  cancelPendingShutdown()
  const current = hosted
  hosted = undefined
  await current?.gateway.stop()
}

/**
 * The plugin was disposed. A remount re-applies immediately and re-adopts the running
 * gateway, so wait briefly before stopping; a disposal with no follow-up is a real teardown
 * and the deferred stop runs.
 */
export function releaseGateway(): void {
  const current = hosted
  if (!current) return
  if (Date.now() - current.reconciledAt < hostTiming.recentReconcileMs) return
  cancelPendingShutdown()
  pendingShutdown = setTimeout(() => {
    pendingShutdown = undefined
    void shutdownGateway()
  }, hostTiming.releaseGraceMs)
  pendingShutdown.unref?.()
}
