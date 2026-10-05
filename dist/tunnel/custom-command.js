import { spawn } from 'node:child_process';
/** Explicit argv only: no shell interpolation or implicit shell execution. */
export class CustomCommandTunnelProvider {
    command;
    args;
    enabled;
    id = 'custom-command';
    child;
    current = { state: 'stopped' };
    constructor(command, args, enabled) {
        this.command = command;
        this.args = args;
        this.enabled = enabled;
    }
    status() { return this.current; }
    async start() {
        if (!this.enabled)
            throw new Error('Custom command tunnels are disabled by default.');
        if (this.child)
            return this.current;
        this.current = { state: 'starting' };
        this.child = spawn(this.command, [...this.args], { shell: false, stdio: 'ignore', windowsHide: true });
        this.current = { state: 'running', pid: this.child.pid };
        this.child.once('exit', (code, signal) => { this.child = undefined; this.current = { state: code === 0 ? 'stopped' : 'failed', message: `Tunnel command exited (${code ?? signal ?? 'unknown'}).` }; });
        this.child.once('error', (error) => { this.current = { state: 'failed', message: `Unable to start tunnel command: ${error.message}` }; });
        return this.current;
    }
    async stop() { if (this.child && !this.child.killed)
        this.child.kill('SIGTERM'); this.child = undefined; this.current = { state: 'stopped' }; }
    async restart() { await this.stop(); return this.start(); }
}
//# sourceMappingURL=custom-command.js.map