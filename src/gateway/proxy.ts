import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Duplex } from 'node:stream'
import { WebSocketServer, WebSocket } from 'ws'
import type { RemoteAccessConfig } from '../config.js'

const hopByHop = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade'])

export function proxyHttp(req: IncomingMessage, res: ServerResponse, target: RemoteAccessConfig['target']): void {
  const transport = target.protocol === 'https' ? httpsRequest : httpRequest
  const headers = { ...req.headers }
  const connectionTokens = typeof req.headers.connection === 'string' ? req.headers.connection.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean) : []
  for (const header of [...hopByHop, ...connectionTokens]) delete headers[header]
  delete headers.cookie
  delete headers.origin
  delete headers['x-csrf-token']
  delete headers['x-forwarded-for']
  delete headers['x-forwarded-host']
  delete headers['x-forwarded-proto']
  delete headers.forwarded
  headers.host = `${target.host}:${target.port}`
  const upstream = transport({ hostname: target.host, port: target.port, protocol: `${target.protocol}:`, method: req.method, path: req.url, headers }, (upstreamRes) => {
    const responseHeaders = { ...upstreamRes.headers }
    delete responseHeaders['set-cookie']
    res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.statusMessage, responseHeaders)
    upstreamRes.pipe(res)
  })
  upstream.setTimeout(0)
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: 'DSH upstream is unavailable.' }))
  })
  req.on('aborted', () => upstream.destroy())
  req.pipe(upstream)
}

export function bridgeWebSocket(socket: Duplex, head: Buffer, req: IncomingMessage, target: RemoteAccessConfig['target']): void {
  const upstreamUrl = `${target.protocol === 'https' ? 'wss' : 'ws'}://${target.host}:${target.port}${req.url ?? '/'}`
  const protocols = typeof req.headers['sec-websocket-protocol'] === 'string' ? req.headers['sec-websocket-protocol'].split(',').map((item) => item.trim()) : undefined
  const server = new WebSocketServer({ noServer: true })
  server.handleUpgrade(req, socket, head, (client) => {
    const upstream = new WebSocket(upstreamUrl, protocols, { headers: { host: `${target.host}:${target.port}` } })
    const pending: Array<{ data: WebSocket.RawData; binary: boolean }> = []
    let pendingBytes = 0
    const maxPendingBytes = 1024 * 1024
    client.on('message', (data, isBinary) => {
      const message = { data, binary: isBinary }
      if (upstream.readyState === WebSocket.OPEN) upstream.send(message.data, { binary: message.binary })
      else if (upstream.readyState === WebSocket.CONNECTING) {
        pendingBytes += typeof data === 'string' ? Buffer.byteLength(data) : data instanceof ArrayBuffer ? data.byteLength : Array.isArray(data) ? data.reduce((sum, chunk) => sum + chunk.length, 0) : data.length
        if (pendingBytes > maxPendingBytes) {
          client.close(1009, 'Pending message limit exceeded')
          upstream.close()
          return
        }
        pending.push(message)
      }
    })
    upstream.on('open', () => {
      for (const message of pending) upstream.send(message.data, { binary: message.binary })
      pending.length = 0
      pendingBytes = 0
    })
    client.on('close', () => upstream.close())
    client.on('error', () => upstream.close())
    upstream.on('message', (data, isBinary) => { if (client.readyState === WebSocket.OPEN) client.send(data, { binary: isBinary }) })
    upstream.on('close', () => client.close())
    upstream.on('error', () => client.close(1011, 'Upstream unavailable'))
  })
}
