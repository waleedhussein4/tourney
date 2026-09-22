import mongoose from 'mongoose'
import Tournament, { buildBracketMatches } from '../../models/tournament.model.js'
import Team from '../../models/team.model.js'
import User from '../../models/user.model.js'
import { LIMITS, PAGE_SIZE } from '../../config/constants.js'
import { UNPUBLISHED } from '../../config/publishStates.js'
import { assertMayPublish } from '../subscriptions/subscription.service.js'
import { ApiError } from '../../utils/ApiError.js'
import { sanitizeRichText, toPlainText } from '../../utils/text.js'
import {
  notifyApplicationDecided,
  notifyMatchScheduled,
  notifyParticipantRemoved,
  notifyResultConfirmed,
  notifyResultDisputed,
  notifyResultResolved,
  notifyTournamentEnded,
  notifyTournamentPublished,
  notifyWaitlistPromoted,
  participantUserIds,
} from '../notifications/notification.service.js'
import { recordModeration } from '../admin/moderation.service.js'
import { createReport } from '../admin/report.service.js'

/**
 * Runs `work` against a freshly-loaded tournament inside a transaction, then
 * saves it.
 *
 * Every join/withdraw touches `maxCapacity` bookkeeping, so two people racing
 * for the same last slot must not both get it. `session.withTransaction`
 * re-runs `work` from a fresh read on a write conflict — a real one, from the
 * replica set, not a comment promising it is safe — so the loser of the race
 * always sees the post-winner state before it decides what to do.
 */
async function withCapacityLock(tournamentId, work) {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      const tournament = await loadTournament(tournamentId, session)
      result = await work(tournament, session)
      await tournament.save({ session })
    })
    return result
  } finally {
    await session.endSession()
  }
}

// --- loading ----------------------------------------------------------------

/** Loads a tournament or fails with a 404. */
export async function loadTournament(tournamentId, session) {
  const tournament = await Tournament.findById(tournamentId).session(session ?? null)
  if (!tournament) throw ApiError.notFound('Tournament not found')
  return tournament
}

/**
 * Loads a tournament for someone to look at.
 *
 * Until it is published a tournament is visible only to its host. Everyone else
 * gets the same 404 a made-up id would, so the response does not confirm that an
 * unpublished tournament exists.
 */
export async function loadVisible(tournamentId, viewerId) {
  const tournament = await loadTournament(tournamentId)
  if (!tournament.isPublished && !tournament.isHostedBy(viewerId)) {
    throw ApiError.notFound('Tournament not found')
  }
  return tournament
}

/** Loads a tournament the caller hosts, or fails with a 404 / 403. */
export async function loadAsHost(tournamentId, userId, session) {
  const tournament = await loadTournament(tournamentId, session)
  if (!tournament.isHostedBy(userId)) {
    throw ApiError.forbidden('Only the tournament host can do that')
  }
  return tournament
}

// --- creating ---------------------------------------------------------------

/**
 * Creates a tournament.
 *
 * One code path for all four shapes. The original had four near-identical
 * `Tournament.create` blocks — brackets/battle-royale × solo/team — which is how
 * they drifted apart on `maxCapacity` and on which fields were even set.
 */
export async function createTournament(hostId, input) {
  const host = await User.findById(hostId).select('isHost')
  if (!host?.isHost) throw ApiError.forbidden('Only hosts can create tournaments')

  const description = sanitizeRichText(input.description)
  const rules = sanitizeRichText(input.rules)

  assertPlainTextFits(description, LIMITS.description, 'Description')
  assertPlainTextFits(rules, LIMITS.rules, 'Rules')

  const applicationForm =
    input.accessibility === 'application required' ? input.applicationForm : []

  return Tournament.create({
    host: hostId,
    publishState: 'draft',
    title: input.title,
    type: input.type,
    category: input.category,
    accessibility: input.accessibility,
    teamSize: input.teamSize,
    maxCapacity: input.maxCapacity,
    startDate: input.startDate,
    endDate: input.endDate,
    description,
    rules,
    contactInfo: input.contactInfo,
    applicationForm,
    // A bracket has a fixed number of match slots from the moment it exists.
    // Participants are not known yet — the draw has not happened — so every
    // match starts empty; `drawBracket` fills in round 1 once it has.
    matches: input.type === 'brackets' ? buildBracketMatches(input.maxCapacity) : [],
  })
}

function assertPlainTextFits(html, limit, label) {
  const length = toPlainText(html).length
  if (length > limit) {
    throw ApiError.badRequest(`${label} is ${length} characters — the limit is ${limit}`)
  }
}

// --- reading ----------------------------------------------------------------

/**
 * One list endpoint: pagination, filters, and search in a single query the
 * database can plan.
 *
 * The original ran a separate `getPaginatedTournaments` and
 * `getFilteredTournaments`, and the latter loaded every tournament in the
 * database to score it against a hand-written Jaro-Winkler implementation before
 * paginating the result in memory.
 */
export async function listTournaments(query) {
  const filter = buildFilter(query)
  const limit = query.limit ?? PAGE_SIZE.default
  const page = query.page ?? 1

  const [tournaments, total] = await Promise.all([
    Tournament.find(filter)
      .sort(query.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Tournament.countDocuments(filter),
  ])

  return {
    tournaments,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  }
}

function buildFilter(query) {
  // Browse is for tournaments that are live to the public, whatever else is
  // asked. `$nin` also matches a document with no `publishState` field, which
  // is how everything written before this feature stays visible.
  const filter = { publishState: { $nin: UNPUBLISHED } }

  if (query.search) filter.$text = { $search: query.search }
  if (query.category) filter.category = query.category
  if (query.type) filter.type = query.type
  if (query.accessibility) filter.accessibility = query.accessibility

  if (query.status === 'upcoming') Object.assign(filter, { hasStarted: false })
  if (query.status === 'live') Object.assign(filter, { hasStarted: true, hasEnded: false })
  if (query.status === 'ended') Object.assign(filter, { hasEnded: true })

  return filter
}

/**
 * The carousel: open tournaments that have not started, the fullest first.
 *
 * The original shuffled every tournament in the database in memory on every
 * request, which meant "trending" changed on refresh and got slower as the app
 * got more popular.
 */
export async function listTrending(limit) {
  return Tournament.aggregate([
    { $match: { publishState: { $nin: UNPUBLISHED }, hasStarted: false, hasEnded: false } },
    {
      $addFields: {
        _entrants: { $add: [{ $size: '$enrolledUsers' }, { $size: '$enrolledTeams' }] },
      },
    },
    { $sort: { _entrants: -1, createdAt: -1 } },
    { $limit: limit },
    { $unset: '_entrants' },
  ]).then((docs) => docs.map((doc) => Tournament.hydrate(doc)))
}

/** Everything the user hosts or competes in. A host sees their own drafts here. */
export async function listMine(userId) {
  return Tournament.find({
    $or: [
      { host: userId },
      { 'enrolledUsers.userId': userId },
      { 'enrolledTeams.members.userId': userId },
    ],
  }).sort({ createdAt: -1 })
}

/**
 * Puts a draft in front of people.
 *
 * The only thing standing between a host and a published tournament is how many
 * they already have live — see `assertMayPublish`. There is no payment step
 * here: the subscription is bought once, on the billing page, and this reads it.
 */
export async function publishTournament(tournamentId, hostId) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (tournament.isPublished) throw ApiError.conflict('This tournament is already published')

  await assertMayPublish(hostId)

  tournament.publishState = 'published'
  await tournament.save()
  await notifyTournamentPublished(tournament)
  return tournament
}

/** Takes a tournament back out of public view. Only before it starts. */
export async function unpublishTournament(tournamentId, hostId) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (!tournament.isPublished) throw ApiError.conflict('This tournament is not published')
  if (tournament.hasStarted) {
    throw ApiError.badRequest('A tournament that has started cannot be hidden')
  }

  tournament.publishState = 'draft'
  await tournament.save()
  return tournament
}

// --- host edits -------------------------------------------------------------

/** Applies a host's edits. Only fields the host may still change get through. */
export async function updateTournament(tournamentId, hostId, patch) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (tournament.hasStarted) {
    throw ApiError.badRequest('A tournament that has started can no longer be edited')
  }

  if (patch.title !== undefined) tournament.title = patch.title
  if (patch.contactInfo !== undefined) tournament.contactInfo = patch.contactInfo

  if (patch.description !== undefined) {
    tournament.description = sanitizeRichText(patch.description)
    assertPlainTextFits(tournament.description, LIMITS.description, 'Description')
  }
  if (patch.rules !== undefined) {
    tournament.rules = sanitizeRichText(patch.rules)
    assertPlainTextFits(tournament.rules, LIMITS.rules, 'Rules')
  }

  if (patch.startDate !== undefined) tournament.startDate = patch.startDate
  if (patch.endDate !== undefined) tournament.endDate = patch.endDate
  if (tournament.endDate <= tournament.startDate) {
    throw ApiError.badRequest('The end must be after the start')
  }

  await tournament.save()
  return tournament
}

/** Appends an update to the public timeline. Host only. */
export async function postUpdate(tournamentId, hostId, content) {
  const tournament = await loadAsHost(tournamentId, hostId)
  tournament.updates.push({ date: new Date(), content: toPlainText(content) })
  await tournament.save()
  return tournament
}

/**
 * Cancels a tournament.
 *
 * Only before it starts — once people are playing, there is a result to record
 * instead.
 */
export async function deleteTournament(tournamentId, hostId) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (tournament.hasStarted) {
    throw ApiError.badRequest('A tournament that has started cannot be cancelled')
  }

  await Tournament.deleteOne({ _id: tournament._id })
  return { entrants: tournament.participantCount() }
}

// --- joining ----------------------------------------------------------------

/**
 * Loads a tournament for someone trying to get into it.
 *
 * Checked at the door, before any other rule gets to answer: to a would-be
 * entrant an unpublished tournament does not exist, and a 400 about team sizes
 * or application forms would say otherwise.
 */
async function loadForEntry(tournamentId, userId, session) {
  const tournament = await loadTournament(tournamentId, session)
  assertVisibleForEntry(tournament, userId)
  return tournament
}

/** An unpublished tournament does not exist to anyone but its host. */
function assertVisibleForEntry(tournament, userId) {
  if (tournament.isPublished) return
  if (tournament.isHostedBy(userId)) {
    throw ApiError.badRequest('This tournament has not been published yet')
  }
  throw ApiError.notFound('Tournament not found')
}

/** Whether every slot — enrolled, not waitlisted — is taken. */
function isFull(tournament) {
  return tournament.participantCount() >= tournament.maxCapacity
}

/** The checks that apply however a participant gets in, full or not. */
function assertJoinable(tournament, userId) {
  assertVisibleForEntry(tournament, userId)
  if (tournament.hasStarted) throw ApiError.badRequest('This tournament has already started')
  if (tournament.isHostedBy(userId)) {
    throw ApiError.badRequest('A host cannot compete in their own tournament')
  }
  if (tournament.hasParticipant(userId)) {
    throw ApiError.conflict('You are already in this tournament')
  }
  if (isWaitlisted(tournament, userId)) {
    throw ApiError.conflict('You are already on the waitlist')
  }
}

/** True when this user — directly, or through a team — has a waitlist entry. */
function isWaitlisted(tournament, userId) {
  const id = String(userId)
  return tournament.waitlist.some((entry) =>
    entry.isTeam
      ? entry.members.some((member) => String(member.userId) === id)
      : entry.userId === id
  )
}

/**
 * Enters a solo tournament — or, once it is full, joins the waitlist for one.
 *
 * Wrapped in a transaction: two people racing for the last slot must not both
 * get it. Whichever request's write loses the race re-reads inside its retry
 * and finds the tournament full, so it waitlists instead of erroring.
 */
export async function joinSolo(tournamentId, userId) {
  return withCapacityLock(tournamentId, async (tournament) => {
    if (tournament.isTeamBased) throw ApiError.badRequest('This tournament is played in teams')
    assertJoinable(tournament, userId)

    if (tournament.accessibility === 'application required') {
      const accepted = tournament.acceptedUsers.some((id) => String(id) === String(userId))
      if (!accepted) throw ApiError.forbidden('Your application has not been accepted yet')
    }

    if (isFull(tournament)) {
      tournament.waitlist.push({ isTeam: false, userId: String(userId) })
    } else {
      tournament.enrolledUsers.push({ userId, score: 0, eliminated: false })
      tournament.acceptedUsers = tournament.acceptedUsers.filter(
        (id) => String(id) !== String(userId)
      )
    }

    return tournament
  })
}

/**
 * Enters a team tournament — or waitlists the team once it is full.
 *
 * The leader enters on the team's behalf; whatever the host charges for a team
 * is settled between them.
 */
export async function joinTeam(tournamentId, userId, teamId) {
  const team = await Team.findById(teamId)
  if (!team) throw ApiError.notFound('Team not found')
  if (!team.isLeader(userId)) throw ApiError.forbidden('Only the team leader can enter the team')

  return withCapacityLock(tournamentId, async (tournament) => {
    if (!tournament.isTeamBased) throw ApiError.badRequest('This tournament is played solo')
    if (team.members.length !== tournament.teamSize) {
      throw ApiError.badRequest(
        `This tournament needs teams of exactly ${tournament.teamSize} — yours has ${team.members.length}`
      )
    }

    assertJoinable(tournament, userId)
    if (tournament.enrolledTeams.some((entry) => String(entry.teamId) === String(team._id))) {
      throw ApiError.conflict('This team is already in the tournament')
    }
    for (const member of team.members) {
      if (tournament.hasParticipant(member)) {
        throw ApiError.conflict('One of your teammates is already in this tournament')
      }
    }

    if (tournament.accessibility === 'application required') {
      const accepted = tournament.acceptedTeams.some((id) => String(id) === String(team._id))
      if (!accepted) throw ApiError.forbidden('Your application has not been accepted yet')
    }

    const members = team.members.map((member) => ({
      userId: String(member),
      score: 0,
      eliminated: false,
    }))

    if (isFull(tournament)) {
      tournament.waitlist.push({
        isTeam: true,
        teamId: String(team._id),
        teamName: team.name,
        members,
      })
    } else {
      tournament.enrolledTeams.push({ teamId: String(team._id), teamName: team.name, members })
      tournament.acceptedTeams = tournament.acceptedTeams.filter(
        (id) => String(id) !== String(team._id)
      )
    }

    return tournament
  })
}

// --- withdrawing --------------------------------------------------------------

/** This user's own enrolment — directly, or through their team — or null. */
function findMyEntry(tournament, userId) {
  const id = String(userId)
  const userEntry = tournament.enrolledUsers.find((entry) => String(entry.userId) === id)
  if (userEntry) return { isTeam: false, entry: userEntry }

  const teamEntry = tournament.enrolledTeams.find((team) =>
    team.members.some((member) => String(member.userId) === id)
  )
  if (teamEntry) return { isTeam: true, entry: teamEntry }

  return null
}

/** Promotes the longest-waiting waitlist entry into the slot a withdrawal just opened. */
function promoteFromWaitlist(tournament) {
  const promoted = tournament.waitlist.shift()
  if (!promoted) return null

  if (promoted.isTeam) {
    tournament.enrolledTeams.push({
      teamId: promoted.teamId,
      teamName: promoted.teamName,
      members: promoted.members.map((member) => ({ userId: member.userId, score: 0 })),
    })
  } else {
    tournament.enrolledUsers.push({ userId: promoted.userId, score: 0, eliminated: false })
  }

  return promoted
}

/**
 * Forfeits every one of this entrant's matches that has not already been
 * finalized — their opponent advances instead. A `final` match is left
 * exactly as played: the record of what happened stays intact.
 */
function forfeitMatches(tournament, participantId) {
  const id = String(participantId)
  for (const match of tournament.matches) {
    if (match.state === 'final') continue
    if (!match.participants.some((entry) => String(entry) === id)) continue

    const opponent = match.participants.find((entry) => entry && String(entry) !== id) ?? null
    if (!opponent) continue

    match.winner = opponent
    match.state = 'final'
    match.reportedBy = null
    match.confirmedBy = null
    advanceWinner(tournament, match, opponent)
  }
}

/**
 * Withdraws the caller from a tournament they are in.
 *
 * Before the tournament starts, the slot reopens outright and the
 * longest-waiting waitlist entry is promoted into it. After it starts, the
 * bracket tree is already fixed — instead of tearing a hole in it, the
 * entrant is marked withdrawn and forfeits whatever matches have not already
 * been finalized, so their opponent advances.
 */
export async function withdraw(tournamentId, userId) {
  const { tournament, promoted } = await withCapacityLock(tournamentId, async (tournament) => {
    if (tournament.hasEnded) throw ApiError.badRequest('This tournament has already ended')

    const found = findMyEntry(tournament, userId)
    if (!found) throw ApiError.badRequest('You are not in this tournament')
    const { isTeam, entry } = found

    if (!tournament.hasStarted) {
      if (isTeam) {
        tournament.enrolledTeams = tournament.enrolledTeams.filter(
          (team) => String(team.teamId) !== String(entry.teamId)
        )
      } else {
        tournament.enrolledUsers = tournament.enrolledUsers.filter(
          (user) => String(user.userId) !== String(entry.userId)
        )
      }
      return { tournament, promoted: promoteFromWaitlist(tournament) }
    }

    const participantId = isTeam ? String(entry.teamId) : String(entry.userId)
    entry.withdrawn = true
    entry.eliminated = true
    if (tournament.type === 'brackets') forfeitMatches(tournament, participantId)

    return { tournament, promoted: null }
  })

  if (promoted) await notifyWaitlistPromoted(tournament, promoted)
  return tournament
}

// --- applications -----------------------------------------------------------

/** Files an application against the host's form. */
export async function apply(tournamentId, userId, { teamId, fields }) {
  const tournament = await loadForEntry(tournamentId, userId)

  if (tournament.accessibility !== 'application required') {
    throw ApiError.badRequest('This tournament is open — join it directly')
  }
  assertJoinable(tournament, userId)
  if (isFull(tournament)) throw ApiError.conflict('This tournament is full')

  let applicantId = String(userId)
  let displayName = null
  let isTeam = false

  if (tournament.isTeamBased) {
    if (!teamId) throw ApiError.badRequest('Choose a team to apply with')
    const team = await Team.findById(teamId)
    if (!team) throw ApiError.notFound('Team not found')
    if (!team.isLeader(userId)) throw ApiError.forbidden('Only the team leader can apply')
    if (team.members.length !== tournament.teamSize) {
      throw ApiError.badRequest(`This tournament needs teams of exactly ${tournament.teamSize}`)
    }
    applicantId = String(team._id)
    displayName = team.name
    isTeam = true
  } else {
    if (teamId) throw ApiError.badRequest('This tournament is played solo')
    const user = await User.findById(userId).select('username').lean()
    displayName = user?.username ?? 'Unknown'
  }

  if (tournament.applications.some((entry) => String(entry.applicantId) === applicantId)) {
    throw ApiError.conflict('You have already applied to this tournament')
  }

  // The answers must line up with the questions the host actually asked — same
  // number, same labels, in the same order, none of them blank.
  const expected = tournament.applicationForm
  if (fields.length !== expected.length) {
    throw ApiError.badRequest('Answer every question on the application form')
  }
  fields.forEach((field, index) => {
    if (field.label !== expected[index]) {
      throw ApiError.badRequest('The application form has changed — reload the page and try again')
    }
  })

  tournament.applications.push({
    applicantId,
    isTeam,
    displayName,
    fields: fields.map((field) => ({ label: field.label, input: toPlainText(field.input) })),
  })
  await tournament.save()

  return tournament
}

/**
 * Accepts an application, which reserves a slot.
 *
 * Accepting counts against capacity — the original did not check, so a host
 * could accept more applicants than the tournament had room for and the last of
 * them would be turned away at the door.
 */
export async function acceptApplication(tournamentId, hostId, applicationId) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (tournament.hasStarted) throw ApiError.badRequest('This tournament has already started')

  const application = tournament.applications.id(applicationId)
  if (!application) throw ApiError.notFound('Application not found')

  const reserved = tournament.acceptedUsers.length + tournament.acceptedTeams.length
  if (tournament.participantCount() + reserved >= tournament.maxCapacity) {
    throw ApiError.conflict('Every slot is taken or already promised to an accepted applicant')
  }

  if (application.isTeam) tournament.acceptedTeams.push(String(application.applicantId))
  else tournament.acceptedUsers.push(String(application.applicantId))

  tournament.applications.pull({ _id: applicationId })
  await tournament.save()
  await notifyApplicationDecided(tournament, application, true)

  return tournament
}

export async function rejectApplication(tournamentId, hostId, applicationId) {
  const tournament = await loadAsHost(tournamentId, hostId)

  const application = tournament.applications.id(applicationId)
  if (!application) throw ApiError.notFound('Application not found')

  tournament.applications.pull({ _id: applicationId })
  await tournament.save()
  await notifyApplicationDecided(tournament, application, false)

  return tournament
}

// --- lifecycle --------------------------------------------------------------

/**
 * Draws the bracket.
 *
 * The order is stored in `bracketOrder` — the enrolment array is never padded
 * with placeholders — and can be redrawn until the tournament starts.
 */
export async function shuffleBrackets(tournamentId, hostId) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (tournament.type !== 'brackets') throw ApiError.badRequest('This is not a bracket tournament')
  if (tournament.hasStarted) throw ApiError.badRequest('This tournament has already started')

  drawBracket(tournament)
  await tournament.save()

  return tournament
}

/** Fisher–Yates over the participants, padded out to the number of slots. */
function drawBracket(tournament) {
  const slots = new Array(tournament.maxCapacity).fill(null)
  const ids = tournament.participantIds()

  for (let index = ids.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[ids[index], ids[swap]] = [ids[swap], ids[index]]
  }
  ids.forEach((id, index) => {
    slots[index] = id
  })

  tournament.bracketOrder = slots
  tournament.bracketsShuffled = true

  // Round 1's matches now have real competitors — pair up consecutive
  // bracket-order entries into each round-1 match's `participants`. Later
  // rounds stay empty until the round that feeds them reports its winners.
  for (const match of tournament.matches) {
    if (match.round !== 1) continue
    match.participants = [slots[match.slot * 2] ?? null, slots[match.slot * 2 + 1] ?? null]
  }
}

/**
 * Starts the tournament.
 *
 * Entries close and the draw is locked. What it takes is a full bracket, or two
 * entrants for a battle royale.
 */
export async function startTournament(tournamentId, hostId) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (tournament.hasStarted) throw ApiError.badRequest('This tournament has already started')
  if (tournament.hasEnded) throw ApiError.badRequest('This tournament has already ended')
  if (!tournament.isPublished) {
    throw ApiError.badRequest('Publish this tournament before starting it')
  }

  const count = tournament.participantCount()
  if (tournament.type === 'brackets') {
    if (count !== tournament.maxCapacity) {
      throw ApiError.badRequest(
        `A bracket starts when every slot is filled — ${count} of ${tournament.maxCapacity} so far`
      )
    }
  } else if (count < 2) {
    throw ApiError.badRequest('A tournament needs at least two participants')
  }

  // A bracket has to be drawn before it can be played. If the host never hit
  // "shuffle", draw it now rather than starting a tournament with no pairings.
  if (tournament.type === 'brackets' && !tournament.bracketsShuffled) drawBracket(tournament)

  tournament.hasStarted = true
  await tournament.save()
  return tournament
}

/**
 * Writes a winner into the next round's match, in this match's slot position —
 * the tree-walk both the host override and a confirmed report rely on.
 */
function advanceWinner(tournament, match, winner) {
  const next = tournament.matches.find(
    (entry) => entry.round === match.round + 1 && entry.slot === Math.floor(match.slot / 2)
  )
  if (!next) return
  const position = match.slot % 2
  const participants = [...next.participants]
  participants[position] = winner
  next.participants = participants
}

/**
 * Records match winners.
 *
 * Every winner must be a participant in *this* tournament — the original looked
 * the name up in the users or teams collection globally, so any username on the
 * site was accepted as the winner of any match.
 *
 * This is the host's direct override, distinct from the two-sided report/confirm
 * flow below. It is recorded as one: `reportedBy` and `confirmedBy` are both set
 * to the host's id. A host can never be a competitor in their own tournament
 * (`assertJoinable` forbids it), so `confirmedBy === tournament.host` is an
 * unambiguous "the host imposed this" marker — no extra schema field needed.
 */
export async function updateMatches(tournamentId, hostId, matches) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (tournament.type !== 'brackets') throw ApiError.badRequest('This is not a bracket tournament')
  if (!tournament.hasStarted) throw ApiError.badRequest('This tournament has not started')
  if (tournament.hasEnded) throw ApiError.badRequest('This tournament has already ended')

  const expected = tournament.maxCapacity - 1
  if (matches.length !== expected) {
    throw ApiError.badRequest(
      `A ${tournament.maxCapacity}-slot bracket has exactly ${expected} matches`
    )
  }

  for (const { id, winner } of matches) {
    const match = tournament.matches.find((entry) => entry.id === id)
    if (!match) throw ApiError.badRequest(`${id} is not a match in this tournament`)

    // The winner must be one of THAT match's own two competitors — stronger
    // than just "competing somewhere in this tournament", and it is what
    // actually stops the old bug (any site username accepted as any winner).
    if (winner !== null && !match.participants.includes(String(winner))) {
      throw ApiError.badRequest("A match winner must be one of that match's own competitors")
    }

    match.winner = winner
    match.state = winner ? 'final' : 'pending'
    match.reportedBy = winner ? String(hostId) : null
    match.confirmedBy = winner ? String(hostId) : null

    if (winner) advanceWinner(tournament, match, winner)
  }

  await tournament.save()
  return tournament
}

/**
 * Sets when matches are played — one call for a single match or a whole round.
 *
 * A time must fall within the tournament's own `startDate`/`endDate` window.
 * A time in the past is rejected only when the match had no `scheduledAt` yet;
 * editing an already-scheduled match is allowed to move it into the past,
 * since a host fixing a mistake after the fact is normal. Setting a time
 * moves a `pending` match to `scheduled` but never overwrites the state of a
 * match that has already been reported, disputed, or finalized.
 */
export async function scheduleMatches(tournamentId, hostId, matches) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (tournament.type !== 'brackets') throw ApiError.badRequest('This is not a bracket tournament')

  const scheduled = []
  for (const { id, scheduledAt } of matches) {
    const match = tournament.matches.find((entry) => entry.id === id)
    if (!match) throw ApiError.badRequest(`${id} is not a match in this tournament`)

    if (scheduledAt < tournament.startDate || scheduledAt > tournament.endDate) {
      throw ApiError.badRequest('The match time must fall within the tournament dates')
    }
    if (!match.scheduledAt && scheduledAt < new Date()) {
      throw ApiError.badRequest('The match time cannot be in the past')
    }

    match.scheduledAt = scheduledAt
    if (match.state === 'pending') match.state = 'scheduled'
    scheduled.push(match)
  }

  await tournament.save()
  for (const match of scheduled) {
    await notifyMatchScheduled(tournament, match)
  }
  return tournament
}

/** The participant id (a user id or a team id) `userId` competes under in `match`, or null. */
function competitorIdFor(tournament, match, userId) {
  const id = String(userId)
  return (
    match.participants.find((participantId) => {
      if (!participantId) return false
      if (!tournament.isTeamBased) return String(participantId) === id
      const team = tournament.enrolledTeams.find(
        (entry) => String(entry.teamId) === String(participantId)
      )
      return Boolean(team?.members.some((member) => String(member.userId) === id))
    }) ?? null
  )
}

/** Scores in participant order, and the winner they imply. Ties are rejected. */
function deriveResult(match, scores) {
  const ordered = match.participants.map((participantId) => {
    const entry = scores.find((score) => String(score.participantId) === String(participantId))
    if (!entry) throw ApiError.badRequest('Report a score for every competitor in this match')
    return entry.score
  })
  if (ordered[0] === ordered[1]) {
    throw ApiError.badRequest('Scores cannot be tied — there must be a winner')
  }
  const winner = ordered[0] > ordered[1] ? match.participants[0] : match.participants[1]
  return { ordered, winner }
}

/** The checks shared by reporting and confirming a match result. */
function loadReportableMatch(tournament, matchId) {
  if (tournament.type !== 'brackets') throw ApiError.badRequest('This is not a bracket tournament')
  if (!tournament.hasStarted) throw ApiError.badRequest('This tournament has not started')
  if (tournament.hasEnded) throw ApiError.badRequest('This tournament has already ended')

  const match = tournament.matches.find((entry) => entry.id === matchId)
  if (!match) throw ApiError.notFound('Match not found')
  return match
}

/**
 * A competitor — or the host, standing in for one — reports a match's scores.
 *
 * The winner is derived from the scores, not taken on trust: whichever
 * competitor's score is higher wins. The match becomes `reported`, not
 * `final` — it still needs the other side to confirm before its winner is
 * allowed to advance (`advanceWinner` is not called here).
 *
 * A team competes as one entrant, so any of its members may file the report on
 * the team's behalf — checked via `enrolledTeams[].members`, the same roster
 * `hasParticipant` and `competitorIdFor` read from.
 */
export async function reportMatch(tournamentId, userId, matchId, scores) {
  const tournament = await loadTournament(tournamentId)
  const match = loadReportableMatch(tournament, matchId)

  if (match.state === 'final') {
    throw ApiError.badRequest('This match has already been finalized')
  }
  if (match.participants.includes(null)) {
    throw ApiError.badRequest(
      'This match is not ready to report yet — the previous round has not finished'
    )
  }

  const isHost = tournament.isHostedBy(userId)
  if (!isHost && !competitorIdFor(tournament, match, userId)) {
    throw ApiError.forbidden('You are not a competitor in this match')
  }

  const { ordered, winner } = deriveResult(match, scores)

  match.scores = ordered
  match.winner = winner
  match.state = 'reported'
  match.reportedBy = String(userId)
  match.confirmedBy = null

  await tournament.save()
  return tournament
}

/**
 * The other competitor confirms — or disputes — a reported result.
 *
 * Confirming finalizes the match and lets its winner advance. Disputing
 * records the disagreement but leaves the winner in place without advancing
 * it — only a `final` match ever feeds the next round.
 */
export async function confirmMatch(tournamentId, userId, matchId, agree) {
  const tournament = await loadTournament(tournamentId)
  const match = loadReportableMatch(tournament, matchId)

  if (match.state !== 'reported') {
    throw ApiError.badRequest('This match is not awaiting confirmation')
  }
  if (!competitorIdFor(tournament, match, userId)) {
    throw ApiError.forbidden('You are not a competitor in this match')
  }
  if (String(match.reportedBy) === String(userId)) {
    throw ApiError.badRequest('You reported this result — the other competitor must confirm it')
  }

  match.confirmedBy = String(userId)
  if (agree) {
    match.state = 'final'
    advanceWinner(tournament, match, match.winner)
  } else {
    match.state = 'disputed'
  }

  await tournament.save()
  if (agree) await notifyResultConfirmed(tournament, match)
  else await notifyResultDisputed(tournament, match)
  return tournament
}

/**
 * The host's final call on a disputed match, once the two sides can't agree.
 *
 * Only a `disputed` match can be resolved this way. `confirmedBy` is set to
 * the host's id — the same "host imposed this" marker `updateMatches` uses —
 * so a resolved dispute stays visibly distinct from a result the competitors
 * actually agreed on, while `reportedBy` keeps whichever competitor filed the
 * original report.
 */
export async function resolveMatch(tournamentId, hostId, matchId, scores) {
  const tournament = await loadAsHost(tournamentId, hostId)
  const match = loadReportableMatch(tournament, matchId)

  if (match.state !== 'disputed') {
    throw ApiError.badRequest('This match is not disputed')
  }

  const { ordered, winner } = deriveResult(match, scores)

  match.scores = ordered
  match.winner = winner
  match.state = 'final'
  match.confirmedBy = String(hostId)
  advanceWinner(tournament, match, winner)

  await tournament.save()
  await notifyResultResolved(tournament, match)
  return tournament
}

/**
 * Host edits to scores and eliminations, for both formats and both shapes.
 *
 * Replaces the original `updateScores`, which referenced an undefined
 * `tournament` on its first line and threw a ReferenceError on every call.
 */
export async function updateParticipants(tournamentId, hostId, updates) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (!tournament.hasStarted) throw ApiError.badRequest('This tournament has not started')
  if (tournament.hasEnded) throw ApiError.badRequest('This tournament has already ended')

  for (const update of updates) {
    const participant = tournament
      .participants()
      .find((entry) => tournament.participantId(entry) === update.id)
    if (!participant) throw ApiError.badRequest(`${update.id} is not in this tournament`)

    if (update.score !== undefined) participant.score = update.score
    if (update.eliminated !== undefined) participant.eliminated = update.eliminated

    for (const memberUpdate of update.members ?? []) {
      const member = participant.members?.find(
        (entry) => String(entry.userId) === String(memberUpdate.id)
      )
      if (!member) throw ApiError.badRequest(`${memberUpdate.id} is not on that team`)
      if (memberUpdate.score !== undefined) member.score = memberUpdate.score
      if (memberUpdate.eliminated !== undefined) member.eliminated = memberUpdate.eliminated
    }
  }

  await tournament.save()
  return tournament
}

/** Marks a participant eliminated in place, whichever shape the tournament is. */
function markEliminated(tournament, participantId) {
  const participant = tournament
    .participants()
    .find((entry) => tournament.participantId(entry) === participantId)
  if (participant) participant.eliminated = true
}

/**
 * The host removes a participant from their own tournament, with a reason.
 *
 * Before the tournament starts this frees the slot outright — the entry is
 * gone, like they never joined. Once it has started, removing the row would
 * corrupt the bracket (a next-round match pointing at a competitor who no
 * longer exists) or erase history a battle-royale standings page still needs,
 * so the participant instead forfeits: every one of their bracket matches that
 * has not already been finalized is awarded to whoever they were playing
 * (recorded as the host's call, the same `reportedBy`/`confirmedBy` marker
 * `updateMatches` uses), and they are marked eliminated rather than deleted.
 */
export async function removeParticipant(tournamentId, hostId, participantId, reason) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (tournament.hasEnded) {
    throw ApiError.badRequest('This tournament has already ended')
  }
  const id = String(participantId)

  if (!tournament.participantIds().includes(id)) {
    throw ApiError.notFound('That participant is not in this tournament')
  }

  const recipients = participantUserIds(tournament, id)

  if (!tournament.hasStarted) {
    tournament.enrolledUsers = tournament.enrolledUsers.filter(
      (entry) => String(entry.userId) !== id
    )
    tournament.enrolledTeams = tournament.enrolledTeams.filter(
      (entry) => String(entry.teamId) !== id
    )
  } else {
    if (tournament.type === 'brackets') {
      for (const match of tournament.matches) {
        if (match.state === 'final' || !match.participants.includes(id)) continue
        const opponent = match.participants.find((entry) => entry && entry !== id) ?? null
        if (!opponent) continue
        match.winner = opponent
        match.state = 'final'
        match.reportedBy = String(hostId)
        match.confirmedBy = String(hostId)
        advanceWinner(tournament, match, opponent)
      }
    }
    markEliminated(tournament, id)
  }

  await tournament.save()

  await recordModeration({
    actor: hostId,
    action: 'participant_removed',
    targetType: 'tournament',
    targetId: tournament._id,
    reason,
  })
  await notifyParticipantRemoved(tournament, recipients, reason)

  return tournament
}

/** Files a report against this tournament, for the admin queue. */
export async function reportTournament(tournamentId, reporterId, reason) {
  const tournament = await loadVisible(tournamentId, reporterId)
  return createReport({
    reporterId,
    targetType: 'tournament',
    targetId: tournament._id,
    reason,
  })
}

/** How many finishers the results screen shows for a battle royale. */
const RESULTS_DEPTH = 3

/**
 * Ends the tournament.
 *
 * Records that it is over and who won.
 */
export async function endTournament(tournamentId, hostId) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (!tournament.hasStarted) throw ApiError.badRequest('This tournament has not started')
  if (tournament.hasEnded) throw ApiError.badRequest('This tournament has already ended')

  const final = tournament.matches[tournament.matches.length - 1]
  if (tournament.type === 'brackets' && !final?.winner) {
    throw ApiError.badRequest('Record the winner of the final before ending the tournament')
  }

  tournament.hasEnded = true
  await tournament.save()
  await notifyTournamentEnded(tournament)

  return { tournament, winners: winnersOf(tournament) }
}

/**
 * Who finished on top, for the results screen.
 *
 * A bracket has one winner — the last match's. A battle royale is ranked by
 * score, down to `RESULTS_DEPTH` places.
 */
function winnersOf(tournament) {
  if (tournament.type === 'brackets') {
    const champion = tournament.matches[tournament.matches.length - 1]?.winner
    return champion ? [{ rank: 1, id: String(champion) }] : []
  }

  const ranked = [...tournament.participants()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  return ranked
    .slice(0, RESULTS_DEPTH)
    .map((participant, index) => ({ rank: index + 1, id: tournament.participantId(participant) }))
}

// --- host attention ----------------------------------------------------------

/**
 * Everything about this tournament that needs the host to look at it: pending
 * applications, disputed matches, matches with both competitors set but no
 * time booked, results reported but not yet confirmed, and rounds that just
 * finished so the next one can be scheduled.
 *
 * Pure and synchronous — it walks the arrays already on a loaded tournament
 * (or a `.lean()` plain object shaped the same way), rather than issuing a
 * query per category. Works for both a single manage-page load and the
 * profile-wide summary, which fetches many tournaments with one indexed query
 * and calls this once per document.
 */
export function attentionSummary(tournament) {
  const disputedMatches = []
  const unscheduledMatches = []
  const awaitingConfirmation = []
  const matchesByRound = new Map()

  for (const match of tournament.matches) {
    if (!matchesByRound.has(match.round)) matchesByRound.set(match.round, [])
    matchesByRound.get(match.round).push(match)

    if (match.state === 'disputed') disputedMatches.push(String(match._id))
    if (match.state === 'reported') awaitingConfirmation.push(String(match._id))
    if (
      match.state === 'pending' &&
      !match.scheduledAt &&
      match.participants.filter(Boolean).length === 2
    ) {
      unscheduledMatches.push(String(match._id))
    }
  }

  const maxRound = matchesByRound.size ? Math.max(...matchesByRound.keys()) : 0
  const roundsReady = [...matchesByRound.entries()]
    .filter(([round, matches]) => round < maxRound && matches.every((m) => m.state === 'final'))
    .map(([round]) => round)
    .sort((a, b) => a - b)

  const pendingApplications = tournament.applications.length

  return {
    pendingApplications,
    disputedMatches,
    unscheduledMatches,
    awaitingConfirmation,
    roundsReady,
    total:
      pendingApplications +
      disputedMatches.length +
      unscheduledMatches.length +
      awaitingConfirmation.length +
      roundsReady.length,
  }
}
