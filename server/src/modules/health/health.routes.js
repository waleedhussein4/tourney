import { Router } from 'express'
import mongoose from 'mongoose'
import { connectToDatabase } from '../../db/connect.js'
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
    // On a cold serverless container nothing has connected yet, so a health
    // check that only read `readyState` would report "disconnected" for an app
    // that is working. Try to connect, and report the failure rather than
    // throwing it: saying "degraded" is this endpoint's whole job.
    await connectToDatabase().catch(() => {})

    const state = DB_STATES[mongoose.connection.readyState] ?? 'unknown'
    res.json({ status: state === 'connected' ? 'ok' : 'degraded', database: state })
  })
)
