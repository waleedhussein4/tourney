// Credits are the app's whole economy, and every screen shows a number derived
// from them. These tests pin down where credits can enter and leave it.
//
// There is exactly one source and one sink:
//
//   source — the demo checkout, which grants a package's credits
//   sink   — the host upgrade fee, which is paid to the platform and burned
//
// Everything else only *moves* credits: an entry fee goes from a player to a
// tournament bank, a payout comes back out of it, a refund reverses one. So for
// every operation other than those two, the total across all wallets and all
// banks is unchanged.
//
// Two independent measures are checked against each other. One sums what the
// documents say; the other sums what the Transaction rows say. Every row records
// the signed change to one user's balance, so the rows must reconstruct every
// balance exactly — if a write ever commits without its ledger row, or a row
// without its write, the two stop agreeing.

import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTeam, createTournament, creditsOf, signUp, totalCredits } from './setup/api.js'
import Transaction from '../src/models/transaction.model.js'
import Tournament from '../src/models/tournament.model.js'
import User from '../src/models/user.model.js'
import { DEFAULT_PRODUCTS } from '../src/config/products.js'
import { HOST_UPGRADE_COST } from '../src/config/constants.js'

useDatabase()

const START = 400
const STARTER = DEFAULT_PRODUCTS[0]

let host
let cast

beforeEach(async () => {
  host = await signUp('hostie', { credits: START, isHost: true })
  cast = {}
  for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
    cast[name] = await signUp(name, { credits: START })
  }
})

/** Every account's opening balance, before any ledger row was written. */
function openingBalance() {
  return START * 5
}

/** What every wallet holds right now, ignoring the tournament banks. */
async function walletsTotal() {
  const rows = await User.aggregate([{ $group: { _id: null, total: { $sum: '$credits' } } }])
  return rows[0]?.total ?? 0
}

/** The signed sum of every ledger row. */
async function ledgerSum(match = {}) {
  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])
  return rows[0]?.total ?? 0
}

/** Reconstructs one account's balance from its ledger rows alone. */
async function balanceFromLedger(userId) {
  return START + (await ledgerSum({ userId }))
}

/**
 * The books balance when the ledger reconstructs every wallet.
 *
 * Bank balances have no rows of their own — a bank is not an account — so this
 * compares the ledger against the wallets, and the bank is covered by the
 * world-total assertions instead.
 */
async function expectBooksToBalance() {
  expect(await walletsTotal()).toBe(openingBalance() + (await ledgerSum()))
}

/**
 * The credits in existence: wallets plus banks. Equal to what the world started
 * with, plus everything the checkout granted, minus every host upgrade fee.
 */
async function expectWorldTotalToBeExplained() {
  const [granted, burned] = await Promise.all([
    ledgerSum({ type: 'purchase' }),
    ledgerSum({ type: 'host_upgrade' }),
  ])
  expect(await totalCredits()).toBe(openingBalance() + granted + burned)
}

describe('the ledger and the balances agree', () => {
  it('after a purchase, which is the only thing that creates credits', async () => {
    await cast.mei.agent.post(`/api/credits/checkout/${STARTER._id}`).expect(201)

    expect(await totalCredits()).toBe(openingBalance() + STARTER.credits)
    await expectBooksToBalance()
    await expectWorldTotalToBeExplained()
    expect(await balanceFromLedger(cast.mei.user.id)).toBe(await creditsOf(cast.mei.user.id))
  })

  // The host upgrade fee is paid to the platform, which has no wallet, so those
  // credits leave the world. That is the only sink, and the ledger records it.
  it('after becoming a host, which is the only thing that destroys credits', async () => {
    await cast.mei.agent.post('/api/users/me/become-host').expect(200)

    expect(await totalCredits()).toBe(openingBalance() - HOST_UPGRADE_COST)
    await expectBooksToBalance()
    await expectWorldTotalToBeExplained()
  })

  it('after an entry fee', async () => {
    const tournament = await createTournament(host.agent, { entryFee: 25 })
    await cast.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    expect(await totalCredits()).toBe(openingBalance())
    await expectBooksToBalance()
    await expectWorldTotalToBeExplained()
    expect(await balanceFromLedger(cast.mei.user.id)).toBe(await creditsOf(cast.mei.user.id))
  })

  it('after a host tops the bank up', async () => {
    const tournament = await createTournament(host.agent, { entryFee: 0, prize: 30 })
    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 30 })
      .expect(200)

    expect(await totalCredits()).toBe(openingBalance())
    await expectBooksToBalance()
    await expectWorldTotalToBeExplained()
  })
})

describe('a complete solo bracket', () => {
  it('leaves the world with exactly the credits it started with', async () => {
    const tournament = await createTournament(host.agent, {
      maxCapacity: 4,
      entryFee: 20,
      prize: 100,
    })

    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      await cast[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
      await expectBooksToBalance()
    }

    // Four 20-credit fees leave the bank 20 short of the 100-credit prize.
    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 20 })
      .expect(200)
    await expectBooksToBalance()

    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const order = (await Tournament.findById(tournament.id)).bracketOrder.filter(Boolean)
    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: [order[0], order[2], order[0]] })
      .expect(200)

    await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)

    expect(await totalCredits()).toBe(openingBalance())
    expect((await Tournament.findById(tournament.id)).bank).toBe(0)
    await expectBooksToBalance()

    // And every individual account reconciles too, not just the total.
    for (const account of await User.find({}).lean()) {
      expect(await balanceFromLedger(String(account._id))).toBe(account.credits)
    }
  })
})

describe('a complete team battle royale', () => {
  it('conserves credits through a split payout', async () => {
    const owls = await createTeam(cast.mei.agent, [cast.tomas.agent], 'Night Owls')
    const larks = await createTeam(cast.ada.agent, [cast.kofi.agent], 'Day Larks')

    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      teamSize: 2,
      maxCapacity: 2,
      entryFee: 10,
      prize: undefined,
      // Odd numbers, so both splits leave a remainder to place.
      prizes: [
        { rank: 1, prize: 45 },
        { rank: 2, prize: 15 },
      ],
    })

    await cast.mei.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: owls.id })
      .expect(200)
    await cast.ada.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: larks.id })
      .expect(200)

    // Two teams of two at 10 each bank 40 against a 60-credit prize pool.
    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 20 })
      .expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    await host.agent
      .patch(`/api/tournaments/${tournament.id}/participants`)
      .send({
        participants: [
          { id: owls.id, score: 90 },
          { id: larks.id, score: 20 },
        ],
      })
      .expect(200)

    await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)

    expect(await totalCredits()).toBe(openingBalance())
    expect((await Tournament.findById(tournament.id)).bank).toBe(0)
    await expectBooksToBalance()

    for (const account of await User.find({}).lean()) {
      expect(await balanceFromLedger(String(account._id))).toBe(account.credits)
    }
  })
})

describe('a cancelled tournament', () => {
  it('returns every credit to whoever paid it', async () => {
    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      maxCapacity: 4,
      entryFee: 40,
      prize: undefined,
      prizes: [{ rank: 1, prize: 200 }],
    })

    await cast.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await cast.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 120 })
      .expect(200)

    await host.agent.delete(`/api/tournaments/${tournament.id}`).expect(200)

    expect(await totalCredits()).toBe(openingBalance())
    for (const name of ['mei', 'tomas']) {
      expect(await creditsOf(cast[name].user.id)).toBe(START)
    }
    expect(await creditsOf(host.user.id)).toBe(START)
    await expectBooksToBalance()
  })

  // A team's fee is paid by whoever was leader at the time. Handing over
  // leadership afterwards must not redirect the refund.
  it('refunds the account that actually paid, not the current leader', async () => {
    const team = await createTeam(cast.mei.agent, [cast.tomas.agent], 'Night Owls')

    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      teamSize: 2,
      maxCapacity: 4,
      entryFee: 30,
      prize: undefined,
      prizes: [{ rank: 1, prize: 10 }],
    })

    await cast.mei.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: team.id })
      .expect(200)
    expect(await creditsOf(cast.mei.user.id)).toBe(START - 60)

    await cast.mei.agent
      .patch(`/api/teams/${team.id}/leader`)
      .send({ username: 'tomas' })
      .expect(200)

    await host.agent.delete(`/api/tournaments/${tournament.id}`).expect(200)

    expect(await creditsOf(cast.mei.user.id)).toBe(START)
    expect(await creditsOf(cast.tomas.user.id)).toBe(START)
    await expectBooksToBalance()
  })
})

describe('failed operations move nothing', () => {
  it('a refused join leaves the books untouched', async () => {
    const broke = await signUp('skint', { credits: 0 })
    const tournament = await createTournament(host.agent, { entryFee: 10 })
    const before = await totalCredits()

    await broke.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(400)

    expect(await totalCredits()).toBe(before)
    expect(await Transaction.countDocuments()).toBe(0)
  })

  it('a refused deposit leaves the books untouched', async () => {
    const tournament = await createTournament(host.agent, { entryFee: 0, prize: 10 })
    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 10 })
      .expect(200)

    const before = await totalCredits()
    const rows = await Transaction.countDocuments()

    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 5 })
      .expect(400)

    expect(await totalCredits()).toBe(before)
    expect(await Transaction.countDocuments()).toBe(rows)
  })

  it('a refused end pays nothing out', async () => {
    const tournament = await createTournament(host.agent, {
      maxCapacity: 2,
      entryFee: 20,
      prize: 40,
    })
    await cast.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await cast.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const before = await totalCredits()

    // The final has no recorded winner yet.
    await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(400)

    expect(await totalCredits()).toBe(before)
    expect((await Tournament.findById(tournament.id)).bank).toBe(40)
    expect(await Transaction.countDocuments({ type: 'payout' })).toBe(0)
  })
})

describe('concurrency', () => {
  // Several people racing for the last slot: the bank must end up holding
  // exactly as many fees as there are entrants, no more.
  it('never banks a fee without seating the entrant', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 2, entryFee: 10 })
    const before = await totalCredits()

    await Promise.allSettled(
      ['mei', 'tomas', 'ada', 'kofi'].map((name) =>
        cast[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`)
      )
    )

    const seated = await Tournament.findById(tournament.id)
    expect(seated.enrolledUsers.length).toBeLessThanOrEqual(2)
    expect(seated.bank).toBe(seated.enrolledUsers.length * 10)

    expect(await totalCredits()).toBe(before)
    await expectBooksToBalance()
  })
})
