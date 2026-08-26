import crypto from 'node:crypto'
import Team from '../../models/team.model.js'
import User from '../../models/user.model.js'
// Repointed to the rewritten tournament model in PR 4.
import Tournament from '../../../models/tourneyModels.js'
import { ApiError } from '../../utils/ApiError.js'

// No I, O, 0 or 1: a join code gets read aloud and typed from a screenshot.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6
const CODE_ATTEMPTS = 10

function randomCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH)
  let code = ''
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length]
  return code
}

/**
 * Creates a team, retrying on the one thing that can legitimately collide.
 *
 * The retry is driven by the unique index rather than by a "is this code taken?"
 * lookup, because only the index can rule out two simultaneous creates picking
 * the same code.
 */
export async function createTeam(userId, { name }) {
  if (await Team.exists({ name })) throw ApiError.conflict('That team name is already taken')

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    try {
      return await Team.create({
        joinCode: randomCode(),
        name,
        members: [userId],
        leader: userId,
        createdBy: userId,
      })
    } catch (error) {
      const collidedOnCode = error?.code === 11000 && 'joinCode' in (error.keyPattern ?? {})
      if (!collidedOnCode) throw error
    }
  }

  throw new ApiError(503, 'Could not allocate a join code. Please try again.')
}

/** Loads a team by id, or fails with a 404. */
export async function getTeam(teamId) {
  const team = await Team.findById(teamId)
  if (!team) throw ApiError.notFound('Team not found')
  return team
}

/** Loads a team by its join code, or fails with a 404. */
export async function getTeamByCode(code) {
  const team = await Team.findOne({ joinCode: code })
  if (!team) throw ApiError.notFound('No team has that join code')
  return team
}

/** Loads a team the caller is on, or fails — 404 for missing, 403 for outsiders. */
export async function getTeamAsMember(teamId, userId) {
  const team = await getTeam(teamId)
  if (!team.hasMember(userId)) throw ApiError.forbidden('You are not a member of this team')
  return team
}

/** Loads a team the caller leads. */
async function getTeamAsLeader(teamId, userId) {
  const team = await getTeamAsMember(teamId, userId)
  if (!team.isLeader(userId)) throw ApiError.forbidden('Only the team leader can do that')
  return team
}

/**
 * Resolves the members of a team to usernames in one query.
 *
 * The original code issued a `User.findById` per member, per team, per request.
 */
export async function describeTeam(team, viewerId) {
  const users = await User.find({ _id: { $in: team.members } })
    .select('username')
    .lean()
  const byId = new Map(users.map((user) => [String(user._id), user.username]))

  return {
    id: team._id,
    name: team.name,
    joinCode: team.joinCode,
    leader: byId.get(String(team.leader)) ?? null,
    members: team.members.map((member) => ({
      id: member,
      username: byId.get(String(member)) ?? null,
      isLeader: String(member) === String(team.leader),
    })),
    isLeader: team.isLeader(viewerId),
    isMember: team.hasMember(viewerId),
  }
}

/** Every team the user is on. */
export async function listTeamsForUser(userId) {
  const teams = await Team.find({ members: userId }).sort({ createdAt: -1 })
  return Promise.all(teams.map((team) => describeTeam(team, userId)))
}

/**
 * Adds the caller to a team by join code.
 *
 * Idempotent: joining a team you are already on returns the team rather than a
 * duplicate row or an error, so a double-clicked invite link is harmless.
 */
export async function joinTeamByCode(userId, code) {
  const team = await getTeamByCode(code)
  if (team.hasMember(userId)) return team

  await assertRosterIsMutable(team, 'join')

  // `$addToSet` makes the write itself idempotent, closing the gap between the
  // membership check above and this update.
  await Team.updateOne({ _id: team._id }, { $addToSet: { members: userId } })
  return getTeam(team._id)
}

/** Hands leadership to another member. Leader only. */
export async function transferLeadership(teamId, userId, username) {
  const team = await getTeamAsLeader(teamId, userId)

  const newLeader = await User.findOne({ username }).select('_id').lean()
  if (!newLeader) throw ApiError.notFound(`No user called ${username}`)
  if (!team.hasMember(newLeader._id)) throw ApiError.badRequest('That user is not on this team')

  team.leader = String(newLeader._id)
  await team.save()
  return team
}

/** Removes a member. Leader only, and never the leader themselves. */
export async function kickMember(teamId, userId, username) {
  const team = await getTeamAsLeader(teamId, userId)
  await assertRosterIsMutable(team, 'change')

  const member = await User.findOne({ username }).select('_id').lean()
  if (!member) throw ApiError.notFound(`No user called ${username}`)
  if (!team.hasMember(member._id)) throw ApiError.badRequest('That user is not on this team')
  if (team.isLeader(member._id)) {
    throw ApiError.badRequest('The leader cannot be removed — transfer leadership first')
  }

  await Team.updateOne({ _id: team._id }, { $pull: { members: String(member._id) } })
  return getTeam(team._id)
}

/** Leaves a team. The leader must hand over first, so a team is never headless. */
export async function leaveTeam(teamId, userId) {
  const team = await getTeamAsMember(teamId, userId)
  if (team.isLeader(userId)) {
    throw ApiError.badRequest(
      'Transfer leadership before leaving, or delete the team if you are done with it'
    )
  }
  await assertRosterIsMutable(team, 'change')

  await Team.updateOne({ _id: team._id }, { $pull: { members: userId } })
}

/** Deletes a team. Leader only. */
export async function deleteTeam(teamId, userId) {
  const team = await getTeamAsLeader(teamId, userId)
  await assertRosterIsMutable(team, 'delete')
  await Team.deleteOne({ _id: team._id })
}

/**
 * Refuses roster changes while the team is enrolled in a tournament that is
 * under way.
 *
 * Without this a leader could kick every teammate the moment the bracket was
 * drawn, or dissolve the team after the entry fee had gone into the bank — the
 * tournament would then be paying out to a roster that no longer exists.
 */
async function assertRosterIsMutable(team, action) {
  const active = await Tournament.exists({
    hasStarted: true,
    hasEnded: { $ne: true },
    // `teamName` is how the legacy tournament schema records an enrolled team;
    // PR 4 replaces it with `teamId` and this clause goes away.
    $or: [{ 'enrolledTeams.teamId': team._id }, { 'enrolledTeams.teamName': team.name }],
  })

  if (active) {
    throw ApiError.conflict(
      `You cannot ${action} this team while it is competing in a tournament that has started`
    )
  }
}
