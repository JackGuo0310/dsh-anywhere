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

/** A disposal this soon after a reconcile is a remount, not a real teardown. */
const REMOUNT_WINDOW_MS = 1_500

let hosted: HostedGateway | undefined

export function hostedGateway(): RemoteGateway | undefined { return hosted?.gateway }

export async function reconcileGateway(config: RemoteAccessConfig, passwordHash?: string, authenticatedUrl?: () => string): Promise<RemoteGateway> {
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
  const current = hosted
  hosted = undefined
  await current?.gateway.stop()
}

/**
 * Release the gateway because the plugin was disposed. A remount immediately re-adopts the
 * running gateway, so keep it; any later disposal is a real teardown and stops it at once.
 */
export function releaseGateway(): void {
  const current = hosted
  if (!current) return
  if (Date.now() - current.reconciledAt < REMOUNT_WINDOW_MS) return
  void shutdownGateway()
}
