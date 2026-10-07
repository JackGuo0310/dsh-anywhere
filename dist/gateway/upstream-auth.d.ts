import type { RemoteAccessConfig } from '../config.js';
/** Exchange Connection's process launch token only over the private upstream link. */
export declare function upstreamCookie(target: RemoteAccessConfig['target'], authenticatedUrl: () => string): Promise<string>;
//# sourceMappingURL=upstream-auth.d.ts.map