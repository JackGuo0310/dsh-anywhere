import { dictionaries, localeNamespace } from './locale.generated.js'

const packageId = '@dsh-community/dsh-remote-access'
const sectionId = 'dsh-remote-access'

type HostCall = (method: string, args?: unknown) => Promise<unknown>
type Translator = (key: string) => string
type RemoteCallResult = { ok: boolean, value?: unknown, error?: { message?: string } }
type Feedback = { tone: 'success' | 'error', message: string } | undefined

type ClientContext = {
  effect: (effect: () => void | (() => void)) => void
  slots: {
    inject: (slot: string, factory: () => (() => void) | void) => (() => void) | void
    register: (options: { name: string, id: string, order?: number, label?: () => string, inject?: () => unknown }, component: unknown) => (() => void) | void
  }
  locale: {
    register: (namespace: string, locale: string, dict: Record<string, string>) => (() => void) | void
    bind: (namespace: string) => Translator
  }
  connection: { rpc: { call: (channel: string, endpoint: string, payload: { args: unknown }, signal?: AbortSignal) => Promise<RemoteCallResult> } }
}

const remoteNamespace = 'dshRemoteAccess'

type ReactLike = {
  createElement: (type: string | ((props: any) => unknown), props?: Record<string, unknown> | null, ...children: unknown[]) => unknown
  useCallback: <T>(callback: T, dependencies: unknown[]) => T
  useEffect: (effect: () => void | (() => void), dependencies: unknown[]) => void
  useState: <T>(initial: T) => [T, (value: T | ((previous: T) => T)) => void]
}

const css = `
.dsh-remote-access{max-width:760px;padding:4px 0 24px;color:var(--dsw-alias-label-primary)}
.dsh-remote-intro{margin:0 0 18px;color:var(--dsw-alias-label-secondary);line-height:1.55}
.dsh-remote-card{margin-top:16px;padding:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.dsh-remote-card h2{margin:0 0 14px;font-size:15px;font-weight:650}.dsh-remote-card p{margin:0;color:var(--dsw-alias-label-secondary);line-height:1.5}
.dsh-remote-note{padding:14px 16px;border-radius:9px;background:var(--dsw-alias-bg-layer-2)}
.dsh-remote-status-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 28px}
.dsh-remote-row{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:48px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-remote-row:nth-last-child(-n+2){border-bottom:0}.dsh-remote-label{font-size:14px}.dsh-remote-value{color:var(--dsw-alias-label-secondary);font-size:14px;text-align:right;overflow-wrap:anywhere}
.dsh-remote-value[data-state=success]{color:var(--dsw-alias-state-success-primary)}.dsh-remote-value[data-state=idle]{color:var(--dsw-alias-state-idle-primary)}
.dsh-remote-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.dsh-remote-button{min-height:44px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;cursor:pointer}
.dsh-remote-button:hover{background:var(--dsw-alias-bg-layer-2)}.dsh-remote-button:focus-visible,.dsh-remote-fields input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.dsh-remote-button-primary{border-color:transparent;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base)}.dsh-remote-button-primary:hover{opacity:.88}.dsh-remote-button:disabled{opacity:.5;cursor:wait}
.dsh-remote-feedback{margin-top:12px;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-size:14px}.dsh-remote-feedback[data-tone=success]{color:var(--dsw-alias-state-success-primary)}.dsh-remote-feedback[data-tone=error]{color:var(--dsw-alias-state-error-primary)}
.dsh-remote-fields{display:grid;gap:14px;margin-top:16px}.dsh-remote-fields label{display:grid;gap:7px;font-size:14px}.dsh-remote-fields input{min-height:44px;padding:0 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;outline:none}.dsh-remote-fields input:focus{border-color:var(--dsw-alias-brand-primary)}
@media(max-width:640px){.dsh-remote-status-grid{grid-template-columns:1fr}.dsh-remote-row:nth-last-child(2){border-bottom:1px solid var(--dsw-alias-border-l1)}}
`

function objectOf(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function textOf(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function yesNo(value: unknown, t: Translator): string {
  return value ? t('yes') : t('no')
}

function SettingsSection(props: { t: Translator, call: HostCall, React: ReactLike }) {
  const { t, call, React } = props
  const h = React.createElement
  const [gatewayStatus, setGatewayStatus] = React.useState<Record<string, unknown> | undefined>(undefined)
  const [feedback, setFeedback] = React.useState<Feedback>(undefined)
  const [busy, setBusy] = React.useState<string | undefined>(undefined)
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')

  const invoke = React.useCallback(async (method: string) => {
    setBusy(method)
    setFeedback(undefined)
    try {
      const result = await call(method)
      const value = objectOf(result)
      if (method === 'status') setGatewayStatus(value)
      if (method === 'discoverNetwork') {
        const addresses = Array.isArray(value.lanIpv4) ? value.lanIpv4.join('、') : ''
        setFeedback({ tone: 'success', message: addresses ? `${t('lanFound')} ${addresses}:${String(value.gatewayPort ?? '')}` : t('lanNotFound') })
      } else if (method === 'detectTailscale') {
        const ipv4 = Array.isArray(value.ipv4) ? value.ipv4.join('、') : ''
        const ipv6 = Array.isArray(value.ipv6) ? value.ipv6.join('、') : ''
        const dns = textOf(value.magicDnsName, '')
        const details = [dns, ipv4, ipv6].filter(Boolean).join(' · ')
        const message = value.installed === false ? t('tailscaleNotInstalled') : value.connected === false ? t('tailscaleDisconnected') : details ? `${t('tailscaleFound')} ${details}` : t('tailscaleNotFound')
        setFeedback({ tone: value.connected ? 'success' : 'error', message })
      } else if (method === 'startTunnel') setFeedback({ tone: 'success', message: t('tunnelStarted') })
      else if (method === 'restartTunnel') setFeedback({ tone: 'success', message: t('tunnelRestarted') })
      else if (method === 'revokeAllSessions') setFeedback({ tone: 'success', message: t('sessionsRevoked') })
      if (['startTunnel', 'restartTunnel', 'revokeAllSessions'].includes(method)) setGatewayStatus(objectOf(await call('status')))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const missingTunnel = (method === 'startTunnel' || method === 'restartTunnel') && message === 'No tunnel provider is configured.'
      setFeedback({ tone: 'error', message: missingTunnel ? t('tunnelNeedsConfiguration') : message })
    } finally {
      setBusy(undefined)
    }
  }, [call, t])

  React.useEffect(() => { void invoke('status') }, [invoke])

  const changePassword = React.useCallback(async () => {
    if (newPassword.length < 12) { setFeedback({ tone: 'error', message: t('passwordTooShort') }); return }
    if (newPassword !== confirmPassword) { setFeedback({ tone: 'error', message: t('passwordMismatch') }); return }
    setBusy('changePassword')
    setFeedback(undefined)
    try {
      await call('changePassword', { request: { currentPassword, newPassword } })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setFeedback({ tone: 'success', message: t('passwordChanged') })
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : String(error) })
    } finally {
      setBusy(undefined)
    }
  }, [call, confirmPassword, currentPassword, newPassword, t])

  const configured = objectOf(gatewayStatus?.configured)
  const tunnel = objectOf(gatewayStatus?.tunnel)
  const statusRows = [
    [t('gatewayRunning'), yesNo(gatewayStatus?.running, t), gatewayStatus?.running ? 'success' : 'idle'],
    [t('administratorReady'), yesNo(gatewayStatus?.administratorConfigured, t), gatewayStatus?.administratorConfigured ? 'success' : 'idle'],
    [t('listenAddress'), `${textOf(configured.listenHost, '—')}:${String(configured.listenPort ?? '—')}`, ''],
    [t('tunnelState'), gatewayStatus?.tunnel ? textOf(tunnel.state, textOf(tunnel.id, t('configured'))) : t('notConfigured'), gatewayStatus?.tunnel ? 'success' : 'idle'],
  ]

  return h('main', { className: 'dsh-remote-access' },
    h('p', { className: 'dsh-remote-intro' }, t('summary')),
    h('section', { className: 'dsh-remote-note' }, h('p', null, t('safetyBody'))),
    h('section', { className: 'dsh-remote-card' },
      h('h2', null, t('overviewTitle')),
      h('div', { className: 'dsh-remote-status-grid' }, ...statusRows.map(([label, value, state]) => h('div', { className: 'dsh-remote-row', key: label }, h('span', { className: 'dsh-remote-label' }, label), h('span', { className: 'dsh-remote-value', 'data-state': state }, value)))),
      h('div', { className: 'dsh-remote-actions' },
        h('button', { className: 'dsh-remote-button', type: 'button', disabled: !!busy, onClick: () => invoke('status') }, busy === 'status' ? t('working') : t('refreshStatus')),
        h('button', { className: 'dsh-remote-button', type: 'button', disabled: !!busy, onClick: () => invoke('discoverNetwork') }, t('discoverNetwork')),
        h('button', { className: 'dsh-remote-button', type: 'button', disabled: !!busy, onClick: () => invoke('detectTailscale') }, t('detectTailscale')),
      ),
    ),
    h('section', { className: 'dsh-remote-card' },
      h('h2', null, t('tunnelTitle')), h('p', null, t('tunnelBody')),
      h('div', { className: 'dsh-remote-actions' },
        h('button', { className: 'dsh-remote-button dsh-remote-button-primary', type: 'button', disabled: !!busy, onClick: () => invoke('startTunnel') }, t('startTunnel')),
        h('button', { className: 'dsh-remote-button', type: 'button', disabled: !!busy, onClick: () => invoke('restartTunnel') }, t('restartTunnel')),
        h('button', { className: 'dsh-remote-button', type: 'button', disabled: !!busy || !gatewayStatus?.running, onClick: () => invoke('revokeAllSessions') }, t('revokeSessions')),
      ),
      feedback ? h('div', { className: 'dsh-remote-feedback', 'data-tone': feedback.tone, role: feedback.tone === 'error' ? 'alert' : 'status' }, feedback.message) : null,
    ),
    h('section', { className: 'dsh-remote-card' },
      h('h2', null, t('changePasswordTitle')), h('p', null, t('changePasswordBody')),
      h('div', { className: 'dsh-remote-fields' },
        h('label', null, t('currentPassword'), h('input', { type: 'password', autoComplete: 'current-password', value: currentPassword, disabled: !!busy, onChange: (event: { target: { value: string } }) => setCurrentPassword(event.target.value) })),
        h('label', null, t('newPassword'), h('input', { type: 'password', autoComplete: 'new-password', value: newPassword, disabled: !!busy, onChange: (event: { target: { value: string } }) => setNewPassword(event.target.value) })),
        h('label', null, t('confirmPassword'), h('input', { type: 'password', autoComplete: 'new-password', value: confirmPassword, disabled: !!busy, onChange: (event: { target: { value: string } }) => setConfirmPassword(event.target.value) })),
      ),
      h('div', { className: 'dsh-remote-actions' }, h('button', { className: 'dsh-remote-button dsh-remote-button-primary', type: 'button', disabled: !!busy || !currentPassword || !newPassword || !confirmPassword, onClick: changePassword }, t('changePassword'))),
    ),
    h('section', { className: 'dsh-remote-card' }, h('h2', null, t('configurationTitle')), h('p', null, t('configurationBody'))),
  )
}

async function callRemoteHost(ctx: ClientContext, method: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const result = await ctx.connection.rpc.call('/api', `${remoteNamespace}/${method}`, { args })
  if (result.ok) return result.value
  throw new Error(result.error?.message ?? `Remote call ${method} failed.`)
}

function insertStyles(): (() => void) | void {
  if (typeof document === 'undefined' || document.head === null) return
  const selector = 'style[data-dsh-remote-access-styles]'
  const existing = document.head.querySelector(selector)
  if (existing) return
  const style = document.createElement('style')
  style.dataset.dshRemoteAccessStyles = ''
  style.textContent = css
  document.head.append(style)
  return () => style.remove()
}

export function createClientModule(React: ReactLike) {
  return {
    inject: ['slots', 'locale', 'connection'],
    apply(ctx: ClientContext): void {
      ctx.effect(() => insertStyles())
      for (const [locale, dict] of Object.entries(dictionaries)) ctx.effect(() => ctx.locale.register(localeNamespace, locale, dict))
      const t = ctx.locale.bind(localeNamespace)
      const call: HostCall = (method, args) => callRemoteHost(ctx, method, (args as Record<string, unknown> | undefined) ?? {})
      ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section', id: sectionId, order: 80, label: () => t('title'), inject: () => ({ t, call, React }),
      }, SettingsSection)))
    },
  }
}

export const clientModule = { packageId, sectionId, css }
