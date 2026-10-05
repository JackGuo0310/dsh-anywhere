import { spawn, type ChildProcess } from 'node:child_process'
import type { TunnelProvider, TunnelStatus } from './types.js'

/** Explicit argv only: no shell interpolation or implicit shell execution. */
export class CustomCommandTunnelProvider implements TunnelProvider {
  readonly id = 'custom-command'
  private child: ChildProcess | undefined
  private current: TunnelStatus = { state: 'stopped' }

  constructor(private readonly command: string, private readonly args: readonly string[], private readonly enabled: boolean) {}
  status(): TunnelStatus { return this.current }
  async start(): Promise<TunnelStatus> {
    if (!this.enabled) throw new Error('Custom command tunnels are disabled by default.')
    if (this.child) return this.current
    this.current = { state: 'starting' }
    this.child = spawn(this.command, [...this.args], { shell: false, stdio: 'ignore', windowsHide: true })
    this.current = { state: 'running', pid: this.child.pid }
    this.child.once('exit', (code, signal) => { this.child = undefined; this.current = { state: code === 0 ? 'stopped' : 'failed', message: `Tunnel command exited (${code ?? signal ?? 'unknown'}).` } })
    this.child.once('error', (error) => { this.current = { state: 'failed', message: `Unable to start tunnel command: ${error.message}` } })
    return this.current
  }
  async stop(): Promise<void> { if (this.child && !this.child.killed) this.child.kill('SIGTERM'); this.child = undefined; this.current = { state: 'stopped' } }
  async restart(): Promise<TunnelStatus> { await this.stop(); return this.start() }
}
