// Read models. Everything a client sees of a tournament is shaped here, so the
// public page, the host's manage page, and the list endpoints cannot drift into
// three different vocabularies.

import User from '../../models/user.model.js'
import Team from '../../models/team.model.js'
import { attentionSummary } from './tournament.service.js'

/**
 * Resolves every user id a tournament mentions to a username in one query.
 *
 * The original code ran a `User.findById` per participant, per team member, per
 * application, on every page load.
 */
async function usernamesFor(tournaments) {
  const ids = new Set()
  for (const tournament of tournaments) {
    ids.add(String(tournament.host))
    for (const entry of tournament.enrolledUsers) ids.add(String(entry.userId))
    for (const team of tournament.enrolledTeams) {
      for (const member of team.members) ids.add(String(member.userId))
    }
    for (const application of tournament.applications) {
      if (!application.isTeam) ids.add(String(application.applicantId))
    }
  }

  const users = await User.find({ _id: { $in: [...ids] } })
    .select('username')
    .lean()
  return new Map(users.map((user) => [String(user._id), user.username]))
}

/**
 * Bracket matches for the client. `react-brackets` wants a tree of rounds and
 * seeds — that shaping happens client-side in `buildRounds.js` — this just
 * turns each match subdocument into plain, string-keyed data.
 */
function matchesOf(tournament) {
  return tournament.matches.map((match) => ({
    id: String(match._id),
    round: match.round,
    slot: match.slot,
    participants: match.participants.map((id) => (id ? String(id) : null)),
    scores: match.scores,
    winner: match.winner ? String(match.winner) : null,
    state: match.state,
    scheduledAt: match.scheduledAt,
    reportedBy: match.reportedBy ? String(match.reportedBy) : null,
    confirmedBy: match.confirmedBy ? String(match.confirmedBy) : null,
  }))
}

function standing(entry) {
  return {
    score: entry.score ?? 0,
    eliminated: Boolean(entry.eliminated),
    withdrawn: Boolean(entry.withdrawn),
  }
}

/**
 * The uniform participant shape: a solo player and a team look the same to a
 * caller apart from `members`, which only teams have.
 */
function participantsOf(tournament, names) {
  if (tournament.isTeamBased) {
    return tournament.enrolledTeams.map((team) => ({
      id: String(team.teamId),
      name: team.teamName,
      ...standing(team),
      members: team.members.map((member) => ({
        id: String(member.userId),
        name: names.get(String(member.userId)) ?? null,
        ...standing(member),
      })),
    }))
  }

  return tournament.enrolledUsers.map((entry) => ({
    id: String(entry.userId),
    name: names.get(String(entry.userId)) ?? null,
    ...standing(entry),
  }))
}

/** The card shown in lists, carousels, and search results. */
export function toListItem(tournament) {
  return {
    id: String(tournament._id),
    title: tournament.title,
    description: tournament.description,
    category: tournament.category,
    type: tournament.type,
    accessibility: tournament.accessibility,
    teamSize: tournament.teamSize,
    maxCapacity: tournament.maxCapacity,
    participantCount: tournament.participantCount(),
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    hasStarted: tournament.hasStarted,
    hasEnded: tournament.hasEnded,
    publishState: tournament.publishState,
  }
}

export function toListItems(tournaments) {
  return tournaments.map(toListItem)
}

/**
 * The public tournament page.
 *
 * `viewer` carries the flags the page branches on. They are computed here, from
 * the loaded document — the original code compared the tournament id against the
 * viewer's id for `hasApplied`, read a field the application documents never had,
 * and never returned `isJoined` at all.
 */
export async function toPublicView(tournament, viewerId) {
  const id = viewerId ? String(viewerId) : null
  const [names, viewerTeamIds] = await Promise.all([usernamesFor([tournament]), teamIdsFor(id)])

  return {
    id: String(tournament._id),
    title: tournament.title,
    description: tournament.description,
    rules: tournament.rules,
    type: tournament.type,
    category: tournament.category,
    accessibility: tournament.accessibility,
    teamSize: tournament.teamSize,
    maxCapacity: tournament.maxCapacity,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    hasStarted: tournament.hasStarted,
    hasEnded: tournament.hasEnded,
    publishState: tournament.publishState,
    bracketsShuffled: tournament.bracketsShuffled,
    bracketOrder: tournament.bracketOrder,
    matches: matchesOf(tournament),
    updates: tournament.updates,
    contactInfo: tournament.contactInfo,
    applicationForm: tournament.applicationForm,
    host: { id: String(tournament.host), name: names.get(String(tournament.host)) ?? null },
    participants: participantsOf(tournament, names),
    waitlistCount: tournament.waitlist.length,
    viewer: {
      isHost: id ? tournament.isHostedBy(id) : false,
      isJoined: id ? tournament.hasParticipant(id) : false,
      hasApplied: id ? hasApplied(tournament, id, viewerTeamIds) : false,
      isAccepted: id ? isAccepted(tournament, id, viewerTeamIds) : false,
      isWaitlisted: id ? isWaitlisted(tournament, id, viewerTeamIds) : false,
    },
  }
}

/** True when the viewer — or their team — is waiting for a slot to open up. */
function isWaitlisted(tournament, userId, teamIds) {
  return tournament.waitlist.some((entry) =>
    entry.isTeam ? teamIds.has(String(entry.teamId)) : String(entry.userId) === userId
  )
}

/** The host's view: the public view plus the applications queue. */
export async function toManageView(tournament, viewerId) {
  const [view, names] = await Promise.all([
    toPublicView(tournament, viewerId),
    usernamesFor([tournament]),
  ])

  return {
    ...view,
    applications: tournament.applications.map((application) => ({
      id: String(application._id),
      applicantId: String(application.applicantId),
      isTeam: application.isTeam,
      name: application.isTeam
        ? application.displayName
        : (names.get(String(application.applicantId)) ?? application.displayName),
      fields: application.fields.map((field) => ({ label: field.label, input: field.input })),
      createdAt: application.createdAt,
    })),
    acceptedUsers: tournament.acceptedUsers,
    acceptedTeams: tournament.acceptedTeams,
    attention: attentionSummary(tournament),
  }
}

/** The ids of every team the viewer is on, or an empty set for a guest. */
async function teamIdsFor(userId) {
  if (!userId) return new Set()
  const teams = await Team.find({ members: userId }).select('_id').lean()
  return new Set(teams.map((team) => String(team._id)))
}

/**
 * True when the viewer — or a team they are on — already has an application in
 * this tournament's queue. An application is filed under the team id when it is
 * a team entry, so checking the user id alone would always say no.
 */
function hasApplied(tournament, userId, teamIds) {
  return tournament.applications.some((application) => {
    const applicant = String(application.applicantId)
    return application.isTeam ? teamIds.has(applicant) : applicant === userId
  })
}

function isAccepted(tournament, userId, teamIds) {
  return (
    tournament.acceptedUsers.some((accepted) => String(accepted) === userId) ||
    tournament.acceptedTeams.some((accepted) => teamIds.has(String(accepted)))
  )
}
