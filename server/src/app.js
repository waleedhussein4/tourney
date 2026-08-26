// Builds and exports the Express app. Nothing here listens on a port or opens a
// database connection: `src/index.js` does that for local development, and the
// serverless deployment imports the app directly.

import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import config from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { healthRouter } from './modules/health/health.routes.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { userRouter } from './modules/users/user.routes.js'
import { teamRouter } from './modules/teams/team.routes.js'
import { tournamentRouter } from './modules/tournaments/tournament.routes.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { creditsRouter, productRouter } from './modules/credits/credits.routes.js'

export function createApp() {
  const app = express()

  // Behind Vercel's proxy, the client address is in `X-Forwarded-For`. Without
  // this the rate limiters would see one address for the whole world.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(helmet())

  // CORS exists only for the case where the client is deployed to a different
  // origin than the API. The target setup has no such case — Vite proxies /api
  // in development and Vercel serves both from one origin in production — so
  // with CLIENT_URL unset no CORS middleware is registered at all.
  if (config.clientUrl) {
    app.use(cors({ origin: config.clientUrl, credentials: true }))
  }

  if (config.isDevelopment) {
    app.use(morgan('dev'))
  }

  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/users', userRouter)
  app.use('/api/teams', teamRouter)
  app.use('/api/tournaments', tournamentRouter)
  app.use('/api/products', productRouter)
  app.use('/api/credits', creditsRouter)
  app.use('/api/admin', adminRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

export default createApp()
