import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import {
  createTeamSchema,
  joinCodeParams,
  memberParams,
  teamIdParams,
  usernameBody,
} from './team.schemas.js'
import * as controller from './team.controller.js'

export const teamRouter = Router()

teamRouter.use(requireAuth)

// Literal segments are registered before `/:teamId` so "mine", "code", and
// "join" are never mistaken for an id.
teamRouter.get('/mine', controller.listMyTeams)
teamRouter.get('/code/:code', validate({ params: joinCodeParams }), controller.getTeamByCode)
teamRouter.post('/join/:code', validate({ params: joinCodeParams }), controller.joinTeam)

teamRouter.post('/', validate({ body: createTeamSchema }), controller.createTeam)
teamRouter.get('/:teamId', validate({ params: teamIdParams }), controller.getTeam)
teamRouter.delete('/:teamId', validate({ params: teamIdParams }), controller.deleteTeam)
teamRouter.post('/:teamId/leave', validate({ params: teamIdParams }), controller.leaveTeam)
teamRouter.patch(
  '/:teamId/leader',
  validate({ params: teamIdParams, body: usernameBody }),
  controller.transferLeadership
)
teamRouter.delete(
  '/:teamId/members/:username',
  validate({ params: memberParams }),
  controller.kickMember
)
