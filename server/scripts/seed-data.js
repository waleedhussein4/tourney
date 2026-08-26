// The demo dataset, shared by `npm run seed` and the admin page.
//
// Everything is built through the same services the API uses, so a seeded
// tournament that says it has started really did go through the bank check, and
// a seeded payout really did move credits and write ledger rows. A fixture that
// wrote documents directly would drift from the rules the app enforces.
//
// No password is committed. Each is taken from the environment if set, and
// otherwise generated per run and printed once — so a deployment cannot end up
// with accounts whose credentials are readable in the repository.

import crypto from 'node:crypto'
import User from '../src/models/user.model.js'
import Team from '../src/models/team.model.js'
import Tournament from '../src/models/tournament.model.js'
import Transaction from '../src/models/transaction.model.js'
import Product from '../src/models/product.model.js'
import { DEFAULT_PRODUCTS } from '../src/config/products.js'
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
  { username: 'sana', isHost: true, credits: 2000 },
  { username: 'idris', isHost: true, credits: 2000 },
  { username: 'mei', credits: 400 },
  { username: 'tomas', credits: 400 },
  { username: 'ada', credits: 400 },
  { username: 'kofi', credits: 400 },
  { username: 'lena', credits: 400 },
  { username: 'oscar', credits: 400 },
  { username: 'priya', credits: 400 },
  { username: 'diego', credits: 400 },
  { username: 'yuki', credits: 400 },
  { username: 'noor', credits: 400 },
]

/** Four teams, sized for the team tournaments below. */
const TEAMS = [
  { name: 'Night Owls', leader: 'mei', members: ['tomas'] },
  { name: 'Day Larks', leader: 'ada', members: ['kofi'] },
  { name: 'Signal Lost', leader: 'lena', members: ['oscar', 'priya'] },
  { name: 'Late Rally', leader: 'diego', members: ['yuki', 'noor'] },
]

// --- helpers -----------------------------------------------------------------

async function findOrCreateUser({ username, email, password, credits = 0, isHost = false, role }) {
  let user = await User.findOne({ email })
  if (!user) user = await registerUser({ email, username, password })

  const update = { credits, isHost }
  if (role) update.role = role
  await User.updateOne({ _id: user._id }, { $set: update })

  return User.findById(user._id)
}

/** Tops the bank up to the full prize pool out of the host's own credits. */
async function fillBank(tournament, hostId) {
  const shortfall = tournament.totalPrize - tournament.bank
  if (shortfall > 0) await tournaments.deposit(tournament._id, hostId, shortfall)
}

// --- the tournaments ---------------------------------------------------------

const now = () => Date.now()

/**
 * Ten tournaments across every shape and every state a visitor can land on.
 *
 * `state` drives how far each one is taken: an upcoming tournament is only
 * created, a filling one has some entrants, a started one is full and under way,
 * and an ended one has been played out and paid out.
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
        entryFee: 10,
        prize: 80,
        description: 'Eight players, single elimination, one winner takes the pot.',
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
        entryFee: 5,
        prize: 20,
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
        entryFee: 10,
        prize: 60,
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
        entryFee: 10,
        prize: 40,
        description: 'Last season’s bracket, played out and paid out.',
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
        entryFee: 15,
        prize: 120,
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
        entryFee: 10,
        prize: 41,
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
        entryFee: 5,
        prizes: [
          { rank: 1, prize: 150 },
          { rank: 2, prize: 75 },
          { rank: 3, prize: 25 },
        ],
        description: 'Fifty players drop in. The leaderboard decides the prizes.',
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
        entryFee: 5,
        prizes: [
          { rank: 1, prize: 30 },
          { rank: 2, prize: 10 },
        ],
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
        entryFee: 8,
        prizes: [
          { rank: 1, prize: 32 },
          { rank: 2, prize: 16 },
        ],
        description: 'Squads of three chased the highest combined score.',
        rules: '<p>Scores are submitted after each round.</p>',
        startDate: new Date(base - 6 * DAY),
        endDate: new Date(base - 5 * DAY),
      },
    },
    {
      state: 'upcoming',
      host: 'demo',
      entrants: [],
      payload: {
        title: 'Open Invitational',
        type: 'battle royale',
        category: 'tennis',
        accessibility: 'open',
        teamSize: 1,
        maxCapacity: 20,
        entryFee: 0,
        prizes: [
          { rank: 1, prize: 100 },
          { rank: 2, prize: 50 },
        ],
        description: 'Free to enter — the prize pool comes from the host.',
        rules: '<p>Open to everyone. One entry per person.</p>',
        startDate: new Date(base + 9 * DAY),
        endDate: new Date(base + 10 * DAY),
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
    credits: 500,
    isHost: true,
  })

  const admin = await findOrCreateUser({
    username: 'admin',
    email: credentials.admin.email,
    password: credentials.admin.password,
    credits: 0,
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

  let products = 0
  for (const product of DEFAULT_PRODUCTS) {
    const result = await Product.updateOne(
      { _id: product._id },
      { $setOnInsert: product },
      { upsert: true }
    )
    if (result.upsertedCount) products += 1
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
      })
    }
    teams.set(blueprint.name, team)
  }

  let created = 0
  for (const blueprint of blueprints()) {
    if (await Tournament.exists({ title: blueprint.payload.title })) continue
    await buildTournament(blueprint, people, teams)
    created += 1
  }

  return {
    users: people.size,
    teams: teams.size,
    products,
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

  if (blueprint.state !== 'started' && blueprint.state !== 'ended') return

  const funded = await tournaments.loadTournament(id)
  await fillBank(funded, host._id)
  await tournaments.startTournament(id, host._id)

  await recordResults(id, host._id, blueprint, people, teams)

  if (blueprint.state === 'ended') await tournaments.endTournament(id, host._id)
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
    const matches = new Array(live.maxCapacity - 1).fill(null)

    // Round one: the seeded winner takes their match, the other pairs go to
    // whoever is listed first.
    let slot = 0
    for (let pair = 0; pair < order.length; pair += 2) {
      matches[slot] =
        order.includes(winnerId) && [order[pair], order[pair + 1]].includes(winnerId)
          ? winnerId
          : order[pair]
      slot += 1
    }
    // Everything after round one is the seeded winner marching to the final.
    for (; slot < matches.length; slot += 1) matches[slot] = winnerId

    await tournaments.updateMatches(id, hostId, matches)
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

/** Removes the demo dataset. Admin accounts are left alone. */
export async function clearDemoData() {
  const [tournamentResult, teamResult, userResult, transactionResult] = await Promise.all([
    Tournament.deleteMany({}),
    Team.deleteMany({}),
    User.deleteMany({ role: { $ne: 'admin' } }),
    Transaction.deleteMany({}),
  ])

  return {
    tournaments: tournamentResult.deletedCount,
    teams: teamResult.deletedCount,
    users: userResult.deletedCount,
    transactions: transactionResult.deletedCount,
  }
}
