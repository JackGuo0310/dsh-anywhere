const sensitiveKey = /(?:authorization|cookie|password|passphrase|secret|token|api[-_]?key|session)/i

export function redactValue(value: unknown, key = ''): unknown {
  if (sensitiveKey.test(key)) return '[REDACTED]'
  if (Array.isArray(value)) return value.map((item) => redactValue(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([name, item]) => [name, redactValue(item, name)]))
  }
  return value
}

export function redactHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string | string[] | undefined> {
  return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name, sensitiveKey.test(name) ? '[REDACTED]' : value]))
}
