const packageId = '@dsh-community/dsh-remote-access'
const sectionId = 'dsh-remote-access'

type HostCall = (method: string, args?: unknown) => Promise<unknown>
type Translator = (key: string) => string

type RemoteCallResult = { ok: boolean, value?: unknown, error?: { message?: string } }

type ClientContext = {
  slots: {
    inject: (slot: string, factory: () => (() => void) | void) => (() => void) | void
    register: (options: { name: string, id: string, order?: number, label?: () => string, inject?: () => unknown }, component: unknown) => (() => void) | void
  }
  locale: { bind: (namespace: string) => Translator }
  connection: { rpc: { call: (channel: string, endpoint: string, payload: { args: unknown }, signal?: AbortSignal) => Promise<RemoteCallResult> } }
  effect?: (callback: () => void | (() => void), label?: string) => void
}

/**
 * Host Remote namespace this plugin exposes. The Client reaches it through the
 * Connection RPC channel, whose endpoint is `<namespace>/<method>`.
 */
const remoteNamespace = 'dshRemoteAccess'

type ReactLike = {
  createElement: (type: string | ((props: any) => unknown), props?: Record<string, unknown> | null, ...children: unknown[]) => unknown
  useCallback: <T>(callback: T, dependencies: unknown[]) => T
  useEffect: (effect: () => void | (() => void), dependencies: unknown[]) => void
  useState: <T>(initial: T) => [T, (value: T | ((previous: T) => T)) => void]
}

const css = `
.dsh-remote-access{max-width:840px;padding:24px;color:var(--dsh-color-text,#e9f0ec)}
.dsh-remote-access h1{margin:0 0 6px;font-size:28px}.dsh-remote-access h2{margin:0;font-size:18px}
.dsh-remote-access p{color:var(--dsh-color-text-muted,#a9bbb1)}.dsh-remote-card{margin-top:16px;padding:18px;border:1px solid var(--dsh-color-border,#3d5046);border-radius:12px;background:var(--dsh-color-surface,#18221d)}
.dsh-remote-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.dsh-remote-access button{min-height:38px;padding:0 12px;border:0;border-radius:8px;background:var(--dsh-color-primary,#2c8462);color:#fff;font:inherit;font-weight:650;cursor:pointer}.dsh-remote-access button:disabled{opacity:.55;cursor:wait}
.dsh-remote-status{margin-top:12px;padding:10px;border-radius:8px;background:var(--dsh-color-surface-raised,#223129);white-space:pre-wrap}.dsh-remote-password-fields{display:grid;gap:10px}.dsh-remote-password-fields label{display:grid;gap:5px;font-weight:600}.dsh-remote-password-fields input{padding:9px;border:1px solid var(--dsh-color-border,#3d5046);border-radius:8px;background:var(--dsh-color-surface-raised,#223129);color:inherit;font:inherit}.dsh-remote-warning{border-left:4px solid #e0a547}.dsh-remote-error{border-left:4px solid #db5b58}
`

function SettingsSection(props: { t: Translator, call: HostCall, React: ReactLike }) {
  const { t, call, React } = props
  const h = React.createElement
  const [status, setStatus] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')

  const invoke = React.useCallback(async (method: string) => {
    setBusy(true)
    setStatus('')
    try {
      const result = await call(method)
      setStatus(JSON.stringify(result, null, 2))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }, [call])

  const changePassword = React.useCallback(async () => {
    if (newPassword !== confirmPassword) { setStatus(t('passwordMismatch')); return }
    setBusy(true)
    setStatus('')
    try {
      await call('changePassword', { request: { currentPassword, newPassword } })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setStatus(t('passwordChanged'))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }, [call, confirmPassword, currentPassword, newPassword, t])

  return h('main', { className: 'dsh-remote-access' },
    h('h1', null, t('title')),
    h('p', null, t('summary')),
    h('section', { className: 'dsh-remote-card dsh-remote-warning' },
      h('h2', null, t('safetyTitle')),
      h('p', null, t('safetyBody')),
    ),
    h('section', { className: 'dsh-remote-card' },
      h('h2', null, t('operationsTitle')),
      h('p', null, t('operationsBody')),
      h('div', { className: 'dsh-remote-actions' },
        h('button', { type: 'button', disabled: busy, onClick: () => invoke('status') }, t('status')),
        h('button', { type: 'button', disabled: busy, onClick: () => invoke('discoverNetwork') }, t('discoverNetwork')),
        h('button', { type: 'button', disabled: busy, onClick: () => invoke('detectTailscale') }, t('detectTailscale')),
        h('button', { type: 'button', disabled: busy, onClick: () => invoke('startTunnel') }, t('startTunnel')),
        h('button', { type: 'button', disabled: busy, onClick: () => invoke('restartTunnel') }, t('restartTunnel')),
        h('button', { type: 'button', disabled: busy, onClick: () => invoke('revokeAllSessions') }, t('revokeSessions')),
      ),
      status ? h('pre', { className: 'dsh-remote-status', role: 'status' }, status) : null,
    ),
    h('section', { className: 'dsh-remote-card' },
      h('h2', null, t('changePasswordTitle')),
      h('p', null, t('changePasswordBody')),
      h('div', { className: 'dsh-remote-password-fields' },
        h('label', null, t('currentPassword'), h('input', { type: 'password', autoComplete: 'current-password', value: currentPassword, disabled: busy, onChange: (event: { target: { value: string } }) => setCurrentPassword(event.target.value) })),
        h('label', null, t('newPassword'), h('input', { type: 'password', autoComplete: 'new-password', value: newPassword, disabled: busy, onChange: (event: { target: { value: string } }) => setNewPassword(event.target.value) })),
        h('label', null, t('confirmPassword'), h('input', { type: 'password', autoComplete: 'new-password', value: confirmPassword, disabled: busy, onChange: (event: { target: { value: string } }) => setConfirmPassword(event.target.value) })),
      ),
      h('div', { className: 'dsh-remote-actions' },
        h('button', { type: 'button', disabled: busy || !currentPassword || !newPassword || !confirmPassword, onClick: changePassword }, t('changePassword')),
      ),
    ),
    h('section', { className: 'dsh-remote-card' },
      h('h2', null, t('configurationTitle')),
      h('p', null, t('configurationBody')),
    ),
  )
}

/**
 * Host Remote calls go through the Connection RPC channel: the endpoint is
 * `<namespace>/<method>`, arguments travel name-keyed, and a rejected call
 * arrives as `{ ok: false }` rather than as a thrown error.
 */
async function callRemoteHost(ctx: ClientContext, method: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const result = await ctx.connection.rpc.call('/api', `${remoteNamespace}/${method}`, { args })
  if (result.ok) return result.value
  throw new Error(result.error?.message ?? `Remote call ${method} failed.`)
}

/** Claim one <style> tag for this module; the module system owns its disposal. */
function insertStyles(): void {
  if (typeof document === 'undefined' || document.head === null) return
  const style = document.createElement('style')
  style.dataset.dshRemoteAccessStyles = ''
  style.textContent = css
  document.head.append(style)
}

export function createClientModule(React: ReactLike) {
  return {
    inject: ['slots', 'locale', 'connection'],
    apply(ctx: ClientContext): void {
      insertStyles()
      const t = ctx.locale.bind('dsh-remote-access')
      const call: HostCall = (method, args) => callRemoteHost(ctx, method, (args as Record<string, unknown> | undefined) ?? {})
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: sectionId,
        order: 80,
        label: () => t('title'),
        inject: () => ({ t, call, React }),
      }, SettingsSection))
    },
  }
}

export const clientModule = { packageId, sectionId, css }
