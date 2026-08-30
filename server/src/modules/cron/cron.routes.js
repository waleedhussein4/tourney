import crypto from 'node:crypto'
import { Router } from 'express'
import config from '../../config/env.js'
import { cronLimiter } from '../../middleware/rateLimits.js'
import { ApiError } from '../../utils/ApiError.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { clearDemoData, seedDemoData } from '../../../scripts/seed-data.js'

export const cronRouter = Router()

/**
 * The scheduled reseed.
 *
 * This is the most dangerous route in the application: it empties every
 * tournament, team, transaction, and non-admin account, then rebuilds the demo
 * dataset. It exists because the demo credentials are published in the README —
 * within a day the demo account is out of credits and the tournaments are full
 * of strangers' test entries.
 *
 * Three things guard it, and none of them is obscurity:
 *
 *   1. It refuses to run at all unless `CRON_SECRET` is set, so an
 *      unconfigured deployment cannot be talked into wiping itself.
 *   2. It requires that secret as a bearer token, compared in constant time.
 *      Vercel Cron sends exactly this header when the variable exists.
 *   3. It is rate limited, so the token cannot be probed for.
 */

/**
 * The authorisation check, as a pure function so every branch is testable
 * without reaching for the environment.
 *
 * @param {string | undefined} header The request's `Authorization` header.
 * @param {string | undefined} secret The configured `CRON_SECRET`.
 * @throws {ApiError} 503 when unconfigured, 401 when the token does not match.
 */
export function assertCronAuthorised(header, secret) {
  if (!secret) {
    throw new ApiError(503, 'The scheduled reseed is not configured on this deployment.', {
      code: 'CRON_NOT_CONFIGURED',
    })
  }

  const prefix = 'Bearer '
  const presented = header?.startsWith(prefix) ? header.slice(prefix.length) : ''

  // Hash both sides before comparing: `timingSafeEqual` requires equal lengths,
  // so comparing raw values would either throw on a mismatch or leak the
  // secret's length. Two SHA-256 digests are always 32 bytes.
  const digest = (value) => crypto.createHash('sha256').update(value, 'utf8').digest()

  if (!crypto.timingSafeEqual(digest(presented), digest(secret))) {
    throw ApiError.unauthorized('Invalid or missing cron credentials.')
  }
}

/**
 * Rebuilds the demo dataset: clear, then seed.
 *
 * Both halves run in one invocation on purpose. Splitting them would leave a
 * window where the site is live against an empty database, and the clear is the
 * cheap half — nearly all of the time is spent creating accounts and driving
 * tournaments through the real services.
 *
 * `durationMs` is returned because this endpoint has a deadline: the function's
 * `maxDuration`. Reporting how long it took means the margin is observable from
 * the outside instead of guessed at.
 */
const reseed = asyncHandler(async (req, res) => {
  assertCronAuthorised(req.get('authorization'), config.cronSecret)

  const startedAt = Date.now()
  const cleared = await clearDemoData()
  const seeded = await seedDemoData()

  res.json({ ok: true, cleared, seeded, durationMs: Date.now() - startedAt })
})

// Vercel Cron issues a GET, which is why an operation this destructive answers
// one. POST is accepted too, for triggering a reseed by hand.
cronRouter.get('/reseed', cronLimiter, reseed)
cronRouter.post('/reseed', cronLimiter, reseed)
