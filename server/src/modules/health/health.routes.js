import { Router } from 'express'
import mongoose from 'mongoose'
import { asyncHandler } from '../../utils/asyncHandler.js'

export const healthRouter = Router()

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting']

/**
 * Liveness and readiness in one place: the process answered, and here is whether
 * it can currently reach the database.
 */
healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const state = DB_STATES[mongoose.connection.readyState] ?? 'unknown'
    res.json({ status: state === 'connected' ? 'ok' : 'degraded', database: state })
  })
)
