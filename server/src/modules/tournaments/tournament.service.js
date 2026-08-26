import Tournament from '../../models/tournament.model.js'
import Team from '../../models/team.model.js'
import User from '../../models/user.model.js'
import { LIMITS, PAGE_SIZE } from '../../config/constants.js'
import { withTransaction } from '../../db/withTransaction.js'
import { ApiError } from '../../utils/ApiError.js'
import { sanitizeRichText, toPlainText } from '../../utils/text.js'
import {
  creditBank,
  creditUser,
  debitBank,
  debitUser,
  depositIntoBank,
  recordTransaction,
} from './bank.service.js'
import { payOutTournament } from './payout.service.js'

// --- loading ----------------------------------------------------------------

/** Loads a tournament or fails with a 404. */
export async function loadTournament(tournamentId, session) {
  const tournament = await Tournament.findById(tournamentId).session(session ?? null)
  if (!tournament) throw ApiError.notFound('Tournament not found')
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
    title: input.title,
    type: input.type,
    category: input.category,
    accessibility: input.accessibility,
    teamSize: input.teamSize,
    maxCapacity: input.maxCapacity,
    entryFee: input.entryFee,
    prize: input.type === 'brackets' ? input.prize : undefined,
    prizes: input.type === 'battle royale' ? input.prizes : undefined,
    startDate: input.startDate,
    endDate: input.endDate,
    description,
    rules,
    contactInfo: input.contactInfo,
    applicationForm,
    // A bracket has a fixed number of slots from the moment it exists.
    matches: input.type === 'brackets' ? new Array(input.maxCapacity - 1).fill(null) : [],
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
  const filter = {}

  if (query.search) filter.$text = { $search: query.search }
  if (query.category) filter.category = query.category
  if (query.type) filter.type = query.type
  if (query.accessibility) filter.accessibility = query.accessibility

  if (query.minEntryFee !== undefined || query.maxEntryFee !== undefined) {
    filter.entryFee = {}
    if (query.minEntryFee !== undefined) filter.entryFee.$gte = query.minEntryFee
    if (query.maxEntryFee !== undefined) filter.entryFee.$lte = query.maxEntryFee
  }

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
    { $match: { hasStarted: false, hasEnded: false } },
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

/** Everything the user hosts or competes in. */
export async function listMine(userId) {
  return Tournament.find({
    $or: [
      { host: userId },
      { 'enrolledUsers.userId': userId },
      { 'enrolledTeams.members.userId': userId },
    ],
  }).sort({ createdAt: -1 })
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
 * Cancels a tournament and refunds every entry fee.
 *
 * Only before it starts: once people are playing, the result is what the prizes
 * are for. Refunds and the host's own top-up all move inside one transaction, so
 * a cancelled tournament leaves the same total number of credits in the world as
 * it found.
 */
export async function deleteTournament(tournamentId, hostId) {
  return withTransaction(async (session) => {
    const tournament = await loadAsHost(tournamentId, hostId, session)
    if (tournament.hasStarted) {
      throw ApiError.badRequest('A tournament that has started cannot be cancelled')
    }

    const refunds = []
    for (const participant of tournament.participants()) {
      const payer = tournament.isTeamBased ? String(participant.paidBy) : String(participant.userId)
      const amount = tournament.entryCost
      if (amount <= 0) continue

      await debitBank(tournament._id, amount, session)
      await creditUser(payer, amount, session)
      await recordTransaction(
        {
          userId: payer,
          type: 'refund',
          amount,
          tournamentId: tournament._id,
          description: `Refund for cancelled "${tournament.title}"`,
        },
        session
      )
      refunds.push({ userId: payer, amount })
      tournament.bank -= amount
    }

    // Whatever is left is the host's own top-up coming back.
    if (tournament.bank > 0) {
      const remainder = tournament.bank
      await debitBank(tournament._id, remainder, session)
      await creditUser(tournament.host, remainder, session)
      await recordTransaction(
        {
          userId: tournament.host,
          type: 'refund',
          amount: remainder,
          tournamentId: tournament._id,
          description: `Bank returned from cancelled "${tournament.title}"`,
        },
        session
      )
    }

    await Tournament.deleteOne({ _id: tournament._id }, { session })
    return { refunds }
  })
}

// --- joining ----------------------------------------------------------------

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

/** Enters a solo tournament, paying the entry fee into the bank. */
export async function joinSolo(tournamentId, userId) {
  return withTransaction(async (session) => {
    const tournament = await loadTournament(tournamentId, session)
    if (tournament.isTeamBased) throw ApiError.badRequest('This tournament is played in teams')

    assertJoinable(tournament, userId)

    if (tournament.accessibility === 'application required') {
      const accepted = tournament.acceptedUsers.some((id) => String(id) === String(userId))
      if (!accepted) throw ApiError.forbidden('Your application has not been accepted yet')
    }

    await collectEntryFee(tournament, userId, session)

    tournament.enrolledUsers.push({ userId, score: 0, eliminated: false })
    tournament.acceptedUsers = tournament.acceptedUsers.filter(
      (id) => String(id) !== String(userId)
    )
    await tournament.save({ session })

    return tournament
  })
}

/**
 * Enters a team tournament.
 *
 * The leader pays `entryFee × teamSize` — the documented rule — and the whole
 * amount goes into the bank, so the prize the team can win is funded by what the
 * team put in.
 */
export async function joinTeam(tournamentId, userId, teamId) {
  return withTransaction(async (session) => {
    const tournament = await loadTournament(tournamentId, session)
    if (!tournament.isTeamBased) throw ApiError.badRequest('This tournament is played solo')

    const team = await Team.findById(teamId).session(session)
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

    await collectEntryFee(tournament, userId, session)

    tournament.enrolledTeams.push({
      teamId: String(team._id),
      teamName: team.name,
      paidBy: String(userId),
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
    await tournament.save({ session })

    return tournament
  })
}

/** Debits the payer and credits the bank, with a ledger entry, or does nothing if free. */
async function collectEntryFee(tournament, payerId, session) {
  const cost = tournament.entryCost
  if (cost <= 0) return

  await debitUser(payerId, cost, session)
  await creditBank(tournament._id, cost, session)
  await recordTransaction(
    {
      userId: payerId,
      type: 'entry_fee',
      amount: -cost,
      tournamentId: tournament._id,
      description: `Entry fee for "${tournament.title}"`,
    },
    session
  )
  // Keep the in-memory document in step with the update just applied, so the
  // `save()` that follows does not write a stale bank back over it.
  tournament.bank += cost
}

// --- applications -----------------------------------------------------------

/** Files an application against the host's form. */
export async function apply(tournamentId, userId, { teamId, fields }) {
  const tournament = await loadTournament(tournamentId)

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

// --- bank -------------------------------------------------------------------

/** A host top-up, capped at what the bank still needs. */
export async function deposit(tournamentId, hostId, amount) {
  return withTransaction(async (session) => {
    const tournament = await loadAsHost(tournamentId, hostId, session)
    if (tournament.hasEnded) throw ApiError.badRequest('This tournament has already ended')

    const deposited = await depositIntoBank(tournament, hostId, amount, session)
    return { deposited, bank: tournament.bank + deposited, required: tournament.totalPrize }
  })
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
}

/**
 * Starts the tournament.
 *
 * The bank check is a numeric comparison against `totalPrize`, which is a number
 * for both formats. The original compared the bank to `earnings` directly — an
 * array of prize objects for battle royale — so the comparison stringified an
 * object and could never be true. A battle royale could not be started at all.
 */
export async function startTournament(tournamentId, hostId) {
  const tournament = await loadAsHost(tournamentId, hostId)
  if (tournament.hasStarted) throw ApiError.badRequest('This tournament has already started')
  if (tournament.hasEnded) throw ApiError.badRequest('This tournament has already ended')

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

  if (tournament.bank < tournament.totalPrize) {
    throw ApiError.badRequest(
      `The bank holds ${tournament.bank} of the ${tournament.totalPrize} credits in prizes. Top it up first.`
    )
  }

  // A bracket has to be drawn before it can be played. If the host never hit
  // "shuffle", draw it now rather than starting a tournament with no pairings.
  if (tournament.type === 'brackets' && !tournament.bracketsShuffled) drawBracket(tournament)

  tournament.hasStarted = true
  await tournament.save()
  return tournament
}

/**
 * Records match winners.
 *
 * Every winner must be a participant in *this* tournament — the original looked
 * the name up in the users or teams collection globally, so any username on the
 * site was accepted as the winner of any match.
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

  const enrolled = new Set(tournament.participantIds())
  for (const winner of matches) {
    if (winner !== null && !enrolled.has(String(winner))) {
      throw ApiError.badRequest('Match winners must be competing in this tournament')
    }
  }

  tournament.matches = matches
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

/** Ends the tournament and pays out, all inside one transaction. */
export async function endTournament(tournamentId, hostId) {
  return withTransaction(async (session) => {
    const tournament = await loadAsHost(tournamentId, hostId, session)
    if (!tournament.hasStarted) throw ApiError.badRequest('This tournament has not started')
    if (tournament.hasEnded) throw ApiError.badRequest('This tournament has already ended')

    if (tournament.type === 'brackets' && !tournament.matches[tournament.matches.length - 1]) {
      throw ApiError.badRequest('Record the winner of the final before ending the tournament')
    }

    const result = await payOutTournament(tournament, session)

    tournament.hasEnded = true
    await tournament.save({ session })

    return { tournament, ...result }
  })
}
