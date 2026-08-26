import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import {
  createTeam,
  createTournament,
  creditsOf,
  signUp,
  tournamentPayload,
  totalCredits,
} from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'

useDatabase()

const START = 1000

let host
let players

beforeEach(async () => {
  host = await signUp('hostie', { credits: START, isHost: true })
  players = {}
  for (const name of ['mei', 'tomas', 'ada', 'kofi', 'lena', 'oscar']) {
    players[name] = await signUp(name, { credits: START })
  }
})

const bankOf = async (id) => (await Tournament.findById(id)).bank

/** Everyone who competed, in the order the bracket drew them. */
async function bracketOrder(id) {
  const tournament = await Tournament.findById(id)
  return tournament.bracketOrder.filter(Boolean)
}

/**
 * Records a bracket result that marches `winnerId` to the title.
 *
 * The draw is random, so the winner's first-round match is found rather than
 * assumed.
 */
function matchesFor(order, slots, winnerId) {
  const matches = new Array(slots - 1).fill(null)
  let index = 0
  for (let pair = 0; pair < order.length; pair += 2) {
    const contenders = [order[pair], order[pair + 1]]
    matches[index] = contenders.includes(winnerId) ? winnerId : order[pair]
    index += 1
  }
  for (; index < matches.length; index += 1) matches[index] = winnerId
  return matches
}

describe('a solo bracket, from creation to payout', () => {
  it('moves every credit through the bank and back out again', async () => {
    const worldBefore = await totalCredits()

    // --- the host advertises a 60-credit prize on a 40-credit fee income ----
    const tournament = await createTournament(host.agent, {
      title: 'Solo Ladder Open',
      maxCapacity: 4,
      entryFee: 10,
      prize: 60,
    })

    expect(tournament.bank).toBe(0)
    expect(tournament.totalPrize).toBe(60)
    expect(tournament.matches).toEqual([null, null, null])

    // --- four players enter, each paying the fee into the bank -------------
    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
      expect(await creditsOf(players[name].user.id)).toBe(START - 10)
    }

    expect(await bankOf(tournament.id)).toBe(40)
    expect(await totalCredits()).toBe(worldBefore)

    // --- the bank is short, so it cannot start yet -------------------------
    const tooSoon = await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(400)
    expect(tooSoon.body.error.message).toMatch(/40 of the 60/)

    // --- the host tops up the difference out of their own credits ----------
    const deposit = await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 20 })
      .expect(200)

    expect(deposit.body.deposited).toBe(20)
    expect(await bankOf(tournament.id)).toBe(60)
    expect(await creditsOf(host.user.id)).toBe(START - 20)
    expect(await totalCredits()).toBe(worldBefore)

    // --- start -------------------------------------------------------------
    const started = await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)
    expect(started.body.tournament.hasStarted).toBe(true)
    expect(started.body.tournament.bracketOrder.filter(Boolean)).toHaveLength(4)

    // --- play it out -------------------------------------------------------
    const order = await bracketOrder(tournament.id)
    const champion = players.mei.user.id

    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: matchesFor(order, 4, champion) })
      .expect(200)

    // --- end and pay out ---------------------------------------------------
    const ended = await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)

    expect(ended.body.tournament.hasEnded).toBe(true)
    expect(await creditsOf(champion)).toBe(START - 10 + 60)
    expect(await bankOf(tournament.id)).toBe(0)

    // Nothing was created or destroyed anywhere along the way.
    expect(await totalCredits()).toBe(worldBefore)
  })

  it('hands the host whatever the prizes did not claim', async () => {
    const worldBefore = await totalCredits()

    // Four 20-credit fees fund an 80-credit bank against a 50-credit prize.
    const tournament = await createTournament(host.agent, {
      maxCapacity: 4,
      entryFee: 20,
      prize: 50,
    })

    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }
    expect(await bankOf(tournament.id)).toBe(80)

    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const order = await bracketOrder(tournament.id)
    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: matchesFor(order, 4, players.mei.user.id) })
      .expect(200)

    const ended = await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)

    expect(ended.body.hostRemainder).toBe(30)
    expect(await creditsOf(host.user.id)).toBe(START + 30)
    expect(await creditsOf(players.mei.user.id)).toBe(START - 20 + 50)
    expect(await bankOf(tournament.id)).toBe(0)
    expect(await totalCredits()).toBe(worldBefore)
  })
})

describe('a team bracket', () => {
  it('splits the prize evenly between the members, to the credit', async () => {
    const worldBefore = await totalCredits()

    const owls = await createTeam(players.mei.agent, [players.tomas.agent], 'Night Owls')
    const larks = await createTeam(players.ada.agent, [players.kofi.agent], 'Day Larks')

    const tournament = await createTournament(host.agent, {
      title: 'Team Title Run',
      teamSize: 2,
      maxCapacity: 2,
      entryFee: 10,
      // An odd number, so an even split is impossible and the remainder has to
      // go somewhere deliberate rather than being rounded away.
      prize: 41,
    })

    // The documented rule: the leader pays the fee for every seat.
    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: owls.id })
      .expect(200)
    expect(await creditsOf(players.mei.user.id)).toBe(START - 20)
    expect(await creditsOf(players.tomas.user.id)).toBe(START)

    await players.ada.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: larks.id })
      .expect(200)

    expect(await bankOf(tournament.id)).toBe(40)

    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 1 })
      .expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const order = await bracketOrder(tournament.id)
    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: matchesFor(order, 2, owls.id) })
      .expect(200)

    await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)

    // 41 between two members is 21 and 20 — not 20.5 each, and not all 41 to
    // the leader, which is what the original did.
    const mei = (await creditsOf(players.mei.user.id)) - (START - 20)
    const tomas = (await creditsOf(players.tomas.user.id)) - START

    expect(mei + tomas).toBe(41)
    expect(Math.abs(mei - tomas)).toBe(1)
    expect(await bankOf(tournament.id)).toBe(0)
    expect(await totalCredits()).toBe(worldBefore)
  })
})

describe('a battle royale', () => {
  it('pays the rank table down the leaderboard', async () => {
    const worldBefore = await totalCredits()

    const tournament = await createTournament(host.agent, {
      title: 'Score Attack',
      type: 'battle royale',
      maxCapacity: 4,
      entryFee: 10,
      prize: undefined,
      prizes: [
        { rank: 1, prize: 25 },
        { rank: 2, prize: 10 },
        { rank: 3, prize: 5 },
      ],
    })

    expect(tournament.totalPrize).toBe(40)

    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }

    // Exactly the prize pool, which is the case the original could never
    // satisfy: it compared the bank to the array of prize objects.
    expect(await bankOf(tournament.id)).toBe(40)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    await host.agent
      .patch(`/api/tournaments/${tournament.id}/participants`)
      .send({
        participants: [
          { id: players.kofi.user.id, score: 90 },
          { id: players.ada.user.id, score: 70 },
          { id: players.tomas.user.id, score: 40 },
          { id: players.mei.user.id, score: 10 },
        ],
      })
      .expect(200)

    await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)

    expect(await creditsOf(players.kofi.user.id)).toBe(START - 10 + 25)
    expect(await creditsOf(players.ada.user.id)).toBe(START - 10 + 10)
    expect(await creditsOf(players.tomas.user.id)).toBe(START - 10 + 5)
    expect(await creditsOf(players.mei.user.id)).toBe(START - 10)

    expect(await bankOf(tournament.id)).toBe(0)
    expect(await totalCredits()).toBe(worldBefore)
  })

  it('splits each rank prize across the winning team', async () => {
    const worldBefore = await totalCredits()

    const owls = await createTeam(
      players.mei.agent,
      [players.tomas.agent, players.ada.agent],
      'Night Owls'
    )
    const larks = await createTeam(
      players.kofi.agent,
      [players.lena.agent, players.oscar.agent],
      'Day Larks'
    )

    const tournament = await createTournament(host.agent, {
      title: 'Squad Score Attack',
      type: 'battle royale',
      teamSize: 3,
      maxCapacity: 2,
      entryFee: 5,
      prize: undefined,
      prizes: [
        { rank: 1, prize: 20 },
        { rank: 2, prize: 10 },
      ],
    })

    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: owls.id })
      .expect(200)
    await players.kofi.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: larks.id })
      .expect(200)

    expect(await bankOf(tournament.id)).toBe(30)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    await host.agent
      .patch(`/api/tournaments/${tournament.id}/participants`)
      .send({
        participants: [
          { id: larks.id, score: 88 },
          { id: owls.id, score: 51 },
        ],
      })
      .expect(200)

    await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)

    // First place: 20 across three members. Second: 10 across three.
    const larksTotal =
      (await creditsOf(players.kofi.user.id)) -
      (START - 15) +
      ((await creditsOf(players.lena.user.id)) - START) +
      ((await creditsOf(players.oscar.user.id)) - START)

    const owlsTotal =
      (await creditsOf(players.mei.user.id)) -
      (START - 15) +
      ((await creditsOf(players.tomas.user.id)) - START) +
      ((await creditsOf(players.ada.user.id)) - START)

    expect(larksTotal).toBe(20)
    expect(owlsTotal).toBe(10)
    expect(await bankOf(tournament.id)).toBe(0)
    expect(await totalCredits()).toBe(worldBefore)
  })
})

describe('an application-gated tournament', () => {
  it('takes an applicant from applying, through acceptance, to competing', async () => {
    const worldBefore = await totalCredits()

    const tournament = await createTournament(host.agent, {
      title: 'By Invitation',
      type: 'battle royale',
      maxCapacity: 4,
      entryFee: 10,
      accessibility: 'application required',
      applicationForm: ['In-game name', 'Region'],
      prize: undefined,
      prizes: [{ rank: 1, prize: 20 }],
    })

    // Walking in is refused.
    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(403)

    const applied = await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({
        fields: [
          { label: 'In-game name', input: 'mei' },
          { label: 'Region', input: 'EU' },
        ],
      })
      .expect(201)

    expect(applied.body.tournament.viewer.hasApplied).toBe(true)
    // Nothing has been charged yet — applying is not entering.
    expect(await creditsOf(players.mei.user.id)).toBe(START)

    const queue = await host.agent.get(`/api/tournaments/${tournament.id}/manage`).expect(200)
    expect(queue.body.tournament.applications).toHaveLength(1)
    expect(queue.body.tournament.applications[0]).toMatchObject({
      name: 'mei',
      fields: [
        { label: 'In-game name', input: 'mei' },
        { label: 'Region', input: 'EU' },
      ],
    })

    const applicationId = queue.body.tournament.applications[0].id
    await host.agent
      .post(`/api/tournaments/${tournament.id}/applications/${applicationId}/accept`)
      .expect(200)

    const joined = await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/join/solo`)
      .expect(200)

    expect(joined.body.tournament.viewer.isJoined).toBe(true)
    expect(await creditsOf(players.mei.user.id)).toBe(START - 10)
    expect(await totalCredits()).toBe(worldBefore)
  })

  it('lets the host reject an application, which charges nobody', async () => {
    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      accessibility: 'application required',
      applicationForm: ['Name'],
      prize: undefined,
      prizes: [{ rank: 1, prize: 0 }],
      entryFee: 0,
    })

    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [{ label: 'Name', input: 'mei' }] })
      .expect(201)

    const queue = await host.agent.get(`/api/tournaments/${tournament.id}/manage`).expect(200)
    const applicationId = queue.body.tournament.applications[0].id

    await host.agent
      .post(`/api/tournaments/${tournament.id}/applications/${applicationId}/reject`)
      .expect(200)

    const after = await host.agent.get(`/api/tournaments/${tournament.id}/manage`).expect(200)
    expect(after.body.tournament.applications).toHaveLength(0)

    // Rejected, so still shut out.
    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(403)
    expect(await creditsOf(players.mei.user.id)).toBe(START)
  })
})

describe('cancelling before the start', () => {
  it('refunds every entry fee and the host top-up', async () => {
    const worldBefore = await totalCredits()

    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      maxCapacity: 4,
      entryFee: 25,
      prize: undefined,
      prizes: [{ rank: 1, prize: 80 }],
    })

    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await players.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 30 })
      .expect(200)

    const cancelled = await host.agent.delete(`/api/tournaments/${tournament.id}`).expect(200)

    expect(cancelled.body.refunds).toHaveLength(2)
    expect(await creditsOf(players.mei.user.id)).toBe(START)
    expect(await creditsOf(players.tomas.user.id)).toBe(START)
    expect(await creditsOf(host.user.id)).toBe(START)
    expect(await Tournament.findById(tournament.id)).toBeNull()
    expect(await totalCredits()).toBe(worldBefore)
  })

  it('refuses once the tournament has started', async () => {
    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      maxCapacity: 2,
      entryFee: 0,
      prize: undefined,
      prizes: [{ rank: 1, prize: 0 }],
    })

    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await players.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    await host.agent.delete(`/api/tournaments/${tournament.id}`).expect(400)
    expect(await Tournament.findById(tournament.id)).not.toBeNull()
  })
})

describe('creating a tournament', () => {
  it('refuses a caller who is not a host', async () => {
    await players.mei.agent.post('/api/tournaments').send(tournamentPayload()).expect(403)
  })

  it('refuses a bracket whose capacity is not a power of two', async () => {
    await host.agent
      .post('/api/tournaments')
      .send(tournamentPayload({ maxCapacity: 6 }))
      .expect(400)
  })

  it('refuses an end date that is not after the start', async () => {
    const start = new Date(Date.now() + 2 * 86_400_000).toISOString()
    await host.agent
      .post('/api/tournaments')
      .send(tournamentPayload({ startDate: start, endDate: start }))
      .expect(400)
  })

  it('refuses a battle royale described with a bracket prize', async () => {
    await host.agent
      .post('/api/tournaments')
      .send(tournamentPayload({ type: 'battle royale', prize: 100 }))
      .expect(400)
  })

  it('refuses an application-gated tournament with no questions', async () => {
    await host.agent
      .post('/api/tournaments')
      .send(tournamentPayload({ accessibility: 'application required', applicationForm: [] }))
      .expect(400)
  })

  it('sanitises the description and rules it stores', async () => {
    const tournament = await createTournament(host.agent, {
      description: 'Fair play <script>alert(1)</script> only',
      rules: '<p>Be <b>nice</b></p><img src=x onerror=alert(1)>',
    })

    expect(tournament.description).not.toContain('<script')
    expect(tournament.rules).not.toContain('onerror')
    expect(tournament.rules).toContain('<b>nice</b>')
  })
})
