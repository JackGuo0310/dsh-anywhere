import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { WebSocketServer, WebSocket } from 'ws';
const hopByHop = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);
export function proxyHttp(req, res, target) {
    const transport = target.protocol === 'https' ? httpsRequest : httpRequest;
    const headers = { ...req.headers };
    for (const header of hopByHop)
        delete headers[header];
    headers.host = `${target.host}:${target.port}`;
    const upstream = transport({ hostname: target.host, port: target.port, protocol: `${target.protocol}:`, method: req.method, path: req.url, headers }, (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.statusMessage, upstreamRes.headers);
        upstreamRes.pipe(res);
    });
    upstream.setTimeout(0);
    upstream.on('error', () => {
        if (!res.headersSent)
            res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'DSH upstream is unavailable.' }));
    });
    req.on('aborted', () => upstream.destroy());
    req.pipe(upstream);
}
export function bridgeWebSocket(socket, head, req, target) {
    const upstreamUrl = `${target.protocol === 'https' ? 'wss' : 'ws'}://${target.host}:${target.port}${req.url ?? '/'}`;
    const protocols = typeof req.headers['sec-websocket-protocol'] === 'string' ? req.headers['sec-websocket-protocol'].split(',').map((item) => item.trim()) : undefined;
    const server = new WebSocketServer({ noServer: true });
    server.handleUpgrade(req, socket, head, (client) => {
        const upstream = new WebSocket(upstreamUrl, protocols, { headers: { host: `${target.host}:${target.port}` } });
        const pending = [];
        client.on('message', (data, isBinary) => {
            const message = { data, binary: isBinary };
            if (upstream.readyState === WebSocket.OPEN)
                upstream.send(message.data, { binary: message.binary });
            else if (upstream.readyState === WebSocket.CONNECTING)
                pending.push(message);
        });
        upstream.on('open', () => {
            for (const message of pending)
                upstream.send(message.data, { binary: message.binary });
            pending.length = 0;
        });
        client.on('close', () => upstream.close());
        client.on('error', () => upstream.close());
        upstream.on('message', (data, isBinary) => { if (client.readyState === WebSocket.OPEN)
            client.send(data, { binary: isBinary }); });
        upstream.on('close', () => client.close());
        upstream.on('error', () => client.close(1011, 'Upstream unavailable'));
    });
}
//# sourceMappingURL=proxy.js.map