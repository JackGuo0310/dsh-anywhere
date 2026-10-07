import { isIP } from 'node:net'
import type { IncomingMessage } from 'node:http'

export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header || header.length > 16_384) return {}
  const cookies: Record<string, string> = {}
  for (const part of header.split(';').slice(0, 128)) {
    const [key, value] = part.trim().split(/=(.*)/s, 2)
    if (!key) continue
    try { cookies[key] = decodeURIComponent(value ?? '') } catch { /* Ignore malformed cookie pairs. */ }
  }
  return cookies
}

export function canonicalAuthority(value: string): string | undefined {
  try {
    const url = new URL(`http://${value}`)
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return undefined
    return url.host.toLowerCase()
  } catch { return undefined }
}

function ipv4Number(value: string): number | undefined {
  if (isIP(value) !== 4) return undefined
  return value.split('.').reduce((total, octet) => (total << 8) + Number(octet), 0) >>> 0
}

function matchesIpv4Cidr(address: string, cidr: string): boolean {
  const [network, prefixText] = cidr.split('/')
  const value = ipv4Number(address)
  const base = ipv4Number(network)
  const prefix = Number(prefixText)
  if (value === undefined || base === undefined || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  return (value & mask) === (base & mask)
}

function ipv6Bytes(value: string): number[] | undefined {
  if (isIP(value) !== 6) return undefined
  const sides = value.toLowerCase().split('::')
  if (sides.length > 2) return undefined
  const expand = (part: string) => part ? part.split(':').map((word) => Number.parseInt(word, 16)) : []
  const left = expand(sides[0])
  const right = expand(sides[1] ?? '')
  const words = sides.length === 2 ? [...left, ...Array(8 - left.length - right.length).fill(0), ...right] : left
  if (words.length !== 8 || words.some((word) => !Number.isInteger(word) || word < 0 || word > 0xffff)) return undefined
  return words.flatMap((word) => [word >>> 8, word & 0xff])
}

function matchesIpv6Cidr(address: string, cidr: string): boolean {
  const [network, prefixText] = cidr.split('/')
  const value = ipv6Bytes(address)
  const base = ipv6Bytes(network)
  const prefix = Number(prefixText)
  if (!value || !base || !Number.isInteger(prefix) || prefix < 0 || prefix > 128) return false
  const completeBytes = Math.floor(prefix / 8)
  for (let index = 0; index < completeBytes; index++) if (value[index] !== base[index]) return false
  const remaining = prefix % 8
  if (!remaining) return true
  const mask = 0xff << (8 - remaining)
  return (value[completeBytes] & mask) === (base[completeBytes] & mask)
}

export function isTrustedProxy(remoteAddress: string | undefined, trusted: readonly string[]): boolean {
  if (!remoteAddress) return false
  const normalized = remoteAddress.startsWith('::ffff:') ? remoteAddress.slice(7) : remoteAddress
  return trusted.some((entry) => entry.includes('/') ? (isIP(normalized) === 4 ? matchesIpv4Cidr(normalized, entry) : matchesIpv6Cidr(normalized, entry)) : entry === remoteAddress || entry === normalized)
}

export function effectiveAuthority(req: IncomingMessage, trustedProxies: readonly string[]): string | undefined {
  const fromProxy = isTrustedProxy(req.socket.remoteAddress, trustedProxies)
  const forwarded = fromProxy ? req.headers['x-forwarded-host'] : undefined
  const candidate = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.headers.host
  return candidate ? canonicalAuthority(candidate) : undefined
}

export function websocketOriginAllowed(req: IncomingMessage, allowedAuthorities: readonly string[], trustedProxies: readonly string[], publicBaseUrl?: string): boolean {
  const origin = req.headers.origin
  if (!origin || typeof origin !== 'string') return false
  try {
    const parsed = new URL(origin)
    const authority = effectiveAuthority(req, trustedProxies)
    if (publicBaseUrl) return parsed.origin === new URL(publicBaseUrl).origin && parsed.origin === origin && authority === parsed.host.toLowerCase()
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.origin === origin && !!authority
      && allowedAuthorities.includes(parsed.host.toLowerCase()) && parsed.host.toLowerCase() === authority
  } catch { return false }
}

export function originAllowed(req: IncomingMessage, allowedAuthorities: readonly string[], trustedProxies: readonly string[], publicBaseUrl?: string): boolean {
  const method = req.method?.toUpperCase() ?? 'GET'
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true
  return websocketOriginAllowed(req, allowedAuthorities, trustedProxies, publicBaseUrl)
}

export function proxyWriteAllowed(req: IncomingMessage, allowedAuthorities: readonly string[], trustedProxies: readonly string[], publicBaseUrl?: string): boolean {
  const method = req.method?.toUpperCase() ?? 'GET'
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true
  const fetchSite = req.headers['sec-fetch-site']
  if (fetchSite !== undefined && fetchSite !== 'same-origin' && fetchSite !== 'none') return false
  if (req.headers.origin !== undefined) return websocketOriginAllowed(req, allowedAuthorities, trustedProxies, publicBaseUrl)
  if (fetchSite === 'same-origin') return true
  const referer = req.headers.referer
  if (typeof referer !== 'string') return false
  try {
    const parsed = new URL(referer)
    return websocketOriginAllowed({ ...req, headers: { ...req.headers, origin: parsed.origin } } as IncomingMessage, allowedAuthorities, trustedProxies, publicBaseUrl)
  } catch { return false }
}

export function hostAllowed(req: IncomingMessage, allowedAuthorities: readonly string[], trustedProxies: readonly string[]): boolean {
  const authority = effectiveAuthority(req, trustedProxies)
  return !!authority && allowedAuthorities.includes(authority)
}

export function remoteClientIp(req: IncomingMessage, trustedProxies: readonly string[]): string {
  if (isTrustedProxy(req.socket.remoteAddress, trustedProxies)) {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress ?? 'unknown'
}

export function isPrivateOrLoopbackIp(value: string): boolean {
  if (value === '::1' || value.startsWith('127.')) return true
  if (isIP(value) === 4) return value.startsWith('10.') || value.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(value)
  return value.startsWith('fd') || value.startsWith('fc')
}
