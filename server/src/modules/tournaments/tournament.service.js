import Tournament, { buildBracketMatches } from '../../models/tournament.model.js'
import Team from '../../models/team.model.js'
import User from '../../models/user.model.js'
import { LIMITS, PAGE_SIZE } from '../../config/constants.js'
import { UNPUBLISHED } from '../../config/publishStates.js'
import { assertMayPublish } from '../subscriptions/subscription.service.js'
import { ApiError } from '../../utils/ApiError.js'
import { sanitizeRichText, toPlainText } from '../../utils/text.js'

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
  if (tournament.isPublished) return tournament
  if (tournament.isHostedBy(userId)) {
    throw ApiError.badRequest('This tournament has not been published yet')
  }
  throw ApiError.notFound('Tournament not found')
}

/** The checks that apply however a participant gets in. */
function assertJoinable(tournament, userId) {
  if (tournament.hasStarted) throw ApiError.badRequest('This tournament has already started')
  if (tournament.isHostedBy(userId)) {
    throw ApiError.badRequest('A host cannot compete in their own tournament')
  }
  if (tournament.participantCount() >= tournament.maxCapacity) {
    throw ApiError.conflict('This tournament is full')
  }
  if (tournament.hasParticipant(userId)) {
    throw ApiError.conflict('You are already in this tournament')
  }
}

/**
 * Enters a solo tournament.
 */
export async function joinSolo(tournamentId, userId) {
  const tournament = await loadForEntry(tournamentId, userId)
  if (tournament.isTeamBased) throw ApiError.badRequest('This tournament is played in teams')

  assertJoinable(tournament, userId)

  if (tournament.accessibility === 'application required') {
    const accepted = tournament.acceptedUsers.some((id) => String(id) === String(userId))
    if (!accepted) throw ApiError.forbidden('Your application has not been accepted yet')
  }

  tournament.enrolledUsers.push({ userId, score: 0, eliminated: false })
  tournament.acceptedUsers = tournament.acceptedUsers.filter((id) => String(id) !== String(userId))
  await tournament.save()

  return tournament
}

/**
 * Enters a team tournament.
 *
 * The leader enters on the team's behalf; whatever the host charges for a team
 * is settled between them.
 */
export async function joinTeam(tournamentId, userId, teamId) {
  {
    const tournament = await loadForEntry(tournamentId, userId)
    if (!tournament.isTeamBased) throw ApiError.badRequest('This tournament is played solo')

    const team = await Team.findById(teamId)
    if (!team) throw ApiError.notFound('Team not found')
    if (!team.isLeader(userId)) throw ApiError.forbidden('Only the team leader can enter the team')
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

    tournament.enrolledTeams.push({
      teamId: String(team._id),
      teamName: team.name,
      score: 0,
      eliminated: false,
      members: team.members.map((member) => ({
        userId: String(member),
        score: 0,
        eliminated: false,
      })),
    })
    tournament.acceptedTeams = tournament.acceptedTeams.filter(
      (id) => String(id) !== String(team._id)
    )
    await tournament.save()

    return tournament
  }
}

// --- applications -----------------------------------------------------------

/** Files an application against the host's form. */
export async function apply(tournamentId, userId, { teamId, fields }) {
  const tournament = await loadForEntry(tournamentId, userId)

  if (tournament.accessibility !== 'application required') {
    throw ApiError.badRequest('This tournament is open — join it directly')
  }
  assertJoinable(tournament, userId)

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

  return tournament
}

export async function rejectApplication(tournamentId, hostId, applicationId) {
  const tournament = await loadAsHost(tournamentId, hostId)

  const application = tournament.applications.id(applicationId)
  if (!application) throw ApiError.notFound('Application not found')

  tournament.applications.pull({ _id: applicationId })
  await tournament.save()

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

  const ordered = match.participants.map((participantId) => {
    const entry = scores.find((score) => String(score.participantId) === String(participantId))
    if (!entry) throw ApiError.badRequest('Report a score for every competitor in this match')
    return entry.score
  })
  if (ordered[0] === ordered[1]) {
    throw ApiError.badRequest('Scores cannot be tied — there must be a winner')
  }

  match.scores = ordered
  match.winner = ordered[0] > ordered[1] ? match.participants[0] : match.participants[1]
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
