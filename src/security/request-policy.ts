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

export function isTrustedProxy(remoteAddress: string | undefined, trusted: readonly string[]): boolean {
  if (!remoteAddress) return false
  return trusted.includes(remoteAddress) || (remoteAddress.startsWith('::ffff:') && trusted.includes(remoteAddress.slice(7)))
}

export function effectiveAuthority(req: IncomingMessage, trustedProxies: readonly string[]): string | undefined {
  const fromProxy = isTrustedProxy(req.socket.remoteAddress, trustedProxies)
  const forwarded = fromProxy ? req.headers['x-forwarded-host'] : undefined
  const candidate = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.headers.host
  return candidate ? canonicalAuthority(candidate) : undefined
}

export function originAllowed(req: IncomingMessage, allowedAuthorities: readonly string[], trustedProxies: readonly string[]): boolean {
  const method = req.method?.toUpperCase() ?? 'GET'
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true
  const origin = req.headers.origin
  if (!origin || typeof origin !== 'string') return false
  try {
    const parsed = new URL(origin)
    const authority = effectiveAuthority(req, trustedProxies)
    return !!authority && allowedAuthorities.includes(parsed.host.toLowerCase()) && parsed.host.toLowerCase() === authority
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
