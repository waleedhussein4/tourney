import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { clearDemoData, seedDemoData } from '../../../scripts/seed-data.js'
import * as schemas from './admin.schemas.js'
import * as controller from './admin.controller.js'

export const adminRouter = Router()

// Every route below is admin-gated by the same guard `requireAdmin` uses
// elsewhere — there is no second admin check anywhere in this file.
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

// --- moderation ---------------------------------------------------------------

adminRouter.get('/reports', controller.getReports)

adminRouter.post(
  '/users/:userId/suspend',
  validate({ params: schemas.userIdParams, body: schemas.reasonSchema }),
  controller.suspendUser
)

adminRouter.post(
  '/users/:userId/unsuspend',
  validate({ params: schemas.userIdParams, body: schemas.reasonSchema }),
  controller.unsuspendUser
)

adminRouter.post(
  '/tournaments/:tournamentId/unpublish',
  validate({ params: schemas.tournamentIdParams, body: schemas.reasonSchema }),
  controller.unpublishTournament
)

adminRouter.delete(
  '/tournaments/:tournamentId',
  validate({ params: schemas.tournamentIdParams, body: schemas.reasonSchema }),
  controller.deleteTournament
)
