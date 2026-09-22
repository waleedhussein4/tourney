import { randomUUID } from 'node:crypto'
import * as Sentry from '@sentry/node'
import { logger } from '../lib/logger.js'

/**
 * Gives every request a stable id — the inbound `x-request-id` if the caller
 * (or the edge in front of us) already set one, otherwise a fresh one — and:
 *
 *   - echoes it back on the response, so a user-reported error can be found
 *   - attaches it to the Sentry scope, so an event links back to the request
 *   - logs one structured line per request when it finishes: method, path,
 *     status, duration. Never the body, cookies, or headers — none of that is
 *     safe to put in a log a container platform retains.
 */
export function requestId(req, res, next) {
  const id = req.get('x-request-id') || randomUUID()
  req.id = id
  res.setHeader('x-request-id', id)

  Sentry.getCurrentScope().setTag('request_id', id)

  const start = Date.now()
  res.on('finish', () => {
    logger.info('request', {
      requestId: id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    })
  })

  next()
}
