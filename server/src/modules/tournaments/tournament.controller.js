import { CATEGORIES } from '../../config/constants.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import * as service from './tournament.service.js'
import { toListItems, toManageView, toPublicView } from './tournament.presenter.js'

// --- reading ----------------------------------------------------------------

export const list = asyncHandler(async (req, res) => {
  const { tournaments, pagination } = await service.listTournaments(req.query)
  res.json({ tournaments: toListItems(tournaments), pagination })
})

export const trending = asyncHandler(async (req, res) => {
  const tournaments = await service.listTrending(req.query.limit)
  res.json({ tournaments: toListItems(tournaments) })
})

/** The fixed category list every tournament is filed under. */
export const categories = asyncHandler(async (_req, res) => {
  res.json({ categories: CATEGORIES })
})

export const mine = asyncHandler(async (req, res) => {
  const tournaments = await service.listMine(req.userId)
  res.json({ tournaments: toListItems(tournaments) })
})

export const getOne = asyncHandler(async (req, res) => {
  const tournament = await service.loadVisible(req.params.tournamentId, req.userId)
  res.json({ tournament: await toPublicView(tournament, req.userId) })
})

export const getForManagement = asyncHandler(async (req, res) => {
  const tournament = await service.loadAsHost(req.params.tournamentId, req.userId)
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

// --- writing ----------------------------------------------------------------

export const create = asyncHandler(async (req, res) => {
  const tournament = await service.createTournament(req.userId, req.body)
  res.status(201).json({ tournament: await toPublicView(tournament, req.userId) })
})

export const update = asyncHandler(async (req, res) => {
  const tournament = await service.updateTournament(req.params.tournamentId, req.userId, req.body)
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

export const remove = asyncHandler(async (req, res) => {
  const { entrants } = await service.deleteTournament(req.params.tournamentId, req.userId)
  res.json({ deleted: true, entrants })
})

export const postUpdate = asyncHandler(async (req, res) => {
  const tournament = await service.postUpdate(req.params.tournamentId, req.userId, req.body.content)
  res.status(201).json({ updates: tournament.updates })
})

// --- joining ----------------------------------------------------------------

export const joinSolo = asyncHandler(async (req, res) => {
  const tournament = await service.joinSolo(req.params.tournamentId, req.userId)
  res.json({ tournament: await toPublicView(tournament, req.userId) })
})

export const joinAsTeam = asyncHandler(async (req, res) => {
  const tournament = await service.joinTeam(req.params.tournamentId, req.userId, req.body.teamId)
  res.json({ tournament: await toPublicView(tournament, req.userId) })
})

export const apply = asyncHandler(async (req, res) => {
  const tournament = await service.apply(req.params.tournamentId, req.userId, req.body)
  res.status(201).json({ tournament: await toPublicView(tournament, req.userId) })
})

export const acceptApplication = asyncHandler(async (req, res) => {
  const tournament = await service.acceptApplication(
    req.params.tournamentId,
    req.userId,
    req.params.applicationId
  )
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

export const rejectApplication = asyncHandler(async (req, res) => {
  const tournament = await service.rejectApplication(
    req.params.tournamentId,
    req.userId,
    req.params.applicationId
  )
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

export const publish = asyncHandler(async (req, res) => {
  const tournament = await service.publishTournament(req.params.tournamentId, req.userId)
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

export const unpublish = asyncHandler(async (req, res) => {
  const tournament = await service.unpublishTournament(req.params.tournamentId, req.userId)
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

// --- lifecycle --------------------------------------------------------------

export const shuffle = asyncHandler(async (req, res) => {
  const tournament = await service.shuffleBrackets(req.params.tournamentId, req.userId)
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

export const start = asyncHandler(async (req, res) => {
  const tournament = await service.startTournament(req.params.tournamentId, req.userId)
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

export const updateMatches = asyncHandler(async (req, res) => {
  const tournament = await service.updateMatches(
    req.params.tournamentId,
    req.userId,
    req.body.matches
  )
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

export const scheduleMatches = asyncHandler(async (req, res) => {
  const tournament = await service.scheduleMatches(
    req.params.tournamentId,
    req.userId,
    req.body.matches
  )
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

export const reportMatch = asyncHandler(async (req, res) => {
  const tournament = await service.reportMatch(
    req.params.tournamentId,
    req.userId,
    req.params.matchId,
    req.body.scores
  )
  res.json({ tournament: await toPublicView(tournament, req.userId) })
})

export const confirmMatch = asyncHandler(async (req, res) => {
  const tournament = await service.confirmMatch(
    req.params.tournamentId,
    req.userId,
    req.params.matchId,
    req.body.agree
  )
  res.json({ tournament: await toPublicView(tournament, req.userId) })
})

export const updateParticipants = asyncHandler(async (req, res) => {
  const tournament = await service.updateParticipants(
    req.params.tournamentId,
    req.userId,
    req.body.participants
  )
  res.json({ tournament: await toManageView(tournament, req.userId) })
})

export const end = asyncHandler(async (req, res) => {
  const { tournament, winners } = await service.endTournament(req.params.tournamentId, req.userId)
  res.json({ tournament: await toManageView(tournament, req.userId), winners })
})
