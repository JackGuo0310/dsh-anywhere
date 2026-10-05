import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export function generateFrpcToml(config) {
    const frp = config.frp;
    if (!frp.serverAddress || !frp.serverPort || !frp.executablePath)
        throw new Error('FRP executable, server address, and server port are required.');
    if ((frp.transport === 'http' || frp.transport === 'https') && !frp.customDomain)
        throw new Error('HTTP/HTTPS FRP transport requires a custom domain.');
    const auth = frp.authMethod === 'token' ? `\n[auth]\nmethod = "token"\ntoken = ${tomlString(config.token ?? '')}\n` : `\n[auth]\nmethod = ${tomlString(frp.authMethod)}\n`;
    const proxyName = 'dsh-remote';
    const lines = [
        `serverAddr = ${tomlString(frp.serverAddress)}`,
        `serverPort = ${frp.serverPort}`,
        `transport.tls.enable = ${frp.tlsEnabled ? 'true' : 'false'}`,
        auth.trimEnd(),
        '',
        `[[proxies]]`,
        `name = ${tomlString(proxyName)}`,
        `type = ${tomlString(frp.transport)}`,
        `localIP = ${tomlString(config.target.host)}`,
        `localPort = ${config.target.port}`
    ];
    if (frp.transport === 'http' || frp.transport === 'https')
        lines.push(`customDomains = [${tomlString(frp.customDomain)}]`);
    if (frp.transport === 'stcp')
        lines.push(`secretKey = ${tomlString(config.token ?? '')}`);
    return `${lines.filter(Boolean).join('\n')}\n`;
}
function tomlString(value) { return JSON.stringify(value); }
export class FrpTunnelProvider {
    config;
    id = 'frp';
    child;
    temporaryDirectory;
    current = { state: 'stopped' };
    constructor(config) {
        this.config = config;
    }
    status() { return this.current; }
    async start() {
        if (this.child)
            return this.current;
        const executable = this.config.frp.executablePath;
        if (!executable)
            throw new Error('FRP executable path is required.');
        this.current = { state: 'starting' };
        this.temporaryDirectory = await mkdtemp(join(tmpdir(), 'dsh-remote-frp-'));
        const configPath = join(this.temporaryDirectory, 'frpc.toml');
        await writeFile(configPath, generateFrpcToml(this.config), { encoding: 'utf8', mode: 0o600 });
        this.child = spawn(executable, ['-c', configPath], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
        this.current = { state: 'running', pid: this.child.pid };
        this.child.once('exit', (code, signal) => {
            this.child = undefined;
            this.current = { state: code === 0 ? 'stopped' : 'failed', message: `frpc exited (${code ?? signal ?? 'unknown'}).` };
            void this.cleanupTemporaryFiles();
        });
        this.child.once('error', (error) => { this.current = { state: 'failed', message: `Unable to start frpc: ${error.message}` }; });
        return this.current;
    }
    async stop() {
        const child = this.child;
        this.child = undefined;
        if (child && !child.killed)
            child.kill('SIGTERM');
        this.current = { state: 'stopped' };
        await this.cleanupTemporaryFiles();
    }
    async restart() { await this.stop(); return this.start(); }
    async cleanupTemporaryFiles() {
        const dir = this.temporaryDirectory;
        this.temporaryDirectory = undefined;
        if (dir)
            await rm(dir, { recursive: true, force: true });
    }
}
//# sourceMappingURL=frp.js.map