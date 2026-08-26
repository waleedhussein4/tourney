import { asyncHandler } from '../../utils/asyncHandler.js'
import * as teamService from './team.service.js'

export const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.userId, req.body)
  res.status(201).json({ team: await teamService.describeTeam(team, req.userId) })
})

export const listMyTeams = asyncHandler(async (req, res) => {
  res.json({ teams: await teamService.listTeamsForUser(req.userId) })
})

export const getTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamAsMember(req.params.teamId, req.userId)
  res.json({ team: await teamService.describeTeam(team, req.userId) })
})

/**
 * Looked up before joining, so it answers for people who are not on the team
 * yet: enough to recognise the invite, and nothing more.
 */
export const getTeamByCode = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamByCode(req.params.code)
  res.json({
    team: {
      id: team._id,
      name: team.name,
      memberCount: team.members.length,
      isMember: team.hasMember(req.userId),
    },
  })
})

export const joinTeam = asyncHandler(async (req, res) => {
  const team = await teamService.joinTeamByCode(req.userId, req.params.code)
  res.json({ team: await teamService.describeTeam(team, req.userId) })
})

export const transferLeadership = asyncHandler(async (req, res) => {
  const team = await teamService.transferLeadership(
    req.params.teamId,
    req.userId,
    req.body.username
  )
  res.json({ team: await teamService.describeTeam(team, req.userId) })
})

export const kickMember = asyncHandler(async (req, res) => {
  const team = await teamService.kickMember(req.params.teamId, req.userId, req.params.username)
  res.json({ team: await teamService.describeTeam(team, req.userId) })
})

export const leaveTeam = asyncHandler(async (req, res) => {
  await teamService.leaveTeam(req.params.teamId, req.userId)
  res.status(204).end()
})

export const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.deleteTeam(req.params.teamId, req.userId)
  res.status(204).end()
})
