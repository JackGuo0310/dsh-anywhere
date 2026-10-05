import { networkInterfaces } from 'node:os';
export function listLanAddresses() {
    const results = [];
    for (const [name, entries] of Object.entries(networkInterfaces())) {
        for (const entry of entries ?? []) {
            if (entry.internal || !entry.address)
                continue;
            if (entry.family !== 'IPv4' && entry.family !== 'IPv6')
                continue;
            results.push({ address: entry.address, family: entry.family, interface: name });
        }
    }
    return results.sort((left, right) => left.interface.localeCompare(right.interface) || left.address.localeCompare(right.address));
}
export function formatAddress(address, port, protocol = 'http') {
    const host = address.includes(':') ? `[${address}]` : address;
    return `${protocol}://${host}:${port}`;
}
//# sourceMappingURL=addresses.js.map