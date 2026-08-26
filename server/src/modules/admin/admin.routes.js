import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { createUsers, deleteUsers } from '../../../scripts/generateTestUsers.js'
import {
  createTournaments,
  deleteAllTournaments,
} from '../../../scripts/generateTestTournaments.js'

export const adminRouter = Router()

// The hidden demo-data page. Admin-gated, and every handler actually answers —
// the original mounted the seed functions as route handlers directly, so they
// ignored `res` and the request hung until it timed out.
adminRouter.use(requireAdmin)

adminRouter.post(
  '/users',
  asyncHandler(async (_req, res) => {
    const created = await createUsers()
    res.json({ created: created.length })
  })
)

adminRouter.delete(
  '/users',
  asyncHandler(async (_req, res) => {
    const { deletedCount } = await deleteUsers()
    res.json({ deleted: deletedCount })
  })
)

adminRouter.post(
  '/tournaments',
  asyncHandler(async (_req, res) => {
    const created = await createTournaments()
    res.json({ created: created.length })
  })
)

adminRouter.delete(
  '/tournaments',
  asyncHandler(async (_req, res) => {
    const { deletedCount } = await deleteAllTournaments()
    res.json({ deleted: deletedCount })
  })
)
