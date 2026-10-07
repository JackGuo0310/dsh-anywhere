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
import { assertSafeConfig, resolveBindAddresses } from './config.js';
import { FrpTunnelProvider } from './tunnel/frp.js';
import { CustomCommandTunnelProvider } from './tunnel/custom-command.js';
import { reconcileGateway, releaseGateway, shutdownGateway } from './gateway/host.js';
import { detectTailscale } from './network/tailscale.js';
import { hashPassword } from './security/password.js';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
function redactConfig(config) {
    return {
        ...config,
        frp: config.frp ? { ...config.frp } : undefined,
        tunnel: config.frp ? 'frp' : config.customCommandEnabled ? 'custom-command' : undefined,
    };
}
function objectOf(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Configuration must be an object.');
    return value;
}
function optionalSecret(value) {
    return typeof value === 'string' && value.length ? value : undefined;
}
/** Host RPC surface. It never returns passwords, password hashes, tokens, or credential references. */
let RemoteAccessService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _status_decorators;
    let _saveConfig_decorators;
    let _secretStatus_decorators;
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
            _saveConfig_decorators = [Remote('saveCommonConfig')];
            _secretStatus_decorators = [Remote('secretStatus')];
            _discoverNetwork_decorators = [Remote('discoverNetwork')];
            _detectTailscale_decorators = [Remote('detectTailscale')];
            _startTunnel_decorators = [Remote('startTunnel')];
            _restartTunnel_decorators = [Remote('restartTunnel')];
            _changePassword_decorators = [Remote('changePassword')];
            _revokeAllSessions_decorators = [Remote('revokeAllSessions')];
            __esDecorate(this, null, _status_decorators, { kind: "method", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _saveConfig_decorators, { kind: "method", name: "saveConfig", static: false, private: false, access: { has: obj => "saveConfig" in obj, get: obj => obj.saveConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _secretStatus_decorators, { kind: "method", name: "secretStatus", static: false, private: false, access: { has: obj => "secretStatus" in obj, get: obj => obj.secretStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
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
            const connection = this.ctx.get('connection');
            if (!connection)
                throw new Error('DSH Connection service is required to authenticate upstream browser requests.');
            const authenticatedUrl = () => connection.authenticatedUrl(`${this.config.target.protocol}://${this.config.target.host}:${this.config.target.port}/`);
            // The gateway outlives a configuration remount; only the addresses that changed rebind.
            this.gateway = await reconcileGateway(this.config, passwordHash, authenticatedUrl);
            try {
                this.tunnel = await this.createTunnel();
                if (this.tunnel && (this.config.frp?.startWithDsh || this.config.customCommandEnabled))
                    await this.tunnel.start();
            }
            catch (error) {
                try {
                    await this.stop();
                }
                catch { /* Preserve the startup failure. */ }
                throw error;
            }
        }
        /** The plugin was disposed: stop managed children now, but let a remount re-adopt the gateway. */
        release() {
            const tunnel = this.tunnel;
            this.tunnel = undefined;
            this.gateway = undefined;
            void tunnel?.stop();
            releaseGateway();
        }
        async stop() {
            const tunnel = this.tunnel;
            this.tunnel = undefined;
            this.gateway = undefined;
            try {
                await tunnel?.stop();
            }
            finally {
                await shutdownGateway();
            }
        }
        async status() {
            const passwordHash = this.gateway?.passwordRecord() ?? await this.loadPasswordHash();
            return {
                configured: redactConfig(this.config),
                running: !!this.gateway,
                bound: this.gateway?.boundAuthorities() ?? [],
                addresses: this.gateway?.listenAddresses() ?? [],
                administratorConfigured: !!passwordHash,
                tunnel: this.tunnel ? { id: this.tunnel.id, ...this.tunnel.status() } : undefined,
            };
        }
        async saveConfig(request) {
            const submitted = objectOf(request?.config);
            const secrets = objectOf(request?.secrets ?? {});
            const administratorConfigured = !!(await this.loadPasswordHash());
            const next = assertSafeConfig({ ...submitted, version: this.config.version, adminConfigured: administratorConfigured });
            const secretWrites = [
                [next.frp?.tokenSecretRef, optionalSecret(secrets.frpToken)],
                [next.frp?.stcpSecretRef, optionalSecret(secrets.stcpSecret)],
            ];
            for (const [ref, value] of secretWrites)
                if (ref && value)
                    await this.credentials().set(ref, value);
            const editor = this.ctx.get('configEditor');
            if (!editor)
                throw new Error('DSH configuration editor is unavailable.');
            const entry = editor.entries().find((item) => item.options?.id === 'dsh-remote-access' || item.options?.name === '@dsh-community/dsh-remote-access');
            if (!entry)
                throw new Error('Remote access configuration entry was not found.');
            await editor.edit(entry, () => ({ ...next }));
            return { saved: true, secretsUpdated: secretWrites.filter(([ref, value]) => ref && value).length };
        }
        async secretStatus() {
            const credentials = this.credentials();
            const refs = {
                administrator: this.config.adminPasswordSecretRef,
                frpToken: this.config.frp?.tokenSecretRef,
                stcpSecret: this.config.frp?.stcpSecretRef,
            };
            const result = {};
            for (const [key, ref] of Object.entries(refs))
                result[key] = ref ? await credentials.describe(ref) : { configured: false, writable: true };
            return result;
        }
        async discoverNetwork() {
            // Report exactly what the LAN listener would bind, so the UI cannot drift from the gateway.
            const lanIpv4 = resolveBindAddresses({ ...this.config, listeners: { local: false, lan: true, tailscale: false } })
                .filter((address) => address !== '127.0.0.1');
            return { lanIpv4, gatewayPort: this.config.listenPort };
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
            if (!this.config.adminPasswordSecretRef)
                throw new Error('Administrator password credential reference is not configured.');
            if (!request || typeof request.newPassword !== 'string')
                throw new Error('A new administrator password is required.');
            const storedHash = await this.loadPasswordHash();
            const runtimeHash = this.gateway?.passwordRecord();
            const initializing = !storedHash && !runtimeHash;
            if (!initializing && !this.gateway)
                throw new Error('Gateway is not running. Start it before changing the administrator password.');
            if (!initializing && typeof request.currentPassword !== 'string')
                throw new Error('The current administrator password is required.');
            if (initializing) {
                const nextHash = await hashPassword(request.newPassword);
                await this.credentials().set(this.config.adminPasswordSecretRef, nextHash);
                return { changed: true, initialized: true, sessionsRevoked: false };
            }
            const nextHash = await this.gateway.changeAdminPassword(request.currentPassword, request.newPassword);
            try {
                await this.credentials().set(this.config.adminPasswordSecretRef, nextHash);
            }
            catch (error) {
                // Do not leave a runtime-only password after credential persistence fails.
                await this.stop();
                throw error;
            }
            return { changed: true, initialized: false, sessionsRevoked: true };
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
                return new FrpTunnelProvider({ gatewayTarget: { host: '127.0.0.1', port: this.config.listenPort }, frp: this.config.frp, token, stcpSecret });
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