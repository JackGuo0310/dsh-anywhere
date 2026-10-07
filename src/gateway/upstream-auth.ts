import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import type { RemoteAccessConfig } from '../config.js'

/** Exchange Connection's process launch token only over the private upstream link. */
export async function upstreamCookie(target: RemoteAccessConfig['target'], authenticatedUrl: () => string): Promise<string> {
  const expected = new URL(`${target.protocol}://${target.host}:${target.port}`).origin
  const url = new URL(authenticatedUrl())
  if (url.origin !== expected || url.pathname !== '/' || url.searchParams.size !== 1 || !url.searchParams.has('token') || !url.searchParams.get('token') || url.hash) {
    throw new Error('DSH Connection returned an invalid upstream authentication URL.')
  }
  const transport = target.protocol === 'https' ? httpsRequest : httpRequest
  return new Promise<string>((resolve, reject) => {
    const request = transport({ hostname: target.host, port: target.port, protocol: `${target.protocol}:`, method: 'GET', path: url.pathname + url.search, headers: { host: url.host }, agent: false }, (response) => {
      response.resume()
      const cookies = response.headers['set-cookie'] ?? []
      const matched = cookies.map((cookie) => cookie.split(';', 1)[0]).filter((cookie) => /^dsh-auth-[A-Za-z0-9_-]+=[A-Za-z0-9._-]+$/.test(cookie))
      if (response.statusCode !== 303 || response.headers.location !== './' || matched.length !== 1) {
        reject(new Error('DSH upstream did not complete the private authentication exchange.'))
        return
      }
      resolve(matched[0])
    })
    request.setTimeout(5_000, () => request.destroy(new Error('DSH authentication upstream timed out.')))
    request.on('error', reject)
    request.end()
  })
}
