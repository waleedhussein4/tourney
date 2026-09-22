import User from '../../models/user.model.js'
import Team from '../../models/team.model.js'
import Tournament from '../../models/tournament.model.js'
import { ApiError } from '../../utils/ApiError.js'
import { attentionSummary } from '../tournaments/tournament.service.js'

// An account with an unverified email may browse and join tournaments freely —
// there is nothing an unproven address puts at risk there. It may not become a
// host (`becomeHost`, below), and since `createTournament` already requires
// `isHost`, that single gate also keeps it from ever publishing. Blocked with
// a specific 403 (`EMAIL_NOT_VERIFIED`), never a silent no-op.

/** Loads a user or fails with a 404. */
export async function getUser(userId) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')
  return user
}

/**
 * Turns an account into a host.
 *
 * Free, and instant. What costs money is publishing more than one tournament at
 * a time, and that is the subscription — charging twice, once to hold the title
 * and again to use it, is a toll booth in front of a toll booth.
 *
 * Requires a verified email: `createTournament` already requires `isHost`, so
 * gating this one endpoint is enough to keep an unproven address off the whole
 * hosting path, publish included, without duplicating the check everywhere.
 */
export async function becomeHost(userId) {
  const updated = await User.findOneAndUpdate(
    { _id: userId, isHost: false, emailVerified: true },
    { $set: { isHost: true } },
    { new: true }
  )
  if (updated) return updated

  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')
  if (!user.emailVerified) {
    throw new ApiError(403, 'Verify your email before you can become a host', {
      code: 'EMAIL_NOT_VERIFIED',
    })
  }
  throw ApiError.badRequest('You are already a host')
}

// --- dashboard ----------------------------------------------------------

/** The competitor id `uid` plays under in `tournament` — their own id for a
 * solo tournament, their team's id for a team one (or `null` if neither). */
function participantIdFor(tournament, uid) {
  if (tournament.teamSize <= 1) return String(uid)
  const team = tournament.enrolledTeams.find((entry) =>
    entry.members.some((member) => String(member.userId) === String(uid))
  )
  return team ? String(team.teamId) : null
}

/** A participant id's display name — a username for a solo player, the
 * tournament's own denormalised team name for a team. */
function nameOf(tournament, participantId, usernames) {
  if (tournament.teamSize <= 1) return usernames.get(String(participantId)) ?? 'Unknown player'
  const team = tournament.enrolledTeams.find(
    (entry) => String(entry.teamId) === String(participantId)
  )
  return team?.teamName ?? 'Unknown team'
}

/**
 * Everything a player wants to know without opening each tournament: their
 * next scheduled match, any result waiting on their confirmation, and
 * tournaments they have applied to.
 *
 * One query finds every tournament that could mention this player — as a
 * solo entrant, a team member, an applicant (direct or via a team), or an
 * accepted applicant awaiting entry — matched on indexed fields
 * (`enrolledUsers.userId`, `enrolledTeams.members.userId`,
 * `applications.applicantId`, `acceptedUsers`, `acceptedTeams`), never a scan
 * of every tournament filtered in JavaScript afterwards.
 */
export async function getDashboard(userId) {
  const teams = await Team.find({ members: userId }).select('_id').lean()
  const teamIds = teams.map((team) => team._id)
  const applicantIds = [userId, ...teamIds]

  const tournaments = await Tournament.find({
    $or: [
      { 'enrolledUsers.userId': userId },
      { 'enrolledTeams.members.userId': userId },
      { 'applications.applicantId': { $in: applicantIds } },
      { acceptedUsers: userId },
      { acceptedTeams: { $in: teamIds } },
    ],
  })
    .select('title teamSize matches enrolledTeams applications acceptedUsers acceptedTeams')
    .lean()

  // Usernames for every solo opponent this player could be shown, resolved in
  // one query rather than one per match.
  const opponentIds = new Set()
  for (const tournament of tournaments) {
    if (tournament.teamSize > 1) continue
    for (const match of tournament.matches) {
      if (!match.participants.includes(String(userId))) continue
      for (const participantId of match.participants) {
        if (participantId && participantId !== String(userId)) opponentIds.add(participantId)
      }
    }
  }
  const users = await User.find({ _id: { $in: [...opponentIds] } })
    .select('username')
    .lean()
  const usernames = new Map(users.map((user) => [String(user._id), user.username]))

  let nextMatch = null
  const awaitingConfirmation = []
  const now = Date.now()

  for (const tournament of tournaments) {
    const mine = participantIdFor(tournament, userId)
    if (!mine) continue

    for (const match of tournament.matches) {
      if (!match.participants.includes(mine)) continue
      const opponentId = match.participants.find((id) => id && id !== mine) ?? null
      const opponentName = opponentId ? nameOf(tournament, opponentId, usernames) : null

      if (
        match.state === 'scheduled' &&
        match.scheduledAt &&
        new Date(match.scheduledAt).getTime() > now &&
        (!nextMatch || new Date(match.scheduledAt) < new Date(nextMatch.scheduledAt))
      ) {
        nextMatch = {
          tournamentId: tournament._id,
          tournamentTitle: tournament.title,
          round: match.round,
          scheduledAt: match.scheduledAt,
          opponentName,
        }
      }

      const reporterSide = match.reportedBy ? participantIdFor(tournament, match.reportedBy) : null
      if (match.state === 'reported' && reporterSide !== mine) {
        awaitingConfirmation.push({
          tournamentId: tournament._id,
          tournamentTitle: tournament.title,
          matchId: String(match._id),
          round: match.round,
          opponentName,
        })
      }
    }
  }

  const applications = []
  for (const tournament of tournaments) {
    const applying = tournament.applications.find((application) =>
      applicantIds.some((id) => String(id) === String(application.applicantId))
    )
    if (applying) {
      applications.push({
        tournamentId: tournament._id,
        tournamentTitle: tournament.title,
        status: 'pending',
      })
      continue
    }
    const accepted =
      tournament.acceptedUsers.some((id) => String(id) === String(userId)) ||
      tournament.acceptedTeams.some((id) => teamIds.some((teamId) => String(teamId) === String(id)))
    if (accepted) {
      applications.push({
        tournamentId: tournament._id,
        tournamentTitle: tournament.title,
        status: 'accepted',
      })
    }
  }

  return { nextMatch, awaitingConfirmation, applications }
}

/**
 * Across every tournament this user hosts: what needs them right now, so a
 * host with several tournaments running can see at a glance which one is
 * stalled.
 *
 * One query, matched on `host` (indexed) and projected down to just the
 * arrays `attentionSummary` reads — never the whole collection, and never a
 * tournament this user does not host. A non-host, or a host of nothing, gets
 * an empty list rather than a special case.
 */
export async function getHostDashboard(userId) {
  const tournaments = await Tournament.find({ host: userId })
    .select('title hasStarted hasEnded applications matches')
    .sort({ createdAt: -1 })
    .lean()

  return tournaments.map((tournament) => ({
    tournamentId: tournament._id,
    tournamentTitle: tournament.title,
    hasStarted: tournament.hasStarted,
    hasEnded: tournament.hasEnded,
    ...attentionSummary(tournament),
  }))
}
