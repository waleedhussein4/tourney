// The demo dataset, shared by `npm run seed` and the admin page.
//
// No password is committed. `SEED_PASSWORD` sets one; otherwise a random one is
// generated per process and printed once, so a deployment cannot end up with
// accounts whose credentials are readable in the repository.

import crypto from 'node:crypto'
import User from '../src/models/user.model.js'
import Team from '../src/models/team.model.js'
import Tournament from '../src/models/tournament.model.js'
import Transaction from '../src/models/transaction.model.js'
import Product from '../src/models/product.model.js'
import { CATEGORIES } from '../src/config/constants.js'
import { DEFAULT_PRODUCTS } from '../src/config/products.js'
import { registerUser } from '../src/modules/auth/auth.service.js'

const DAY = 24 * 60 * 60 * 1000

let generatedPassword = null

/**
 * The password every demo account shares, for this process.
 *
 * A generated one still satisfies the signup policy: mixed case and a digit.
 */
export function demoPassword() {
  if (process.env.SEED_PASSWORD) return process.env.SEED_PASSWORD
  if (!generatedPassword) {
    generatedPassword = `Demo${crypto
      .randomBytes(6)
      .toString('base64url')
      .replace(/[^a-zA-Z0-9]/g, 'x')}7`
  }
  return generatedPassword
}

const PEOPLE = [
  { username: 'demo', email: 'demo@tourney.app', isHost: true, credits: 500 },
  { username: 'sana', email: 'sana@tourney.app', isHost: true, credits: 400 },
  { username: 'idris', email: 'idris@tourney.app', credits: 300 },
  { username: 'mei', email: 'mei@tourney.app', credits: 300 },
  { username: 'tomas', email: 'tomas@tourney.app', credits: 300 },
  { username: 'ada', email: 'ada@tourney.app', credits: 300 },
  { username: 'kofi', email: 'kofi@tourney.app', credits: 300 },
  { username: 'lena', email: 'lena@tourney.app', credits: 300 },
]

/** One tournament per shape the app supports, so every screen has real data. */
const TOURNAMENTS = [
  {
    title: 'Solo Ladder Open',
    type: 'brackets',
    teamSize: 1,
    maxCapacity: 8,
    entryFee: 10,
    prize: 80,
    accessibility: 'open',
    description: 'Eight players, single elimination, one winner takes the pot.',
    rules: '<p>Best of three. Report your result within ten minutes of the match.</p>',
  },
  {
    title: 'Duo Bracket Invitational',
    type: 'brackets',
    teamSize: 2,
    maxCapacity: 4,
    entryFee: 15,
    prize: 120,
    accessibility: 'application required',
    applicationForm: ['In-game name', 'Region', 'Why do you want in?'],
    description: 'Four duos, one bracket, applications reviewed by the host.',
    rules: '<p>Both players must be present for every match.</p>',
  },
  {
    title: 'Last One Standing',
    type: 'battle royale',
    teamSize: 1,
    maxCapacity: 50,
    entryFee: 5,
    prizes: [
      { rank: 1, prize: 150 },
      { rank: 2, prize: 75 },
      { rank: 3, prize: 25 },
    ],
    accessibility: 'open',
    description: 'Fifty players drop in. The leaderboard decides the prizes.',
    rules: '<p>Points for placement and for eliminations.</p>',
  },
  {
    title: 'Squad Score Attack',
    type: 'battle royale',
    teamSize: 3,
    maxCapacity: 12,
    entryFee: 8,
    prizes: [
      { rank: 1, prize: 240 },
      { rank: 2, prize: 120 },
    ],
    accessibility: 'open',
    description: 'Twelve squads of three chase the highest combined score.',
    rules: '<p>Scores are submitted after each round.</p>',
  },
]

/**
 * Adds whatever is missing. Safe to run twice: accounts, packages, and
 * tournaments are all matched by a natural key before being created.
 */
export async function seedDemoData() {
  const password = demoPassword()

  const users = []
  for (const person of PEOPLE) {
    let user = await User.findOne({ email: person.email })
    if (!user) {
      user = await registerUser({ email: person.email, username: person.username, password })
    }
    await User.updateOne(
      { _id: user._id },
      { $set: { credits: person.credits, isHost: Boolean(person.isHost) } }
    )
    users.push(user)
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

  const hosts = users.filter((_, index) => PEOPLE[index].isHost)
  const now = Date.now()

  let tournaments = 0
  for (const [index, blueprint] of TOURNAMENTS.entries()) {
    if (await Tournament.exists({ title: blueprint.title })) continue

    await Tournament.create({
      ...blueprint,
      host: hosts[index % hosts.length]._id,
      category: CATEGORIES[index % CATEGORIES.length].slug,
      applicationForm: blueprint.applicationForm ?? [],
      startDate: new Date(now + (index + 1) * DAY),
      endDate: new Date(now + (index + 3) * DAY),
      matches: blueprint.type === 'brackets' ? new Array(blueprint.maxCapacity - 1).fill(null) : [],
    })
    tournaments += 1
  }

  return {
    users: users.length,
    products,
    tournaments,
    demoEmail: PEOPLE[0].email,
  }
}

/** Removes the demo dataset. Admin accounts are left alone. */
export async function clearDemoData() {
  const [tournaments, teams, users, transactions] = await Promise.all([
    Tournament.deleteMany({}),
    Team.deleteMany({}),
    User.deleteMany({ role: { $ne: 'admin' } }),
    Transaction.deleteMany({}),
  ])

  return {
    tournaments: tournaments.deletedCount,
    teams: teams.deletedCount,
    users: users.deletedCount,
    transactions: transactions.deletedCount,
  }
}
