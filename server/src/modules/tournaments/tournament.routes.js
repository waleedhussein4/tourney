import { Router } from 'express'
import { optionalAuth, requireAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import * as schemas from './tournament.schemas.js'
import * as controller from './tournament.controller.js'

export const tournamentRouter = Router()

// --- public -----------------------------------------------------------------
// Guests can browse everything. `optionalAuth` is what lets a signed-in visitor
// get viewer-specific flags on the same endpoints without shutting guests out.

tournamentRouter.get('/', validate({ query: schemas.listQuerySchema }), controller.list)
tournamentRouter.get(
  '/trending',
  validate({ query: schemas.trendingQuerySchema }),
  controller.trending
)
tournamentRouter.get('/categories', controller.categories)
tournamentRouter.get('/mine', requireAuth, controller.mine)

tournamentRouter.post(
  '/',
  requireAuth,
  validate({ body: schemas.createTournamentSchema }),
  controller.create
)

tournamentRouter.get(
  '/:tournamentId',
  optionalAuth,
  validate({ params: schemas.tournamentIdParams }),
  controller.getOne
)

// --- host only --------------------------------------------------------------

tournamentRouter.get(
  '/:tournamentId/manage',
  requireAuth,
  validate({ params: schemas.tournamentIdParams }),
  controller.getForManagement
)

tournamentRouter.patch(
  '/:tournamentId',
  requireAuth,
  validate({ params: schemas.tournamentIdParams, body: schemas.updateTournamentSchema }),
  controller.update
)

tournamentRouter.delete(
  '/:tournamentId',
  requireAuth,
  validate({ params: schemas.tournamentIdParams }),
  controller.remove
)

tournamentRouter.post(
  '/:tournamentId/updates',
  requireAuth,
  validate({ params: schemas.tournamentIdParams, body: schemas.updateBodySchema }),
  controller.postUpdate
)

tournamentRouter.post(
  '/:tournamentId/bank/deposit',
  requireAuth,
  validate({ params: schemas.tournamentIdParams, body: schemas.depositSchema }),
  controller.deposit
)

tournamentRouter.post(
  '/:tournamentId/shuffle',
  requireAuth,
  validate({ params: schemas.tournamentIdParams }),
  controller.shuffle
)

tournamentRouter.post(
  '/:tournamentId/start',
  requireAuth,
  validate({ params: schemas.tournamentIdParams }),
  controller.start
)

tournamentRouter.post(
  '/:tournamentId/end',
  requireAuth,
  validate({ params: schemas.tournamentIdParams }),
  controller.end
)

tournamentRouter.patch(
  '/:tournamentId/matches',
  requireAuth,
  validate({ params: schemas.tournamentIdParams, body: schemas.matchesSchema }),
  controller.updateMatches
)

tournamentRouter.patch(
  '/:tournamentId/participants',
  requireAuth,
  validate({ params: schemas.tournamentIdParams, body: schemas.participantsSchema }),
  controller.updateParticipants
)

tournamentRouter.post(
  '/:tournamentId/applications/:applicationId/accept',
  requireAuth,
  validate({ params: schemas.applicationParams }),
  controller.acceptApplication
)

tournamentRouter.post(
  '/:tournamentId/applications/:applicationId/reject',
  requireAuth,
  validate({ params: schemas.applicationParams }),
  controller.rejectApplication
)

// --- entering ---------------------------------------------------------------

tournamentRouter.post(
  '/:tournamentId/join/solo',
  requireAuth,
  validate({ params: schemas.tournamentIdParams }),
  controller.joinSolo
)

tournamentRouter.post(
  '/:tournamentId/join/team',
  requireAuth,
  validate({ params: schemas.tournamentIdParams, body: schemas.joinTeamSchema }),
  controller.joinAsTeam
)

tournamentRouter.post(
  '/:tournamentId/applications',
  requireAuth,
  validate({ params: schemas.tournamentIdParams, body: schemas.applySchema }),
  controller.apply
)
