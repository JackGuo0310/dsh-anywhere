import { createClientModule } from './client.js'

declare global {
  interface Window {
    __ModuleLoader__?: {
      load(module: { id: string; factory(require: (id: string) => unknown): unknown }): void
    }
  }
}

window.__ModuleLoader__?.load({
  id: '@dsh-community/dsh-remote-access',
  factory(require) {
    return createClientModule(require('react') as Parameters<typeof createClientModule>[0])
  },
})
