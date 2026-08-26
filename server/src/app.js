// Builds and exports the Express app. Nothing here listens on a port or opens a
// database connection: `src/index.js` does that for local development, and the
// serverless deployment added in Phase 6 imports the app directly.

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

// Legacy routers, still mounted at their original paths. Each is deleted by the
// Phase 2 PR that replaces it; the last one to go takes these imports with it.
import legacyTournamentRoutes from '../routes/tourneyRoutes.js'
import legacyPurchaseRoutes from '../routes/purchaseRoutes.js'
import legacyTeamRoutes from '../routes/teamRoutes.js'
import legacyAdminRoutes from '../routes/adminRoutes.js'

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

  app.use('/api/tournement', legacyTournamentRoutes)
  app.use('/api/purchase', legacyPurchaseRoutes)
  app.use('/api/team', legacyTeamRoutes)
  app.use('/api/admin', legacyAdminRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

export default createApp()
