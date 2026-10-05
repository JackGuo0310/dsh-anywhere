import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RemoteAccessConfig } from '../config.js'
import type { TunnelProvider, TunnelStatus } from './types.js'

export interface FrpRuntimeConfig extends Required<Pick<RemoteAccessConfig, 'target'>> {
  frp: NonNullable<RemoteAccessConfig['frp']>
  token?: string
}

export function generateFrpcToml(config: FrpRuntimeConfig): string {
  const frp = config.frp
  if (!frp.serverAddress || !frp.serverPort || !frp.executablePath) throw new Error('FRP executable, server address, and server port are required.')
  if (frp.authMethod === 'token' && !config.token) throw new Error('FRP token credential is missing or empty.')
  if ((frp.transport === 'http' || frp.transport === 'https') && !frp.customDomain) throw new Error('HTTP/HTTPS FRP transport requires a custom domain.')
  const auth = frp.authMethod === 'token' ? `\n[auth]\nmethod = "token"\ntoken = ${tomlString(config.token!)}\n` : `\n[auth]\nmethod = ${tomlString(frp.authMethod)}\n`
  const lines = [
    `serverAddr = ${tomlString(frp.serverAddress)}`,
    `serverPort = ${frp.serverPort}`,
    `transport.tls.enable = ${frp.tlsEnabled ? 'true' : 'false'}`,
    auth.trimEnd(), '', '[[proxies]]', 'name = "dsh-remote"',
    `type = ${tomlString(frp.transport)}`,
    `localIP = ${tomlString(config.target.host)}`,
    `localPort = ${config.target.port}`,
  ]
  if (frp.transport === 'http' || frp.transport === 'https') lines.push(`customDomains = [${tomlString(frp.customDomain!)}]`)
  if (frp.transport === 'stcp') lines.push(`secretKey = ${tomlString(config.token ?? '')}`)
  return `${lines.filter(Boolean).join('\n')}\n`
}

function tomlString(value: string): string { return JSON.stringify(value) }

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

export class FrpTunnelProvider implements TunnelProvider {
  readonly id = 'frp'
  private child: ChildProcess | undefined
  private temporaryDirectory: string | undefined
  private current: TunnelStatus = { state: 'stopped' }
  private operation: Promise<unknown> = Promise.resolve()

  constructor(private readonly config: FrpRuntimeConfig) {}
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
    if (this.child) return this.current
    const executable = this.config.frp.executablePath
    if (!executable) throw new Error('FRP executable path is required.')
    this.current = { state: 'starting' }
    try {
      this.temporaryDirectory = await mkdtemp(join(tmpdir(), 'dsh-remote-frp-'))
      const configPath = join(this.temporaryDirectory, 'frpc.toml')
      await writeFile(configPath, generateFrpcToml(this.config), { encoding: 'utf8', mode: 0o600 })
      const child = spawn(executable, ['-c', configPath], { stdio: 'ignore', windowsHide: true })
      await new Promise<void>((resolve, reject) => {
        child.once('spawn', resolve)
        child.once('error', reject)
      })
      this.child = child
      this.current = { state: 'running', pid: child.pid }
      child.once('exit', (code, signal) => {
        if (this.child !== child) return
        this.child = undefined
        this.current = { state: code === 0 ? 'stopped' : 'failed', message: `frpc exited (${code ?? signal ?? 'unknown'}).` }
        void this.cleanupTemporaryFiles()
      })
      return this.current
    } catch (error) {
      this.child = undefined
      this.current = { state: 'failed', message: `Unable to start frpc: ${error instanceof Error ? error.message : String(error)}` }
      await this.cleanupTemporaryFiles()
      throw error
    }
  }

  private async stopUnlocked(): Promise<void> {
    const child = this.child
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM')
      await awaitExit(child)
    }
    if (this.child === child) this.child = undefined
    this.current = { state: 'stopped' }
    await this.cleanupTemporaryFiles()
  }

  private async cleanupTemporaryFiles(): Promise<void> {
    const dir = this.temporaryDirectory
    this.temporaryDirectory = undefined
    if (dir) await rm(dir, { recursive: true, force: true })
  }
}
