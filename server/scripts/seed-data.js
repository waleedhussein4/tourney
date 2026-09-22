// The demo dataset, shared by `npm run seed` and the admin page.
//
// Everything is built through the same services the API uses, so a seeded
// tournament that says it has started really did pass the rules for starting
// one. A fixture that wrote documents directly would drift from what the app
// enforces.
//
// No password is committed. Each is taken from the environment if set, and
// otherwise generated per run and printed once — so a deployment cannot end up
// with accounts whose credentials are readable in the repository.

import crypto from 'node:crypto'
import User from '../src/models/user.model.js'
import Team from '../src/models/team.model.js'
import Tournament from '../src/models/tournament.model.js'
import { registerUser } from '../src/modules/auth/auth.service.js'
import * as tournaments from '../src/modules/tournaments/tournament.service.js'

const DAY = 24 * 60 * 60 * 1000

// --- passwords ---------------------------------------------------------------

const generated = new Map()

/** A random password that still satisfies the signup policy. */
export function generatePassword() {
  const body = crypto
    .randomBytes(9)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, 'x')
  return `Demo${body}7`
}

function passwordFrom(variable) {
  const configured = process.env[variable]?.trim()
  if (configured) return configured
  if (!generated.has(variable)) generated.set(variable, generatePassword())
  return generated.get(variable)
}

/**
 * The three passwords the seed uses, and where each comes from.
 *
 * Read this once and print it; nothing else in the codebase knows them.
 */
export function seedCredentials() {
  return {
    demo: {
      email: process.env.SEED_DEMO_EMAIL?.trim() || 'demo@tourney.app',
      password: passwordFrom('SEED_DEMO_PASSWORD'),
      fromEnv: Boolean(process.env.SEED_DEMO_PASSWORD?.trim()),
    },
    admin: {
      email: process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@tourney.app',
      password: passwordFrom('SEED_ADMIN_PASSWORD'),
      fromEnv: Boolean(process.env.SEED_ADMIN_PASSWORD?.trim()),
    },
    players: {
      password: passwordFrom('SEED_PASSWORD'),
      fromEnv: Boolean(process.env.SEED_PASSWORD?.trim()),
    },
  }
}

// --- the cast ----------------------------------------------------------------

/** The twelve players. Two of them host, so there is more than one host's view. */
const PLAYERS = [
  { username: 'sana', isHost: true, plan: true },
  { username: 'idris', isHost: true, plan: true },
  { username: 'mei' },
  { username: 'tomas' },
  { username: 'ada' },
  { username: 'kofi' },
  { username: 'lena' },
  { username: 'oscar' },
  { username: 'priya' },
  { username: 'diego' },
  { username: 'yuki' },
  { username: 'noor' },
]

/** Four teams, sized for the team tournaments below. */
const TEAMS = [
  { name: 'Night Owls', leader: 'mei', members: ['tomas'] },
  { name: 'Day Larks', leader: 'ada', members: ['kofi'] },
  { name: 'Signal Lost', leader: 'lena', members: ['oscar', 'priya'] },
  { name: 'Late Rally', leader: 'diego', members: ['yuki', 'noor'] },
]

// --- helpers -----------------------------------------------------------------

async function findOrCreateUser({ username, email, password, isHost = false, role, plan }) {
  let user = await User.findOne({ email })
  if (!user) user = await registerUser({ email, username, password })

  // Matching by the seed's own email is also what flags accounts seeded before
  // `isDemo` existed. The admin is seeded but is not demo data: it is never cleared.
  const update = { isHost, isDemo: !role, emailVerified: true }
  if (role) update.role = role
  // Seeded hosts carry a plan, or the demo would be ten tournaments nobody can
  // see: publishing more than one needs a subscription.
  if (plan) update.hostingPlan = { status: 'active', provider: 'seed', updatedAt: new Date() }
  await User.updateOne({ _id: user._id }, { $set: update })

  return User.findById(user._id)
}

// --- the tournaments ---------------------------------------------------------

const now = () => Date.now()

/**
 * Ten tournaments across every shape and every state a visitor can land on.
 *
 * `state` drives how far each one is taken: an upcoming tournament is only
 * created, a filling one has some entrants, a started one is full and under way,
 * and an ended one has been played through to a winner.
 */
function blueprints() {
  const base = now()
  return [
    {
      state: 'upcoming',
      host: 'sana',
      entrants: [],
      payload: {
        title: 'Solo Ladder Open',
        type: 'brackets',
        category: 'chess',
        accessibility: 'open',
        teamSize: 1,
        maxCapacity: 8,
        description: 'Eight players, single elimination, one winner.',
        rules: '<p>Best of three. Report your result within ten minutes of the match.</p>',
        startDate: new Date(base + 5 * DAY),
        endDate: new Date(base + 6 * DAY),
      },
    },
    {
      state: 'filling',
      host: 'sana',
      entrants: ['mei', 'tomas'],
      payload: {
        title: 'Midweek Melee',
        type: 'brackets',
        category: 'fighting',
        accessibility: 'open',
        teamSize: 1,
        maxCapacity: 4,
        description: 'A quick four-player bracket, every Wednesday.',
        rules: '<p>One game per match. Loser picks the next stage.</p>',
        startDate: new Date(base + 2 * DAY),
        endDate: new Date(base + 2 * DAY + 4 * 60 * 60 * 1000),
      },
    },
    {
      state: 'started',
      host: 'sana',
      entrants: ['mei', 'tomas', 'ada', 'kofi'],
      payload: {
        title: 'Bracket Showdown',
        type: 'brackets',
        category: 'tactical-shooter',
        accessibility: 'open',
        teamSize: 1,
        maxCapacity: 4,
        description: 'Four players in, one player out. Currently under way.',
        rules: '<p>Single elimination. No substitutions once the bracket is drawn.</p>',
        startDate: new Date(base - 2 * 60 * 60 * 1000),
        endDate: new Date(base + DAY),
      },
    },
    {
      state: 'ended',
      host: 'sana',
      entrants: ['lena', 'oscar', 'priya', 'diego'],
      winner: 'lena',
      payload: {
        title: 'Winter Classic',
        type: 'brackets',
        category: 'strategy',
        accessibility: 'open',
        teamSize: 1,
        maxCapacity: 4,
        description: 'Last season’s bracket, played out in full.',
        rules: '<p>Classical time control.</p>',
        startDate: new Date(base - 10 * DAY),
        endDate: new Date(base - 9 * DAY),
      },
    },
    {
      state: 'applications',
      host: 'idris',
      applicants: [{ team: 'Night Owls' }, { team: 'Day Larks', accept: true }],
      payload: {
        title: 'Duo Bracket Invitational',
        type: 'brackets',
        category: 'moba',
        accessibility: 'application required',
        teamSize: 2,
        maxCapacity: 4,
        applicationForm: ['In-game name', 'Region', 'Why do you want in?'],
        description: 'Four duos, one bracket, applications reviewed by the host.',
        rules: '<p>Both players must be present for every match.</p>',
        startDate: new Date(base + 7 * DAY),
        endDate: new Date(base + 8 * DAY),
      },
    },
    {
      state: 'ended',
      host: 'idris',
      entrantTeams: ['Night Owls', 'Day Larks'],
      winnerTeam: 'Night Owls',
      payload: {
        title: 'Team Title Run',
        type: 'brackets',
        category: 'sports-sim',
        accessibility: 'open',
        teamSize: 2,
        maxCapacity: 2,
        description: 'A duo bracket that has already crowned its winners.',
        rules: '<p>Two legs, aggregate score.</p>',
        startDate: new Date(base - 4 * DAY),
        endDate: new Date(base - 3 * DAY),
      },
    },
    {
      state: 'filling',
      host: 'idris',
      entrants: ['mei', 'ada', 'lena', 'yuki', 'noor'],
      payload: {
        title: 'Last One Standing',
        type: 'battle royale',
        category: 'battle-royale',
        accessibility: 'open',
        teamSize: 1,
        maxCapacity: 50,
        description: 'Fifty players drop in. The leaderboard decides the ranking.',
        rules: '<p>Points for placement and for eliminations.</p>',
        startDate: new Date(base + 3 * DAY),
        endDate: new Date(base + 3 * DAY + 6 * 60 * 60 * 1000),
      },
    },
    {
      state: 'started',
      host: 'idris',
      entrants: ['tomas', 'kofi', 'oscar', 'diego'],
      scores: { tomas: 42, kofi: 31, oscar: 18, diego: 9 },
      payload: {
        title: 'Score Attack Nightly',
        type: 'battle royale',
        category: 'racing',
        accessibility: 'open',
        teamSize: 1,
        maxCapacity: 4,
        description: 'Running right now — the leaderboard updates every round.',
        rules: '<p>Best three runs of the night count.</p>',
        startDate: new Date(base - 60 * 60 * 1000),
        endDate: new Date(base + 6 * 60 * 60 * 1000),
      },
    },
    {
      state: 'ended',
      host: 'idris',
      entrantTeams: ['Signal Lost', 'Late Rally'],
      teamScores: { 'Late Rally': 88, 'Signal Lost': 51 },
      payload: {
        title: 'Squad Score Attack',
        type: 'battle royale',
        category: 'card-game',
        accessibility: 'open',
        teamSize: 3,
        maxCapacity: 2,
        description: 'Squads of three chased the highest combined score.',
        rules: '<p>Scores are submitted after each round.</p>',
        startDate: new Date(base - 6 * DAY),
        endDate: new Date(base - 5 * DAY),
      },
    },
    {
      // Published and filling, so the demo host's manage screens and any
      // screenshot of them show a tournament that's actually in play.
      state: 'filling',
      host: 'demo',
      entrants: ['mei', 'tomas'],
      payload: {
        title: 'Open Invitational',
        type: 'battle royale',
        category: 'tennis',
        accessibility: 'open',
        teamSize: 1,
        maxCapacity: 20,
        description: 'Open to everyone, no application needed.',
        rules: '<p>Open to everyone. One entry per person.</p>',
        startDate: new Date(base + 9 * DAY),
        endDate: new Date(base + 10 * DAY),
      },
    },
    {
      // Left in `draft` on purpose: the one-minute demo path is sign in, open
      // this from the profile, press Publish.
      state: 'draft',
      host: 'demo',
      entrants: [],
      payload: {
        title: 'Your first tournament',
        type: 'brackets',
        category: 'chess',
        accessibility: 'open',
        teamSize: 1,
        maxCapacity: 8,
        description: 'A draft tournament, ready to publish.',
        rules: '<p>Best of three. Report your result within ten minutes of the match.</p>',
        startDate: new Date(base + 7 * DAY),
        endDate: new Date(base + 8 * DAY),
      },
    },
  ]
}

// --- seeding -----------------------------------------------------------------

/**
 * Adds whatever is missing. Safe to run twice: accounts, teams, packages, and
 * tournaments are each matched by a natural key before being created.
 */
export async function seedDemoData() {
  const credentials = seedCredentials()

  const demo = await findOrCreateUser({
    username: 'demo',
    email: credentials.demo.email,
    password: credentials.demo.password,
    isHost: true,
    plan: true,
  })

  const admin = await findOrCreateUser({
    username: 'admin',
    email: credentials.admin.email,
    password: credentials.admin.password,
    role: 'admin',
  })

  const people = new Map([
    ['demo', demo],
    ['admin', admin],
  ])
  for (const player of PLAYERS) {
    people.set(
      player.username,
      await findOrCreateUser({
        ...player,
        email: `${player.username}@tourney.app`,
        password: credentials.players.password,
      })
    )
  }

  const teams = new Map()
  for (const blueprint of TEAMS) {
    let team = await Team.findOne({ name: blueprint.name })
    if (!team) {
      const leader = people.get(blueprint.leader)
      team = await Team.create({
        joinCode: crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase(),
        name: blueprint.name,
        leader: leader._id,
        createdBy: leader._id,
        members: [leader._id, ...blueprint.members.map((name) => people.get(name)._id)],
        isDemo: true,
      })
    }
    teams.set(blueprint.name, team)
  }

  // Documents seeded before `isDemo` existed carry no flag. They are recognised
  // by the seed's natural key *and* a seeded owner, so a real host's tournament
  // that happens to share a title is never claimed.
  const seededIds = [...people.values()].filter((user) => user.isDemo).map((user) => user._id)
  await Team.updateMany(
    { name: { $in: TEAMS.map((team) => team.name) }, leader: { $in: seededIds } },
    { $set: { isDemo: true } }
  )
  await Tournament.updateMany(
    { title: { $in: blueprints().map((b) => b.payload.title) }, host: { $in: seededIds } },
    { $set: { isDemo: true } }
  )

  let created = 0
  for (const blueprint of blueprints()) {
    if (await Tournament.exists({ title: blueprint.payload.title })) continue
    const tournament = await buildTournament(blueprint, people, teams)
    await Tournament.updateOne({ _id: tournament._id }, { $set: { isDemo: true } })
    created += 1
  }

  return {
    users: people.size,
    teams: teams.size,
    tournaments: created,
    demoEmail: credentials.demo.email,
    adminEmail: credentials.admin.email,
  }
}

/** Creates one tournament and advances it to the state its blueprint asks for. */
async function buildTournament(blueprint, people, teams) {
  const host = people.get(blueprint.host)
  const tournament = await tournaments.createTournament(host._id, blueprint.payload)
  const id = tournament._id

  // Demo data is there to be browsed, so it skips the publishing fee: nobody is
  // going to confirm a payment for a fixture at four in the morning. A `draft`
  // blueprint is the exception — it exists to be published *by hand* during the
  // demo walkthrough, so it stays exactly as `createTournament` left it.
  if (blueprint.state !== 'draft') {
    tournament.publishState = 'published'
    await tournament.save()
  }

  // Entrants pay their way in, exactly as they would through the API.
  for (const username of blueprint.entrants ?? []) {
    await tournaments.joinSolo(id, people.get(username)._id)
  }
  for (const teamName of blueprint.entrantTeams ?? []) {
    const team = teams.get(teamName)
    await tournaments.joinTeam(id, String(team.leader), team._id)
  }

  for (const applicant of blueprint.applicants ?? []) {
    const team = teams.get(applicant.team)
    await tournaments.apply(id, String(team.leader), {
      teamId: team._id,
      fields: blueprint.payload.applicationForm.map((label) => ({
        label,
        input: `${applicant.team} says: ${label.toLowerCase()}`,
      })),
    })

    if (applicant.accept) {
      const pending = await tournaments.loadTournament(id)
      const application = pending.applications.find(
        (entry) => String(entry.applicantId) === String(team._id)
      )
      await tournaments.acceptApplication(id, host._id, application._id)
    }
  }

  if (blueprint.state !== 'started' && blueprint.state !== 'ended') return tournament

  await tournaments.startTournament(id, host._id)

  await recordResults(id, host._id, blueprint, people, teams)

  if (blueprint.state === 'ended') await tournaments.endTournament(id, host._id)
  return tournament
}

/** Fills in whatever the tournament's format uses to decide who won. */
async function recordResults(id, hostId, blueprint, people, teams) {
  const live = await tournaments.loadTournament(id)

  if (live.type === 'brackets') {
    // The bracket is drawn at random, so the seeded winner is read back out of
    // the draw rather than assumed.
    const winnerId = blueprint.winnerTeam
      ? String(teams.get(blueprint.winnerTeam)._id)
      : blueprint.winner
        ? String(people.get(blueprint.winner)._id)
        : live.participantIds()[0]

    const order = live.bracketOrder.filter(Boolean)

    // Walk the match tree in the same round-1-from-the-draw,
    // later-rounds-from-the-previous-round's-winner order `updateMatches`
    // does, so every winner is one of that match's own two competitors.
    const participantsByKey = new Map()
    for (const match of live.matches.filter((entry) => entry.round === 1)) {
      participantsByKey.set(`1-${match.slot}`, [order[match.slot * 2], order[match.slot * 2 + 1]])
    }

    const maxRound = Math.max(...live.matches.map((entry) => entry.round))
    const results = []

    for (const match of live.matches) {
      const participants = participantsByKey.get(`${match.round}-${match.slot}`) ?? [null, null]
      const winner = participants.includes(winnerId) ? winnerId : participants[0]
      results.push({ id: match.id, winner })

      if (match.round < maxRound) {
        const nextKey = `${match.round + 1}-${Math.floor(match.slot / 2)}`
        const next = participantsByKey.get(nextKey) ?? [null, null]
        next[match.slot % 2] = winner
        participantsByKey.set(nextKey, next)
      }
    }

    await tournaments.updateMatches(id, hostId, results)
    return
  }

  const scores = blueprint.scores ?? blueprint.teamScores
  if (!scores) return

  const participants = Object.entries(scores).map(([name, score]) => ({
    id: blueprint.teamScores ? String(teams.get(name)._id) : String(people.get(name)._id),
    score,
  }))
  await tournaments.updateParticipants(id, hostId, participants)
}

/** Every user or team id a tournament refers to. */
function idsReferencedBy(tournament) {
  return [
    tournament.host,
    ...tournament.enrolledUsers.map((entry) => entry.userId),
    ...tournament.enrolledTeams.flatMap((entry) => [
      entry.teamId,
      ...entry.members.map((member) => member.userId),
    ]),
    ...tournament.applications.map((application) => application.applicantId),
  ].map(String)
}

/**
 * Removes the demo dataset, and nothing else.
 *
 * Demo data is what the seed flagged `isDemo`, plus whatever was made *with* a
 * demo account — the demo login is public, so a tournament it hosts or a team it
 * leads is a visitor's leftovers. Real accounts, and everything they own, stay.
 *
 * The two worlds can touch, and the direction that matters is handled: a demo
 * user or team that a real tournament refers to is kept — the seed resets it in
 * place — so a paying host's bracket never points at nobody.
 */
export async function clearDemoData() {
  const demoUserIds = (await User.find({ isDemo: true }).select('_id').lean()).map((u) => u._id)

  const demoTournaments = await Tournament.find({
    $or: [{ isDemo: true }, { host: { $in: demoUserIds } }],
  })
  const demoTournamentIds = demoTournaments.map((tournament) => tournament._id)

  const realTournaments = await Tournament.find({ _id: { $nin: demoTournamentIds } })
  const keep = [...new Set(realTournaments.flatMap(idsReferencedBy))]

  await Tournament.deleteMany({ _id: { $in: demoTournamentIds } })

  const doomedUsers = { isDemo: true, role: { $ne: 'admin' }, _id: { $nin: keep } }
  const doomedUserIds = (await User.find(doomedUsers).select('_id').lean()).map((u) => u._id)

  const teamResult = await Team.deleteMany({
    $or: [{ isDemo: true }, { leader: { $in: demoUserIds } }],
    _id: { $nin: keep },
  })
  await Team.updateMany({}, { $pull: { members: { $in: doomedUserIds } } })
  const userResult = await User.deleteMany({ _id: { $in: doomedUserIds } })

  return {
    tournaments: demoTournaments.length,
    teams: teamResult.deletedCount,
    users: userResult.deletedCount,
  }
}
