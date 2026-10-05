export interface TailscaleStatus {
    installed: boolean;
    connected: boolean;
    ipv4: string[];
    ipv6: string[];
    magicDnsName?: string;
    error?: string;
}
export declare function parseTailscaleStatus(json: string): TailscaleStatus;
export declare function detectTailscale(timeoutMs?: number): Promise<TailscaleStatus>;
//# sourceMappingURL=tailscale.d.ts.map