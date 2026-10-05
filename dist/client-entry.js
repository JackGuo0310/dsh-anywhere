import { createClientModule } from './client-module.js';
window.__ModuleLoader__?.load({
    id: '@dsh-community/dsh-remote-access',
    factory(require) {
        return createClientModule(require('react'));
    },
});
//# sourceMappingURL=client-entry.js.map