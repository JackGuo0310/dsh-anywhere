import type { Server } from 'node:http'
import { createServer } from 'node:http'
import type { RemoteAccessConfig } from '../config.js'

/** Placeholder lifecycle owner; HTTP/auth proxy stages add handlers here. */
export class RemoteGateway {
  private server: Server | undefined

  constructor(private readonly config: RemoteAccessConfig) {}

  async start(): Promise<void> {
    if (this.server) return
    this.server = createServer((_request, response) => {
      response.writeHead(503, { 'content-type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ error: 'Remote gateway is starting.' }))
    })
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject)
      this.server!.listen(this.config.listenPort, this.config.listenHost, () => {
        this.server!.off('error', reject)
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    const server = this.server
    this.server = undefined
    if (!server) return
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}
