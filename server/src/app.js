// Builds and exports the Express app. Nothing here listens on a port or opens a
// database connection: `src/index.js` does that for local development, and the
// serverless deployment imports the app directly.

import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import * as Sentry from '@sentry/node'
import config from './config/env.js'
import { connectToDatabase } from './db/connect.js'
import { ApiError } from './utils/ApiError.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { healthRouter } from './modules/health/health.routes.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { userRouter } from './modules/users/user.routes.js'
import { teamRouter } from './modules/teams/team.routes.js'
import { tournamentRouter } from './modules/tournaments/tournament.routes.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { billingRouter } from './modules/subscriptions/subscription.routes.js'
import { webhookRouter } from './modules/subscriptions/webhook.routes.js'
import { cronRouter } from './modules/cron/cron.routes.js'

/**
 * Opens the database connection on the first request that needs one.
 *
 * A serverless invocation has no startup phase to connect in: the platform
 * imports this module and immediately hands it a request. `connectToDatabase`
 * caches its promise on `globalThis`, so this is one await on an
 * already-settled promise for every request after the first — and the first
 * request on a cold container is the one that pays for the handshake.
 */
function ensureDatabase(_req, _res, next) {
  connectToDatabase().then(
    () => next(),
    (error) =>
      next(
        new ApiError(503, 'The database is unavailable. Please try again in a moment.', {
          code: 'DATABASE_UNAVAILABLE',
          details: config.isProduction ? undefined : error.message,
        })
      )
  )
}

// Free tier: errors only, no performance tracing. A no-op when SENTRY_DSN is
// unset — no network calls, no side effects.
if (config.sentryDsn) {
  Sentry.init({ dsn: config.sentryDsn, environment: config.nodeEnv, tracesSampleRate: 0 })
}

export function createApp() {
  const app = express()

  // Behind Cloudflare's edge, the client address is in `X-Forwarded-For`.
  // `worker/index.js` forwards the incoming Request to the container as-is —
  // it does not rebuild headers — so the header the container sees still
  // carries exactly the one hop Cloudflare's edge added. Without `trust
  // proxy` set, the rate limiters would see one address for the whole world.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(helmet())

  // CORS exists only for the case where the client is deployed to a different
  // origin than the API. The target setup has no such case — Vite proxies /api
  // in development and the Cloudflare Worker serves both from one origin in
  // production — so with CLIENT_URL unset no CORS middleware is registered at
  // all.
  if (config.clientUrl) {
    app.use(cors({ origin: config.clientUrl, credentials: true }))
  }

  if (config.isDevelopment) {
    app.use(morgan('dev'))
  }

  // Before the JSON parser and before `ensureDatabase`: a webhook's signature
  // is over the raw bytes, so this router must see them unparsed. It opens its
  // own database connection through the service it calls.
  app.use('/api/webhooks', ensureDatabase, webhookRouter)

  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  // Health answers whether the database is reachable, so it is mounted ahead of
  // the middleware that fails the request when it is not.
  app.use('/api/health', healthRouter)

  app.use(ensureDatabase)

  app.use('/api/auth', authRouter)
  app.use('/api/users', userRouter)
  app.use('/api/teams', teamRouter)
  app.use('/api/tournaments', tournamentRouter)
  app.use('/api/billing', billingRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/cron', cronRouter)

  app.use(notFound)

  if (config.sentryDsn) {
    Sentry.setupExpressErrorHandler(app)
  }

  app.use(errorHandler)

  return app
}

export default createApp()
