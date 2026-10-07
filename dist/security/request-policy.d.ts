import type { IncomingMessage } from 'node:http';
export declare function parseCookies(header: string | undefined): Record<string, string>;
export declare function canonicalAuthority(value: string): string | undefined;
export declare function isTrustedProxy(remoteAddress: string | undefined, trusted: readonly string[]): boolean;
export declare function effectiveAuthority(req: IncomingMessage, trustedProxies: readonly string[]): string | undefined;
export declare function websocketOriginAllowed(req: IncomingMessage, allowedAuthorities: readonly string[], trustedProxies: readonly string[]): boolean;
export declare function originAllowed(req: IncomingMessage, allowedAuthorities: readonly string[], trustedProxies: readonly string[]): boolean;
export declare function hostAllowed(req: IncomingMessage, allowedAuthorities: readonly string[], trustedProxies: readonly string[]): boolean;
export declare function remoteClientIp(req: IncomingMessage, trustedProxies: readonly string[]): string;
export declare function isPrivateOrLoopbackIp(value: string): boolean;
//# sourceMappingURL=request-policy.d.ts.map