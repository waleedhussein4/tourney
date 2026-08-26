import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { client, guest, totalCredits } from './setup/api.js'
import User from '../src/models/user.model.js'
import Team from '../src/models/team.model.js'
import Tournament from '../src/models/tournament.model.js'
import Transaction from '../src/models/transaction.model.js'
import Product from '../src/models/product.model.js'
import {
  clearDemoData,
  generatePassword,
  seedCredentials,
  seedDemoData,
} from '../scripts/seed-data.js'

useDatabase()

const SEED_VARIABLES = [
  'SEED_PASSWORD',
  'SEED_DEMO_PASSWORD',
  'SEED_DEMO_EMAIL',
  'SEED_ADMIN_PASSWORD',
  'SEED_ADMIN_EMAIL',
]

let saved

beforeEach(() => {
  saved = Object.fromEntries(SEED_VARIABLES.map((name) => [name, process.env[name]]))
  for (const name of SEED_VARIABLES) delete process.env[name]
})

afterEach(() => {
  for (const [name, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

describe('what the seed creates', () => {
  it('creates the cast, the teams, the catalogue, and the tournaments', async () => {
    const result = await seedDemoData()

    // Twelve players, plus the demo account and the admin.
    expect(result.users).toBe(14)
    expect(result.teams).toBe(4)
    expect(result.tournaments).toBe(10)

    expect(await User.countDocuments()).toBe(14)
    expect(await Team.countDocuments()).toBe(4)
    expect(await Tournament.countDocuments()).toBe(10)
    expect(await Product.countDocuments()).toBeGreaterThan(0)
  })

  it('covers every state a visitor can land on', async () => {
    await seedDemoData()

    const upcoming = await Tournament.countDocuments({ hasStarted: false })
    const live = await Tournament.countDocuments({ hasStarted: true, hasEnded: false })
    const ended = await Tournament.countDocuments({ hasEnded: true })

    expect(upcoming).toBeGreaterThan(0)
    expect(live).toBeGreaterThan(0)
    expect(ended).toBeGreaterThan(0)
    expect(upcoming + live + ended).toBe(10)
  })

  it('covers every shape a tournament can take', async () => {
    await seedDemoData()

    const shapes = await Tournament.find({}).select('type teamSize accessibility').lean()
    const key = (t) => `${t.type}/${t.teamSize > 1 ? 'team' : 'solo'}`

    expect(new Set(shapes.map(key))).toEqual(
      new Set(['brackets/solo', 'brackets/team', 'battle royale/solo', 'battle royale/team'])
    )
    expect(shapes.some((t) => t.accessibility === 'application required')).toBe(true)
  })

  it('leaves some tournaments part-filled, so a visitor can join one', async () => {
    await seedDemoData()

    const filling = await Tournament.find({ hasStarted: false }).lean()
    const partFilled = filling.filter((tournament) => {
      const entrants = tournament.enrolledUsers.length + tournament.enrolledTeams.length
      return entrants > 0 && entrants < tournament.maxCapacity
    })

    expect(partFilled.length).toBeGreaterThan(0)
  })

  it('leaves a pending application for the host to review', async () => {
    await seedDemoData()

    const gated = await Tournament.findOne({ accessibility: 'application required' })
    expect(gated.applications.length).toBeGreaterThan(0)
    expect(gated.applications[0].fields.length).toBe(gated.applicationForm.length)
  })

  // The seeded tournaments are built through the same services the API uses, so
  // an "ended" one really was played and paid out rather than written straight
  // to the database with the flags set.
  it('produces coherent data: ended tournaments have empty banks and real payouts', async () => {
    await seedDemoData()

    const ended = await Tournament.find({ hasEnded: true })
    expect(ended.length).toBeGreaterThan(0)

    for (const tournament of ended) {
      expect(tournament.bank).toBe(0)
      expect(
        await Transaction.countDocuments({ tournamentId: tournament._id, type: 'payout' })
      ).toBeGreaterThan(0)
    }
  })

  // Bank balances have no ledger rows of their own, so this reconstructs them
  // from the rows on the other side of each movement: what went in as entry fees
  // and top-ups, less what came out as payouts and refunds.
  it('produces banks that the ledger accounts for exactly', async () => {
    await seedDemoData()

    const byType = Object.fromEntries(
      (await Transaction.aggregate([{ $group: { _id: '$type', total: { $sum: '$amount' } } }])).map(
        (row) => [row._id, row.total]
      )
    )

    const paidIn = -((byType.entry_fee ?? 0) + (byType.bank_deposit ?? 0))
    const paidOut = (byType.payout ?? 0) + (byType.refund ?? 0)

    const banked = await Tournament.aggregate([{ $group: { _id: null, total: { $sum: '$bank' } } }])

    expect(banked[0]?.total ?? 0).toBe(paidIn - paidOut)
    expect(paidIn).toBeGreaterThan(0)
    expect(paidOut).toBeGreaterThan(0)

    // And the two ways of counting the world agree.
    const wallets = await User.aggregate([{ $group: { _id: null, total: { $sum: '$credits' } } }])
    expect(await totalCredits()).toBe((wallets[0]?.total ?? 0) + (banked[0]?.total ?? 0))
  })
})

describe('running the seed twice', () => {
  it('adds nothing the second time', async () => {
    const first = await seedDemoData()
    const second = await seedDemoData()

    expect(first.tournaments).toBe(10)
    expect(second.tournaments).toBe(0)
    expect(second.products).toBe(0)

    expect(await User.countDocuments()).toBe(14)
    expect(await Team.countDocuments()).toBe(4)
    expect(await Tournament.countDocuments()).toBe(10)
  })

  it('does not duplicate the payouts of an already-ended tournament', async () => {
    await seedDemoData()
    const payouts = await Transaction.countDocuments({ type: 'payout' })

    await seedDemoData()

    expect(await Transaction.countDocuments({ type: 'payout' })).toBe(payouts)
  })
})

describe('the accounts it creates', () => {
  it('makes demo@tourney.app a host with credits, signable-in with the printed password', async () => {
    await seedDemoData()
    const credentials = seedCredentials()

    const response = await client()
      .post('/api/auth/login')
      .send({ email: credentials.demo.email, password: credentials.demo.password })
      .expect(200)

    expect(response.body.user).toMatchObject({ isHost: true, isAdmin: false })
    expect(response.body.user.credits).toBeGreaterThan(0)
  })

  it('makes an admin who can reach the admin routes', async () => {
    await seedDemoData()
    const credentials = seedCredentials()

    const admin = client()
    const response = await admin
      .post('/api/auth/login')
      .send({ email: credentials.admin.email, password: credentials.admin.password })
      .expect(200)

    expect(response.body.user.isAdmin).toBe(true)
    await admin.post('/api/admin/seed').expect(200)
  })

  it('does not let a demo player reach the admin routes', async () => {
    await seedDemoData()
    const credentials = seedCredentials()

    const player = client()
    await player
      .post('/api/auth/login')
      .send({ email: 'mei@tourney.app', password: credentials.players.password })
      .expect(200)

    await player.post('/api/admin/seed').expect(403)
  })

  it('honours the passwords and emails given in the environment', async () => {
    process.env.SEED_DEMO_EMAIL = 'someone@example.com'
    process.env.SEED_DEMO_PASSWORD = 'ChosenDemo1'
    process.env.SEED_ADMIN_EMAIL = 'root@example.com'
    process.env.SEED_ADMIN_PASSWORD = 'ChosenAdmin1'
    process.env.SEED_PASSWORD = 'ChosenPlayer1'

    await seedDemoData()

    const credentials = seedCredentials()
    expect(credentials.demo).toMatchObject({ email: 'someone@example.com', fromEnv: true })
    expect(credentials.admin).toMatchObject({ email: 'root@example.com', fromEnv: true })
    expect(credentials.players.fromEnv).toBe(true)

    await client()
      .post('/api/auth/login')
      .send({ email: 'someone@example.com', password: 'ChosenDemo1' })
      .expect(200)
    await client()
      .post('/api/auth/login')
      .send({ email: 'root@example.com', password: 'ChosenAdmin1' })
      .expect(200)
  })

  it('generates a password when the environment does not supply one', async () => {
    const credentials = seedCredentials()

    expect(credentials.demo.fromEnv).toBe(false)
    // Strong enough to pass the signup policy it will be checked against.
    expect(credentials.demo.password).toMatch(/[a-z]/)
    expect(credentials.demo.password).toMatch(/[A-Z]/)
    expect(credentials.demo.password).toMatch(/[0-9]/)
    expect(credentials.demo.password.length).toBeGreaterThanOrEqual(8)
  })

  it('generates a different password every time it is asked for one', () => {
    const passwords = new Set(Array.from({ length: 20 }, () => generatePassword()))
    expect(passwords.size).toBe(20)
  })

  // The seed and the line that prints it have to agree, so within one run the
  // generated password is stable.
  it('keeps the same generated password for the whole run', () => {
    expect(seedCredentials().demo.password).toBe(seedCredentials().demo.password)
  })
})

// The whole point of generating passwords is that none is checked in.
describe('no password is committed', () => {
  const scriptsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts')

  it.each(fs.readdirSync(scriptsDir).filter((name) => name.endsWith('.js')))(
    'scripts/%s contains no password literal',
    (name) => {
      const source = fs.readFileSync(path.join(scriptsDir, name), 'utf8')

      expect(source).not.toMatch(/password\s*[:=]\s*['"][^'"]{4,}['"]/i)
      // The old seed shipped twelve of these.
      expect(source).not.toMatch(/['"][A-Z][a-z]+\d{2,}[!@#$%^&*][\s'"]/)
    }
  )
})

describe('clearing the demo data', () => {
  it('removes everything it created but leaves admins in place', async () => {
    await seedDemoData()

    const cleared = await clearDemoData()

    expect(cleared.tournaments).toBe(10)
    expect(cleared.teams).toBe(4)
    expect(await Tournament.countDocuments()).toBe(0)
    expect(await Team.countDocuments()).toBe(0)
    expect(await Transaction.countDocuments()).toBe(0)

    const survivors = await User.find({}).lean()
    expect(survivors).toHaveLength(1)
    expect(survivors[0].role).toBe('admin')
  })

  it('can be followed by another seed', async () => {
    await seedDemoData()
    await clearDemoData()

    const again = await seedDemoData()
    expect(again.tournaments).toBe(10)
  })
})

describe('the seeded data reads back through the API', () => {
  it('is browsable by a guest', async () => {
    await seedDemoData()

    const list = await guest().get('/api/tournaments?limit=50').expect(200)
    expect(list.body.tournaments).toHaveLength(10)

    const trending = await guest().get('/api/tournaments/trending').expect(200)
    expect(trending.body.tournaments.length).toBeGreaterThan(0)
    expect(trending.body.tournaments.every((entry) => !entry.hasStarted)).toBe(true)

    const first = list.body.tournaments[0]
    const detail = await guest().get(`/api/tournaments/${first.id}`).expect(200)
    expect(detail.body.tournament.host.name).toEqual(expect.any(String))
  })
})
