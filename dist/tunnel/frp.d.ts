import type { RemoteAccessConfig } from '../config.js';
import type { TunnelProvider, TunnelStatus } from './types.js';
export interface FrpRuntimeConfig {
    frp: NonNullable<RemoteAccessConfig['frp']>;
    /**
     * The gateway's own listener, never the raw DSH port. Forwarding straight to DSH
     * would publish the unauthenticated upstream and bypass the login gateway entirely.
     */
    gatewayTarget: {
        host: string;
        port: number;
    };
    token?: string;
    stcpSecret?: string;
}
export declare function generateFrpcToml(config: FrpRuntimeConfig): string;
export declare class FrpTunnelProvider implements TunnelProvider {
    private readonly config;
    readonly id = "frp";
    private child;
    private temporaryDirectory;
    private current;
    private operation;
    constructor(config: FrpRuntimeConfig);
    status(): TunnelStatus;
    start(): Promise<TunnelStatus>;
    stop(): Promise<void>;
    restart(): Promise<TunnelStatus>;
    private serialize;
    private startUnlocked;
    private stopUnlocked;
    private cleanupTemporaryFiles;
}
//# sourceMappingURL=frp.d.ts.map