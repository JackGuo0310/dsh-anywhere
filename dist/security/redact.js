const sensitiveKey = /(?:authorization|cookie|password|passphrase|secret|token|api[-_]?key|session)/i;
export function redactValue(value, key = '') {
    if (sensitiveKey.test(key))
        return '[REDACTED]';
    if (Array.isArray(value))
        return value.map((item) => redactValue(item));
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, redactValue(item, name)]));
    }
    return value;
}
export function redactHeaders(headers) {
    return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name, sensitiveKey.test(name) ? '[REDACTED]' : value]));
}
//# sourceMappingURL=redact.js.map