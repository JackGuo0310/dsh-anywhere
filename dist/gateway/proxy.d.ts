import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import type { RemoteAccessConfig } from '../config.js';
export declare function proxyHttp(req: IncomingMessage, res: ServerResponse, target: RemoteAccessConfig['target'], maxRequestBodyBytes: number): void;
export declare function bridgeWebSocket(socket: Duplex, head: Buffer, req: IncomingMessage, target: RemoteAccessConfig['target']): void;
//# sourceMappingURL=proxy.d.ts.map