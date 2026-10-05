import { spawn } from 'node:child_process';
function awaitExit(child, timeoutMs = 5_000) {
    if (child.exitCode !== null || child.signalCode !== null)
        return Promise.resolve();
    return new Promise((resolve) => {
        let settled = false;
        const finish = () => { if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve();
        } };
        const timer = setTimeout(() => {
            if (child.exitCode === null && child.signalCode === null)
                child.kill('SIGKILL');
            finish();
        }, timeoutMs);
        timer.unref();
        child.once('exit', finish);
        child.once('error', finish);
    });
}
/** Explicit argv only: no shell interpolation or implicit shell execution. */
export class CustomCommandTunnelProvider {
    command;
    args;
    enabled;
    id = 'custom-command';
    child;
    current = { state: 'stopped' };
    operation = Promise.resolve();
    constructor(command, args, enabled) {
        this.command = command;
        this.args = args;
        this.enabled = enabled;
    }
    status() { return this.current; }
    start() { return this.serialize(() => this.startUnlocked()); }
    stop() { return this.serialize(() => this.stopUnlocked()); }
    restart() { return this.serialize(async () => { await this.stopUnlocked(); return this.startUnlocked(); }); }
    serialize(task) {
        const result = this.operation.then(task, task);
        this.operation = result.then(() => undefined, () => undefined);
        return result;
    }
    async startUnlocked() {
        if (!this.enabled)
            throw new Error('Custom command tunnels are disabled by default.');
        if (this.child)
            return this.current;
        this.current = { state: 'starting' };
        const child = spawn(this.command, [...this.args], { shell: false, stdio: 'ignore', windowsHide: true });
        try {
            await new Promise((resolve, reject) => {
                child.once('spawn', resolve);
                child.once('error', reject);
            });
        }
        catch (error) {
            this.current = { state: 'failed', message: `Unable to start tunnel command: ${error instanceof Error ? error.message : String(error)}` };
            throw error;
        }
        this.child = child;
        this.current = { state: 'running', pid: child.pid };
        child.once('exit', (code, signal) => {
            if (this.child !== child)
                return;
            this.child = undefined;
            this.current = { state: code === 0 ? 'stopped' : 'failed', message: `Tunnel command exited (${code ?? signal ?? 'unknown'}).` };
        });
        return this.current;
    }
    async stopUnlocked() {
        const child = this.child;
        if (child && child.exitCode === null && child.signalCode === null) {
            child.kill('SIGTERM');
            await awaitExit(child);
        }
        if (this.child === child)
            this.child = undefined;
        this.current = { state: 'stopped' };
    }
}
//# sourceMappingURL=custom-command.js.map