import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { clearDemoData, seedDemoData } from '../../../scripts/seed-data.js'

export const adminRouter = Router()

// The hidden demo-data page. Admin-gated, and every handler actually answers —
// the original mounted the seed functions as route handlers directly, so they
// ignored `res` and the request hung until it timed out.
adminRouter.use(requireAdmin)

adminRouter.post(
  '/seed',
  asyncHandler(async (_req, res) => {
    res.json(await seedDemoData())
  })
)

adminRouter.delete(
  '/seed',
  asyncHandler(async (_req, res) => {
    res.json(await clearDemoData())
  })
)
