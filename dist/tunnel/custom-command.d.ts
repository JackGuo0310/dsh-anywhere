import type { TunnelProvider, TunnelStatus } from './types.js';
/** Explicit argv only: no shell interpolation or implicit shell execution. */
export declare class CustomCommandTunnelProvider implements TunnelProvider {
    private readonly command;
    private readonly args;
    private readonly enabled;
    readonly id = "custom-command";
    private child;
    private current;
    private operation;
    constructor(command: string, args: readonly string[], enabled: boolean);
    status(): TunnelStatus;
    start(): Promise<TunnelStatus>;
    stop(): Promise<void>;
    restart(): Promise<TunnelStatus>;
    private serialize;
    private startUnlocked;
    private stopUnlocked;
}
//# sourceMappingURL=custom-command.d.ts.map