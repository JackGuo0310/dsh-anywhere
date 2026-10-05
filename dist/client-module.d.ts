type Translator = (key: string) => string;
type RemoteCallResult = {
    ok: boolean;
    value?: unknown;
    error?: {
        message?: string;
    };
};
type ClientContext = {
    slots: {
        inject: (slot: string, factory: () => (() => void) | void) => (() => void) | void;
        register: (options: {
            name: string;
            id: string;
            order?: number;
            label?: () => string;
            inject?: () => unknown;
        }, component: unknown) => (() => void) | void;
    };
    locale: {
        bind: (namespace: string) => Translator;
    };
    connection: {
        rpc: {
            call: (channel: string, endpoint: string, payload: {
                args: unknown;
            }, signal?: AbortSignal) => Promise<RemoteCallResult>;
        };
    };
    effect?: (callback: () => void | (() => void), label?: string) => void;
};
type ReactLike = {
    createElement: (type: string | ((props: any) => unknown), props?: Record<string, unknown> | null, ...children: unknown[]) => unknown;
    useCallback: <T>(callback: T, dependencies: unknown[]) => T;
    useEffect: (effect: () => void | (() => void), dependencies: unknown[]) => void;
    useState: <T>(initial: T) => [T, (value: T | ((previous: T) => T)) => void];
};
export declare function createClientModule(React: ReactLike): {
    inject: string[];
    apply(ctx: ClientContext): void;
};
export declare const clientModule: {
    packageId: string;
    sectionId: string;
    css: string;
};
export {};
//# sourceMappingURL=client-module.d.ts.map