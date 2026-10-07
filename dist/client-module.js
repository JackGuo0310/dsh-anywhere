import { dictionaries, localeNamespace } from './locale.generated.js';
const packageId = '@dsh-community/dsh-remote-access';
const sectionId = 'dsh-remote-access';
const remoteNamespace = 'dshRemoteAccess';
const pluginVersion = '0.2.3';
const defaults = {
    enabled: false, local: true, lan: false, tailscale: false, tunnelEnabled: false, listenPort: '4173', targetHost: '127.0.0.1', targetPort: '3080', targetProtocol: 'http', publicBaseUrl: '', trustedProxyCidrs: '', sessionTtlMinutes: '1440', maxRequestBodyBytes: '52428800', adminPasswordSecretRef: 'DSH_REMOTE_ADMIN_HASH', tunnelProvider: 'none', frpExecutablePath: '', frpServerAddress: '', frpServerPort: '7000', frpAuthMethod: 'token', frpTokenSecretRef: 'DSH_REMOTE_FRP_TOKEN', frpToken: '', frpStcpSecretRef: 'DSH_REMOTE_FRP_STCP_SECRET', frpStcpSecret: '', frpTransport: 'https', frpCustomDomain: '', frpTlsEnabled: true, frpStartWithDsh: false, customCommand: '', customArgs: '',
};
const css = `
.dsh-remote-access{max-width:840px;padding:4px 0 28px;color:var(--dsw-alias-label-primary)}.dsh-remote-heading{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.dsh-remote-intro{margin:0;color:var(--dsw-alias-label-secondary);line-height:1.55}.dsh-remote-version{display:inline-flex;align-items:center;min-height:24px;padding:1px 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap}.dsh-remote-card{margin-top:16px;padding:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}.dsh-remote-card h2{margin:0 0 8px;font-size:16px}.dsh-remote-card p{margin:0;color:var(--dsw-alias-label-secondary);line-height:1.5}.dsh-remote-note{padding:14px 16px;border-radius:9px;background:var(--dsw-alias-bg-layer-2)}.dsh-remote-status-grid,.dsh-remote-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 20px;margin-top:16px}.dsh-remote-row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}.dsh-remote-value{color:var(--dsw-alias-label-secondary);text-align:right}.dsh-remote-value[data-state=success]{color:var(--dsw-alias-state-success-primary)}.dsh-remote-fields label{display:grid;gap:7px;font-size:14px}.dsh-remote-fields .wide{grid-column:1/-1}.dsh-remote-fields input,.dsh-remote-fields select,.dsh-remote-fields textarea{min-height:44px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit}.dsh-remote-fields textarea{min-height:76px;resize:vertical}.dsh-remote-check{display:flex!important;align-items:center;gap:10px!important}.dsh-remote-check input{min-height:auto;width:18px;height:18px}.dsh-remote-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.dsh-remote-button{min-height:44px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer}.dsh-remote-button-primary{border-color:transparent;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base)}.dsh-remote-button:disabled{opacity:.5;cursor:wait}.dsh-remote-button:focus-visible,.dsh-remote-fields :focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.dsh-remote-feedback{margin-top:12px;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2)}.dsh-remote-feedback[data-tone=success]{color:var(--dsw-alias-state-success-primary)}.dsh-remote-feedback[data-tone=error]{color:#c62828!important;border:1px solid #d32f2f;background:#ffebee}.dsh-remote-actions+.dsh-remote-feedback{margin-top:10px}.dsh-remote-subtitle{grid-column:1/-1;margin:8px 0 0;font-size:14px;font-weight:650}.dsh-remote-mode{grid-column:1/-1;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2)}.dsh-remote-hint{flex:1 1 100%;margin:0;font-size:12px;color:var(--dsw-alias-label-secondary)}.dsh-remote-hint[data-tone=warn]{color:var(--dsw-alias-state-warning-primary)}.dsh-remote-mode .dsh-remote-check{flex:1 1 auto}.dsh-remote-mode .dsh-remote-button{margin-top:0}@media(max-width:640px){.dsh-remote-status-grid,.dsh-remote-fields{grid-template-columns:1fr}.dsh-remote-fields .wide,.dsh-remote-subtitle{grid-column:auto}}
`;
function objectOf(value) { return value && typeof value === 'object' ? value : {}; }
function text(value, fallback = '') { return typeof value === 'string' ? value : fallback; }
function validateForm(form, administratorConfigured, t) {
    const portKeys = ['listenPort', 'targetPort', ...(form.tunnelProvider === 'frp' ? ['frpServerPort'] : [])];
    if (portKeys.some((key) => !Number.isInteger(Number(form[key])) || Number(form[key]) < 1 || Number(form[key]) > 65535))
        return t('invalidPort');
    const ttl = Number(form.sessionTtlMinutes);
    if (!Number.isInteger(ttl) || ttl < 5 || ttl > 43200)
        return t('invalidSessionTtl');
    const body = Number(form.maxRequestBodyBytes);
    if (!Number.isInteger(body) || body < 1024 || body > 1073741824)
        return t('invalidBodyLimit');
    if (!String(form.targetHost).trim())
        return t('hostRequired');
    if (!administratorConfigured)
        return t('passwordFirst');
    if (!(form.local || form.lan || form.tailscale || form.tunnelEnabled))
        return t('accessModeRequired');
    if (form.tunnelEnabled && !form.local)
        return t('tunnelNeedsLocal');
    if (form.tunnelEnabled && !String(form.publicBaseUrl).startsWith('https://'))
        return t('publicUrlHttpsRequired');
    if (form.tunnelEnabled && form.tunnelProvider === 'none')
        return t('tunnelProviderRequired');
    if (form.tunnelProvider === 'frp' && (!form.frpExecutablePath || !form.frpServerAddress))
        return t('frpRequired');
    if (form.tunnelProvider === 'frp' && form.frpAuthMethod === 'token' && !form.frpTokenSecretRef)
        return t('frpTokenRefRequired');
    if (form.tunnelProvider === 'frp' && form.frpTransport !== 'stcp' && !form.frpCustomDomain)
        return t('frpDomainRequired');
    if (form.tunnelProvider === 'frp' && form.frpTransport === 'stcp' && !form.frpStcpSecretRef)
        return t('stcpRefRequired');
    if (form.tunnelProvider === 'custom' && !String(form.customCommand).trim())
        return t('customCommandRequired');
    return undefined;
}
function SettingsSection({ t, call, React }) {
    const h = React.createElement;
    const [status, setStatus] = React.useState({});
    const [form, setForm] = React.useState({ ...defaults });
    const [busy, setBusy] = React.useState('');
    const [feedback, setFeedback] = React.useState(undefined);
    const [feedbackArea, setFeedbackArea] = React.useState('overview');
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
    const populate = (value) => {
        const c = objectOf(value.configured), target = objectOf(c.target), frp = objectOf(c.frp), command = objectOf(c.customCommand), listeners = objectOf(c.listeners);
        setStatus(value);
        setForm((previous) => ({ ...previous, enabled: c.enabled === true, local: listeners.local === true, lan: listeners.lan === true, tailscale: listeners.tailscale === true, tunnelEnabled: c.tunnelEnabled === true, listenPort: String(c.listenPort ?? 4173), targetHost: text(target.host, '127.0.0.1'), targetPort: String(target.port ?? 3080), targetProtocol: text(target.protocol, 'http'), publicBaseUrl: text(c.publicBaseUrl), trustedProxyCidrs: Array.isArray(c.trustedProxyCidrs) ? c.trustedProxyCidrs.join('\n') : '', sessionTtlMinutes: String(c.sessionTtlMinutes ?? 1440), maxRequestBodyBytes: String(c.maxRequestBodyBytes ?? 52428800), adminPasswordSecretRef: text(c.adminPasswordSecretRef, 'DSH_REMOTE_ADMIN_HASH'), tunnelProvider: c.frp ? 'frp' : c.customCommandEnabled ? 'custom' : 'none', frpExecutablePath: text(frp.executablePath), frpServerAddress: text(frp.serverAddress), frpServerPort: String(frp.serverPort ?? 7000), frpAuthMethod: text(frp.authMethod, 'token'), frpTokenSecretRef: text(frp.tokenSecretRef, 'DSH_REMOTE_FRP_TOKEN'), frpStcpSecretRef: text(frp.stcpSecretRef, 'DSH_REMOTE_FRP_STCP_SECRET'), frpTransport: text(frp.transport, 'https'), frpCustomDomain: text(frp.customDomain), frpTlsEnabled: frp.tlsEnabled !== false, frpStartWithDsh: frp.startWithDsh === true, customCommand: text(command.command), customArgs: Array.isArray(command.args) ? command.args.join('\n') : '' }));
    };
    const invoke = React.useCallback(async (method) => { setFeedbackArea(method === 'discoverNetwork' ? 'lan' : method === 'detectTailscale' ? 'tailscale' : 'overview'); setBusy(method); setFeedback(undefined); try {
        const value = objectOf(await call(method));
        if (method === 'status')
            populate(value);
        else if (method === 'discoverNetwork') {
            const addresses = Array.isArray(value.lanIpv4) ? value.lanIpv4.join('、') : '';
            setFeedback({ tone: 'success', message: addresses ? `${t('lanFound')} ${addresses}:${String(value.gatewayPort ?? '')}` : t('lanNotFound') });
        }
        else if (method === 'detectTailscale') {
            const details = [value.magicDnsName, ...(value.ipv4 ?? []), ...(value.ipv6 ?? [])].filter(Boolean).join(' · ');
            setFeedback({ tone: value.connected ? 'success' : 'error', message: value.installed === false ? t('tailscaleNotInstalled') : value.connected === false ? t('tailscaleDisconnected') : `${t('tailscaleFound')} ${details}` });
        }
        else {
            setFeedback({ tone: 'success', message: t(method === 'revokeAllSessions' ? 'sessionsRevoked' : method === 'restartTunnel' ? 'tunnelRestarted' : 'tunnelStarted') });
        }
    }
    catch (error) {
        setFeedback({ tone: 'error', message: error instanceof Error ? error.message : String(error) });
    }
    finally {
        setBusy('');
    } }, [call, t]);
    React.useEffect(() => { void invoke('status'); }, [invoke]);
    const save = React.useCallback(async () => { setFeedbackArea('save'); const validationError = validateForm(form, !!status.administratorConfigured, t); if (validationError) {
        setFeedback({ tone: 'error', message: validationError });
        return;
    } setBusy('saveConfig'); setFeedback(undefined); try {
        const tunnelProvider = String(form.tunnelProvider);
        const frp = tunnelProvider === 'frp' ? { executablePath: form.frpExecutablePath, serverAddress: form.frpServerAddress, serverPort: Number(form.frpServerPort), authMethod: form.frpAuthMethod, tokenSecretRef: form.frpAuthMethod === 'token' ? form.frpTokenSecretRef : undefined, stcpSecretRef: form.frpTransport === 'stcp' ? form.frpStcpSecretRef : undefined, transport: form.frpTransport, customDomain: form.frpTransport === 'stcp' ? undefined : form.frpCustomDomain, tlsEnabled: form.frpTlsEnabled, startWithDsh: form.frpStartWithDsh } : undefined;
        const config = { enabled: form.enabled, listeners: { local: form.local === true, lan: form.lan === true, tailscale: form.tailscale === true }, tunnelEnabled: form.tunnelEnabled === true, listenPort: Number(form.listenPort), target: { host: form.targetHost, port: Number(form.targetPort), protocol: form.targetProtocol }, publicBaseUrl: form.publicBaseUrl || undefined, trustedProxyCidrs: String(form.trustedProxyCidrs).split(/\r?\n|,/).map((v) => v.trim()).filter(Boolean), sessionTtlMinutes: Number(form.sessionTtlMinutes), maxRequestBodyBytes: Number(form.maxRequestBodyBytes), adminPasswordSecretRef: form.adminPasswordSecretRef, frp, customCommandEnabled: tunnelProvider === 'custom', customCommand: tunnelProvider === 'custom' ? { command: form.customCommand, args: String(form.customArgs).split(/\r?\n/).filter(Boolean) } : undefined };
        await call('saveCommonConfig', { request: { config, secrets: { frpToken: form.frpToken, stcpSecret: form.frpStcpSecret } } });
        try {
            populate(objectOf(await call('status')));
        }
        catch {
            setStatus((previous) => ({ ...previous, configured: config, running: config.enabled }));
        }
        setFeedback({ tone: 'success', message: t('configurationSaved') });
        set('frpToken', '');
        set('frpStcpSecret', '');
    }
    catch (error) {
        setFeedback({ tone: 'error', message: error instanceof Error ? error.message : String(error) });
    }
    finally {
        setBusy('');
    } }, [call, form, t]);
    const changePassword = React.useCallback(async () => { if (newPassword.length < 10 || newPassword !== confirmPassword) {
        setFeedback({ tone: 'error', message: t(newPassword.length < 10 ? 'passwordTooShort' : 'passwordMismatch') });
        return;
    } setBusy('password'); try {
        await call('changePassword', { request: { currentPassword, newPassword } });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setFeedback({ tone: 'success', message: t(status.administratorConfigured ? 'passwordChanged' : 'passwordInitialized') });
        populate(objectOf(await call('status')));
    }
    catch (error) {
        setFeedback({ tone: 'error', message: error instanceof Error ? error.message : String(error) });
    }
    finally {
        setBusy('');
    } }, [call, confirmPassword, currentPassword, newPassword, status.administratorConfigured, t]);
    const input = (key, label, type = 'text', wide = false) => h('label', { className: wide ? 'wide' : '' }, t(label), h('input', { type, value: form[key], disabled: !!busy, onWheel: type === 'number' ? (e) => e.currentTarget.blur() : undefined, onChange: (e) => set(key, e.target.value) }));
    const select = (key, label, options) => h('label', null, t(label), h('select', { value: form[key], disabled: !!busy, onChange: (e) => set(key, e.target.value) }, ...options.map(([value, labelKey]) => h('option', { value, key: value }, t(labelKey)))));
    const check = (key, label) => h('label', { className: 'dsh-remote-check' }, h('input', { type: 'checkbox', checked: form[key] === true, disabled: !!busy, onChange: (e) => set(key, e.target.checked) }), t(label));
    const action = (method, label) => h('button', { className: 'dsh-remote-button', disabled: !!busy, onClick: () => invoke(method), key: method }, t(label));
    const areaFeedback = (area) => feedback && feedbackArea === area ? h('div', { className: 'dsh-remote-feedback wide', 'data-tone': feedback.tone, role: feedback.tone === 'error' ? 'alert' : 'status' }, feedback.message) : null;
    // Show what each mode actually bound, so an enabled-but-unbound mode is visible instead of silent.
    const liveAddresses = Array.isArray(status.addresses) ? status.addresses : [];
    const isTailscale = (address) => { const [first, second] = address.split('.').map(Number); return first === 100 && second >= 64 && second <= 127; };
    const addressesFor = (kind) => liveAddresses.filter((address) => kind === 'local' ? address === '127.0.0.1' : kind === 'tailscale' ? isTailscale(address) : address !== '127.0.0.1' && !isTailscale(address));
    const modeHint = (kind, on) => {
        const found = addressesFor(kind);
        if (!on)
            return h('p', { className: 'dsh-remote-hint' }, t('modeDisabled'));
        if (!status.running)
            return h('p', { className: 'dsh-remote-hint' }, t('notRunning'));
        if (!found.length)
            return h('p', { className: 'dsh-remote-hint', 'data-tone': 'warn' }, t(kind === 'tailscale' ? 'noTailscaleAddress' : 'noLanAddress'));
        return h('p', { className: 'dsh-remote-hint' }, `${t('boundTo')} ${found.map((address) => `${address}:${String(form.listenPort)}`).join('、')}`);
    };
    const configured = objectOf(status.configured), tunnel = objectOf(status.tunnel);
    return h('main', { className: 'dsh-remote-access' }, h('div', { className: 'dsh-remote-heading' }, h('p', { className: 'dsh-remote-intro' }, t('summary')), h('span', { className: 'dsh-remote-version', title: `@dsh-community/dsh-remote-access v${pluginVersion}` }, `v${pluginVersion}`)), h('section', { className: 'dsh-remote-note' }, h('p', null, t('safetyBody'))), h('section', { className: 'dsh-remote-card' }, h('h2', null, t('overviewTitle')), h('div', { className: 'dsh-remote-status-grid' }, ...[[t('gatewayRunning'), status.running ? t('yes') : t('no')], [t('administratorReady'), status.administratorConfigured ? t('yes') : t('no')], [t('listenAddress'), status.bound?.length ? status.bound.join(' · ') : t('notRunning')], [t('tunnelState'), status.tunnel ? (tunnel.state ?? tunnel.id) : t('notConfigured')]].map(([label, value]) => h('div', { className: 'dsh-remote-row', key: label }, h('span', null, label), h('span', { className: 'dsh-remote-value' }, value)))), h('div', { className: 'dsh-remote-actions' }, ...['status'].map((method) => h('button', { className: 'dsh-remote-button', disabled: !!busy, onClick: () => invoke(method), key: method }, t('refreshStatus')))), feedback && feedbackArea === 'overview' ? h('div', { className: 'dsh-remote-feedback wide', 'data-tone': feedback.tone, role: feedback.tone === 'error' ? 'alert' : 'status' }, feedback.message) : null), h('section', { className: 'dsh-remote-card' }, h('h2', null, t('configurationTitle')), h('p', null, t('configurationBody')), h('div', { className: 'dsh-remote-fields' }, check('enabled', 'enableGateway'), h('div', { className: 'dsh-remote-subtitle wide' }, t('accessMode')), h('div', { className: 'dsh-remote-mode wide' }, check('local', 'modeLocal'), modeHint('local', form.local === true)), h('div', { className: 'dsh-remote-mode wide' }, check('lan', 'modeLan'), action('discoverNetwork', 'discoverNetwork'), modeHint('lan', form.lan === true)), areaFeedback('lan'), h('div', { className: 'dsh-remote-mode wide' }, check('tailscale', 'modeTailscale'), action('detectTailscale', 'detectTailscale'), modeHint('tailscale', form.tailscale === true)), areaFeedback('tailscale'), input('listenPort', 'gatewayPort', 'number'), input('targetHost', 'targetHost'), input('targetPort', 'targetPort', 'number'), select('targetProtocol', 'targetProtocol', [['http', 'protocolHttp'], ['https', 'protocolHttps']]), input('sessionTtlMinutes', 'sessionTtlMinutes', 'number'), input('maxRequestBodyBytes', 'maxRequestBodyBytes', 'number'), input('adminPasswordSecretRef', 'adminPasswordSecretRef'), h('label', { className: 'wide' }, t('trustedProxyCidrs'), h('textarea', { value: form.trustedProxyCidrs, disabled: !!busy, onChange: (e) => set('trustedProxyCidrs', e.target.value) })), h('div', { className: 'dsh-remote-subtitle wide' }, t('tunnelConfiguration')), h('div', { className: 'dsh-remote-mode wide' }, check('tunnelEnabled', 'modeTunnel')), form.tunnelEnabled ? input('publicBaseUrl', 'publicBaseUrl', 'url') : null, form.tunnelEnabled ? select('tunnelProvider', 'tunnelProvider', [['none', 'providerNone'], ['frp', 'providerFrp'], ['custom', 'providerCustom']]) : null, form.tunnelEnabled && form.tunnelProvider === 'frp' ? [input('frpExecutablePath', 'frpExecutablePath'), input('frpServerAddress', 'frpServerAddress'), input('frpServerPort', 'frpServerPort', 'number'), select('frpAuthMethod', 'frpAuthMethod', [['token', 'authToken'], ['oidc', 'authOidc'], ['none', 'authNone']]), select('frpTransport', 'frpTransport', [['https', 'protocolHttps'], ['http', 'protocolHttp'], ['stcp', 'transportStcp']]), input('frpCustomDomain', 'frpCustomDomain'), check('frpTlsEnabled', 'frpTlsEnabled'), check('frpStartWithDsh', 'frpStartWithDsh'), form.frpAuthMethod === 'token' ? input('frpTokenSecretRef', 'frpTokenSecretRef') : null, form.frpAuthMethod === 'token' ? input('frpToken', 'frpToken', 'password') : null, form.frpTransport === 'stcp' ? input('frpStcpSecretRef', 'frpStcpSecretRef') : null, form.frpTransport === 'stcp' ? input('frpStcpSecret', 'frpStcpSecret', 'password') : null] : null, form.tunnelProvider === 'custom' ? [input('customCommand', 'customCommand', 'text', true), h('label', { className: 'wide' }, t('customArgs'), h('textarea', { value: form.customArgs, disabled: !!busy, onChange: (e) => set('customArgs', e.target.value) }))] : null), h('div', { className: 'dsh-remote-actions' }, h('button', { className: 'dsh-remote-button dsh-remote-button-primary', disabled: !!busy || !status.administratorConfigured, onClick: save }, busy === 'saveConfig' ? t('working') : t('saveAndApply'))), feedback && feedbackArea === 'save' ? h('div', { className: 'dsh-remote-feedback wide', 'data-tone': feedback.tone, role: feedback.tone === 'error' ? 'alert' : 'status' }, feedback.message) : null), h('section', { className: 'dsh-remote-card' }, h('h2', null, t(status.administratorConfigured ? 'changePasswordTitle' : 'initializePasswordTitle')), h('p', null, t(status.administratorConfigured ? 'changePasswordBody' : 'initializePasswordBody')), h('div', { className: 'dsh-remote-fields' }, status.administratorConfigured ? h('label', null, t('currentPassword'), h('input', { type: 'password', value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value) })) : null, h('label', null, t('newPassword'), h('input', { type: 'password', value: newPassword, onChange: (e) => setNewPassword(e.target.value) })), h('label', null, t('confirmPassword'), h('input', { type: 'password', value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) }))), h('div', { className: 'dsh-remote-actions' }, h('button', { className: 'dsh-remote-button dsh-remote-button-primary', disabled: !!busy, onClick: changePassword }, t(status.administratorConfigured ? 'changePassword' : 'initializePassword')))), h('section', { className: 'dsh-remote-card' }, h('h2', null, t('tunnelTitle')), h('p', null, t('tunnelBody')), h('div', { className: 'dsh-remote-actions' }, h('button', { className: 'dsh-remote-button dsh-remote-button-primary', disabled: !!busy, onClick: () => invoke('startTunnel') }, t('startTunnel')), h('button', { className: 'dsh-remote-button', disabled: !!busy, onClick: () => invoke('restartTunnel') }, t('restartTunnel')), h('button', { className: 'dsh-remote-button', disabled: !!busy || !status.running, onClick: () => invoke('revokeAllSessions') }, t('revokeSessions')))));
}
async function callRemoteHost(ctx, method, args = {}) { const result = await ctx.connection.rpc.call('/api', `${remoteNamespace}/${method}`, { args }); if (result.ok)
    return result.value; throw new Error(result.error?.message ?? `Remote call ${method} failed.`); }
function insertStyles() { if (typeof document === 'undefined' || !document.head)
    return; const existing = document.head.querySelector('style[data-dsh-remote-access-styles]'); if (existing)
    return; const style = document.createElement('style'); style.dataset.dshRemoteAccessStyles = ''; style.textContent = css; document.head.append(style); return () => style.remove(); }
export function createClientModule(React) { return { inject: ['slots', 'locale', 'connection'], apply(ctx) { ctx.effect(() => insertStyles()); ctx.effect(() => ctx.locale.register(localeNamespace, dictionaries)); const t = ctx.locale.bind(localeNamespace); const call = (method, args) => callRemoteHost(ctx, method, args ?? {}); ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: sectionId, order: 80, label: () => t('title'), inject: () => ({ t, call, React }) }, SettingsSection))); } }; }
export const clientModule = { packageId, sectionId, css };
//# sourceMappingURL=client-module.js.map