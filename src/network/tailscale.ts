import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface TailscaleStatus {
  installed: boolean
  connected: boolean
  ipv4: string[]
  ipv6: string[]
  magicDnsName?: string
  error?: string
}

interface TailscaleJson { BackendState?: string; Self?: { TailscaleIPs?: string[]; DNSName?: string } }

export function parseTailscaleStatus(json: string): TailscaleStatus {
  const parsed = JSON.parse(json) as TailscaleJson
  const addresses = parsed.Self?.TailscaleIPs ?? []
  return {
    installed: true,
    connected: parsed.BackendState === 'Running',
    ipv4: addresses.filter((address) => address.includes('.')),
    ipv6: addresses.filter((address) => address.includes(':')),
    magicDnsName: parsed.Self?.DNSName?.replace(/\.$/, '')
  }
}

export async function detectTailscale(timeoutMs = 3_000): Promise<TailscaleStatus> {
  try {
    const { stdout } = await execFileAsync('tailscale', ['status', '--json'], { timeout: timeoutMs, windowsHide: true })
    return parseTailscaleStatus(stdout)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return { installed: false, connected: false, ipv4: [], ipv6: [], error: 'Tailscale is not installed or is not on PATH.' }
    return { installed: true, connected: false, ipv4: [], ipv6: [], error: 'Tailscale is not connected or did not respond.' }
  }
}
