export interface NetworkAddress {
    address: string;
    family: 'IPv4' | 'IPv6';
    interface: string;
}
export declare function listLanAddresses(): NetworkAddress[];
export declare function formatAddress(address: string, port: number, protocol?: string): string;
//# sourceMappingURL=addresses.d.ts.map