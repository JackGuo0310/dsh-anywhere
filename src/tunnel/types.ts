export type TunnelState = 'stopped' | 'starting' | 'running' | 'failed'

export interface TunnelStatus { state: TunnelState; message?: string; pid?: number }

export interface TunnelProvider {
  readonly id: string
  start(): Promise<TunnelStatus>
  stop(): Promise<void>
  restart(): Promise<TunnelStatus>
  status(): TunnelStatus
}
