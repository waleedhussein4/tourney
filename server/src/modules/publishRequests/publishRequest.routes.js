import { Router } from 'express'
import { requireAdmin, requireAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import * as schemas from './publishRequest.schemas.js'
import * as controller from './publishRequest.controller.js'

// Two routers, because the module answers at two mount points: the host's
// publish action sits with the tournament it acts on, and the queue sits behind
// the admin gate.

/** Mounted at /api/tournaments. */
export const publishRouter = Router()

publishRouter.post(
  '/:tournamentId/publish',
  requireAuth,
  validate({ params: schemas.tournamentIdParams }),
  controller.publish
)

/** Mounted at /api/admin/publish-requests. */
export const publishRequestAdminRouter = Router()

publishRequestAdminRouter.use(requireAdmin)

publishRequestAdminRouter.get('/', controller.list)

publishRequestAdminRouter.post(
  '/:requestId/confirm',
  validate({ params: schemas.requestIdParams, body: schemas.confirmSchema }),
  controller.confirm
)

publishRequestAdminRouter.post(
  '/:requestId/reject',
  validate({ params: schemas.requestIdParams, body: schemas.rejectSchema }),
  controller.reject
)
