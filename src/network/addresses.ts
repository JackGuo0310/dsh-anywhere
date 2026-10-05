import { networkInterfaces } from 'node:os'

export interface NetworkAddress { address: string; family: 'IPv4' | 'IPv6'; interface: string }

export function listLanAddresses(): NetworkAddress[] {
  const results: NetworkAddress[] = []
  for (const [name, entries] of Object.entries(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.internal || !entry.address) continue
      if (entry.family !== 'IPv4' && entry.family !== 'IPv6') continue
      results.push({ address: entry.address, family: entry.family, interface: name })
    }
  }
  return results.sort((left, right) => left.interface.localeCompare(right.interface) || left.address.localeCompare(right.address))
}

export function formatAddress(address: string, port: number, protocol = 'http'): string {
  const host = address.includes(':') ? `[${address}]` : address
  return `${protocol}://${host}:${port}`
}
