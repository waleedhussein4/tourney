import Tournament from '../src/models/tournament.model.js'
import User from '../src/models/user.model.js'
import { CATEGORIES } from '../src/config/constants.js'

const DAY = 24 * 60 * 60 * 1000

/**
 * Demo tournaments, one per shape the app supports so every screen has something
 * real to render. Phase 3 of PLAN.md replaces this with the full seed script.
 */
const blueprints = [
  {
    title: 'Solo Ladder Open',
    type: 'brackets',
    teamSize: 1,
    maxCapacity: 8,
    entryFee: 10,
    prize: 80,
    accessibility: 'open',
    description: 'Eight players, single elimination, one winner.',
    rules: 'Best of three. No rematches.',
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
    rules: 'Both players must be present for every match.',
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
    rules: 'Points for placement and eliminations.',
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
    rules: 'Scores are submitted after each round.',
  },
]

async function createTournaments() {
  const hosts = await User.find({ role: { $ne: 'admin' } }).limit(4)
  if (hosts.length === 0) {
    throw new Error('No users found — run the user seed first.')
  }

  const now = Date.now()

  const created = []
  for (const [index, blueprint] of blueprints.entries()) {
    const host = hosts[index % hosts.length]
    await User.updateOne({ _id: host._id }, { $set: { isHost: true } })

    created.push(
      await Tournament.create({
        ...blueprint,
        host: host._id,
        category: CATEGORIES[index % CATEGORIES.length].slug,
        applicationForm: blueprint.applicationForm ?? [],
        startDate: new Date(now + (index + 1) * DAY),
        endDate: new Date(now + (index + 3) * DAY),
        matches:
          blueprint.type === 'brackets' ? new Array(blueprint.maxCapacity - 1).fill(null) : [],
      })
    )
  }

  return created
}

async function deleteAllTournaments() {
  return Tournament.deleteMany({})
}

export { createTournaments, deleteAllTournaments }
