declare global {
    interface Window {
        __ModuleLoader__?: {
            load(module: {
                id: string;
                factory(require: (id: string) => unknown): unknown;
            }): void;
        };
    }
}
export {};
//# sourceMappingURL=client-entry.d.ts.map