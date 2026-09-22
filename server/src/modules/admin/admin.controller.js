import { asyncHandler } from '../../utils/asyncHandler.js'
import * as adminService from './admin.service.js'
import { listReports } from './report.service.js'

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await adminService.suspendUser(req.userId, req.params.userId, req.body.reason)
  res.json({ user: user.toPublicJSON() })
})

export const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await adminService.unsuspendUser(req.userId, req.params.userId, req.body.reason)
  res.json({ user: user.toPublicJSON() })
})

export const unpublishTournament = asyncHandler(async (req, res) => {
  const tournament = await adminService.unpublishAnyTournament(
    req.userId,
    req.params.tournamentId,
    req.body.reason
  )
  res.json({ tournament: { id: tournament.id, publishState: tournament.publishState } })
})

export const deleteTournament = asyncHandler(async (req, res) => {
  const result = await adminService.deleteAnyTournament(
    req.userId,
    req.params.tournamentId,
    req.body.reason
  )
  res.json(result)
})

export const getReports = asyncHandler(async (_req, res) => {
  res.json({ reports: await listReports() })
})
