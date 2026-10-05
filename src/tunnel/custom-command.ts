import { spawn, type ChildProcess } from 'node:child_process'
import type { TunnelProvider, TunnelStatus } from './types.js'

function awaitExit(child: ChildProcess, timeoutMs = 5_000): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => {
    let settled = false
    const finish = () => { if (!settled) { settled = true; clearTimeout(timer); resolve() } }
    const timer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
      finish()
    }, timeoutMs)
    timer.unref()
    child.once('exit', finish)
    child.once('error', finish)
  })
}

/** Explicit argv only: no shell interpolation or implicit shell execution. */
export class CustomCommandTunnelProvider implements TunnelProvider {
  readonly id = 'custom-command'
  private child: ChildProcess | undefined
  private current: TunnelStatus = { state: 'stopped' }
  private operation: Promise<unknown> = Promise.resolve()

  constructor(private readonly command: string, private readonly args: readonly string[], private readonly enabled: boolean) {}
  status(): TunnelStatus { return this.current }
  start(): Promise<TunnelStatus> { return this.serialize(() => this.startUnlocked()) }
  stop(): Promise<void> { return this.serialize(() => this.stopUnlocked()) }
  restart(): Promise<TunnelStatus> { return this.serialize(async () => { await this.stopUnlocked(); return this.startUnlocked() }) }

  private serialize<T>(task: () => Promise<T>): Promise<T> {
    const result = this.operation.then(task, task)
    this.operation = result.then(() => undefined, () => undefined)
    return result
  }

  private async startUnlocked(): Promise<TunnelStatus> {
    if (!this.enabled) throw new Error('Custom command tunnels are disabled by default.')
    if (this.child) return this.current
    this.current = { state: 'starting' }
    const child = spawn(this.command, [...this.args], { shell: false, stdio: 'ignore', windowsHide: true })
    try {
      await new Promise<void>((resolve, reject) => {
        child.once('spawn', resolve)
        child.once('error', reject)
      })
    } catch (error) {
      this.current = { state: 'failed', message: `Unable to start tunnel command: ${error instanceof Error ? error.message : String(error)}` }
      throw error
    }
    this.child = child
    this.current = { state: 'running', pid: child.pid }
    child.once('exit', (code, signal) => {
      if (this.child !== child) return
      this.child = undefined
      this.current = { state: code === 0 ? 'stopped' : 'failed', message: `Tunnel command exited (${code ?? signal ?? 'unknown'}).` }
    })
    return this.current
  }

  private async stopUnlocked(): Promise<void> {
    const child = this.child
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM')
      await awaitExit(child)
    }
    if (this.child === child) this.child = undefined
    this.current = { state: 'stopped' }
  }
}
