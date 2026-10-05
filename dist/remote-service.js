var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { networkInterfaces } from 'node:os';
import { FrpTunnelProvider } from './tunnel/frp.js';
import { CustomCommandTunnelProvider } from './tunnel/custom-command.js';
import { RemoteGateway } from './gateway/remote-gateway.js';
import { detectTailscale } from './network/tailscale.js';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
function redactConfig(config) {
    return {
        enabled: config.enabled,
        mode: config.mode,
        listenHost: config.listenHost,
        listenPort: config.listenPort,
        target: config.target,
        publicBaseUrl: config.publicBaseUrl,
        adminConfigured: config.adminConfigured,
        tunnel: config.frp ? 'frp' : config.customCommandEnabled ? 'custom-command' : undefined,
    };
}
function lanAddresses() {
    const addresses = [];
    for (const entries of Object.values(networkInterfaces())) {
        for (const entry of entries ?? []) {
            if (!entry.internal && entry.family === 'IPv4')
                addresses.push(entry.address);
        }
    }
    return [...new Set(addresses)];
}
/** Host RPC surface. It never returns passwords, password hashes, tokens, or credential references. */
let RemoteAccessService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _status_decorators;
    let _discoverNetwork_decorators;
    let _detectTailscale_decorators;
    let _startTunnel_decorators;
    let _restartTunnel_decorators;
    let _changePassword_decorators;
    let _revokeAllSessions_decorators;
    return class RemoteAccessService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _status_decorators = [Remote('status')];
            _discoverNetwork_decorators = [Remote('discoverNetwork')];
            _detectTailscale_decorators = [Remote('detectTailscale')];
            _startTunnel_decorators = [Remote('startTunnel')];
            _restartTunnel_decorators = [Remote('restartTunnel')];
            _changePassword_decorators = [Remote('changePassword')];
            _revokeAllSessions_decorators = [Remote('revokeAllSessions')];
            __esDecorate(this, null, _status_decorators, { kind: "method", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _discoverNetwork_decorators, { kind: "method", name: "discoverNetwork", static: false, private: false, access: { has: obj => "discoverNetwork" in obj, get: obj => obj.discoverNetwork }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _detectTailscale_decorators, { kind: "method", name: "detectTailscale", static: false, private: false, access: { has: obj => "detectTailscale" in obj, get: obj => obj.detectTailscale }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _startTunnel_decorators, { kind: "method", name: "startTunnel", static: false, private: false, access: { has: obj => "startTunnel" in obj, get: obj => obj.startTunnel }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _restartTunnel_decorators, { kind: "method", name: "restartTunnel", static: false, private: false, access: { has: obj => "restartTunnel" in obj, get: obj => obj.restartTunnel }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _changePassword_decorators, { kind: "method", name: "changePassword", static: false, private: false, access: { has: obj => "changePassword" in obj, get: obj => obj.changePassword }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _revokeAllSessions_decorators, { kind: "method", name: "revokeAllSessions", static: false, private: false, access: { has: obj => "revokeAllSessions" in obj, get: obj => obj.revokeAllSessions }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        config = __runInitializers(this, _instanceExtraInitializers);
        gateway;
        tunnel;
        constructor(ctx, config) {
            super(ctx, 'dshRemoteAccess', { namespace: 'dshRemoteAccess' });
            this.config = config;
        }
        async start() {
            const passwordHash = await this.loadPasswordHash();
            this.gateway = new RemoteGateway(this.config, passwordHash);
            await this.gateway.start();
            try {
                this.tunnel = await this.createTunnel();
                if (this.tunnel && this.config.frp?.startWithDsh)
                    await this.tunnel.start();
            }
            catch (error) {
                await this.gateway.stop();
                this.gateway = undefined;
                throw error;
            }
        }
        async stop() {
            const tunnel = this.tunnel;
            this.tunnel = undefined;
            await tunnel?.stop();
            const gateway = this.gateway;
            this.gateway = undefined;
            await gateway?.stop();
        }
        async status() {
            const passwordHash = this.gateway?.passwordRecord() ?? await this.loadPasswordHash();
            return {
                configured: redactConfig(this.config),
                running: !!this.gateway,
                administratorConfigured: !!passwordHash,
                tunnel: this.tunnel ? { id: this.tunnel.id, ...this.tunnel.status() } : undefined,
            };
        }
        async discoverNetwork() {
            return { lanIpv4: lanAddresses(), gatewayPort: this.config.listenPort };
        }
        async detectTailscale() {
            return detectTailscale();
        }
        async startTunnel() {
            if (!this.tunnel)
                throw new Error('No tunnel provider is configured.');
            return { id: this.tunnel.id, ...(await this.tunnel.start()) };
        }
        async restartTunnel() {
            if (!this.tunnel)
                throw new Error('No tunnel provider is configured.');
            return { id: this.tunnel.id, ...(await this.tunnel.restart()) };
        }
        async changePassword(request) {
            if (!this.gateway)
                throw new Error('Gateway is not running.');
            if (!this.config.adminPasswordSecretRef)
                throw new Error('Administrator password credential reference is not configured.');
            if (!request || typeof request.currentPassword !== 'string' || typeof request.newPassword !== 'string') {
                throw new Error('Current and new administrator passwords are required.');
            }
            const nextHash = await this.gateway.changeAdminPassword(request.currentPassword, request.newPassword);
            try {
                const credentials = this.credentials();
                await credentials.set(this.config.adminPasswordSecretRef, nextHash);
            }
            catch (error) {
                // Do not leave a runtime-only password after credential persistence fails.
                await this.stop();
                throw error;
            }
            return { changed: true, sessionsRevoked: true };
        }
        async revokeAllSessions() {
            if (!this.gateway)
                throw new Error('Gateway is not running.');
            this.gateway.revokeAllSessions();
            return { revoked: true };
        }
        async createTunnel() {
            if (this.config.frp) {
                const token = await this.resolveCredential(this.config.frp.tokenSecretRef);
                const stcpSecret = await this.resolveCredential(this.config.frp.stcpSecretRef);
                if (this.config.frp.authMethod === 'token' && !token)
                    throw new Error('FRP token credential could not be resolved.');
                if (this.config.frp.transport === 'stcp' && !stcpSecret)
                    throw new Error('STCP secret credential could not be resolved.');
                return new FrpTunnelProvider({ target: this.config.target, frp: this.config.frp, token, stcpSecret });
            }
            if (this.config.customCommandEnabled && this.config.customCommand) {
                return new CustomCommandTunnelProvider(this.config.customCommand.command, this.config.customCommand.args, true);
            }
            return undefined;
        }
        credentials() {
            const credentials = this.ctx.get('credentials');
            if (!credentials)
                throw new Error('DSH credentials service is required when a secret reference is configured.');
            return credentials;
        }
        async resolveCredential(ref) {
            if (!ref)
                return undefined;
            return (await this.credentials().resolve(ref))?.value;
        }
        async loadPasswordHash() {
            return this.resolveCredential(this.config.adminPasswordSecretRef);
        }
    };
})();
export { RemoteAccessService };
//# sourceMappingURL=remote-service.js.map