const packageId = '@dsh-community/dsh-remote-access'
const sectionId = 'dsh-remote-access'

type HostCall = (method: string, args?: unknown) => Promise<unknown>
type Translator = (key: string) => string

type ClientContext = {
  slots: {
    inject: (slot: string, factory: () => (() => void) | void) => (() => void) | void
    register: (options: { name: string, id: string, order?: number, label?: () => string, inject?: () => unknown }, component: unknown) => (() => void) | void
  }
  locale: { bind: (namespace: string) => Translator }
  host: { call: HostCall }
  styles?: { insert: (css: string) => (() => void) | void }
  effect?: (callback: () => void | (() => void)) => void
}

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
.dsh-remote-status{margin-top:12px;padding:10px;border-radius:8px;background:var(--dsh-color-surface-raised,#223129);white-space:pre-wrap}.dsh-remote-warning{border-left:4px solid #e0a547}.dsh-remote-error{border-left:4px solid #db5b58}
`

function SettingsSection(props: { t: Translator, call: HostCall, React: ReactLike }) {
  const { t, call, React } = props
  const h = React.createElement
  const [status, setStatus] = React.useState('')
  const [busy, setBusy] = React.useState(false)

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
      h('h2', null, t('configurationTitle')),
      h('p', null, t('configurationBody')),
    ),
  )
}

export function createClientModule(React: ReactLike) {
  return {
    inject: ['slots', 'locale'],
    apply(ctx: ClientContext): void {
      const disposeStyles = ctx.styles?.insert(css)
      if (disposeStyles && ctx.effect) ctx.effect(() => disposeStyles)
      const t = ctx.locale.bind('dsh-remote-access')
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: sectionId,
        order: 80,
        label: () => t('title'),
        inject: () => ({ t, call: (method: string, args?: unknown) => ctx.host.call(`dshRemoteAccess.${method}`, args), React }),
      }, SettingsSection))
    },
  }
}

export const clientModule = { packageId, sectionId, css }
