import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import {
  createTeam,
  createTournament,
  creditsOf,
  guest,
  signUp,
  totalCredits,
} from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'

useDatabase()

const START = 500

let host
let stranger
let mei
let tomas
let ada
let kofi

beforeEach(async () => {
  host = await signUp('hostie', { credits: START, isHost: true })
  stranger = await signUp('mallory', { credits: START, isHost: true })
  mei = await signUp('mei', { credits: START })
  tomas = await signUp('tomas', { credits: START })
  ada = await signUp('ada', { credits: START })
  kofi = await signUp('kofi', { credits: START })
})

/** A four-slot solo bracket that is full and under way. */
async function liveTournament(overrides = {}) {
  const tournament = await createTournament(host.agent, {
    maxCapacity: 4,
    entryFee: 10,
    prize: 40,
    ...overrides,
  })

  for (const player of [mei, tomas, ada, kofi]) {
    await player.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
  }
  await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

  return tournament
}

// Each of these was reachable by anyone in the original: two of them needed no
// authentication at all.
describe('operations only the host may perform', () => {
  const hostOnly = [
    ['start', (id) => ['post', `/api/tournaments/${id}/start`, {}]],
    ['end', (id) => ['post', `/api/tournaments/${id}/end`, {}]],
    ['post an update', (id) => ['post', `/api/tournaments/${id}/updates`, { content: 'hello' }]],
    [
      'deposit into the bank',
      (id) => ['post', `/api/tournaments/${id}/bank/deposit`, { amount: 5 }],
    ],
    ['shuffle the bracket', (id) => ['post', `/api/tournaments/${id}/shuffle`, {}]],
    ['edit the tournament', (id) => ['patch', `/api/tournaments/${id}`, { title: 'Mine now' }]],
    ['record match winners', (id) => ['patch', `/api/tournaments/${id}/matches`, { matches: [] }]],
    [
      'edit participants',
      (id) => [
        'patch',
        `/api/tournaments/${id}/participants`,
        // A well-formed body, so it is the host check that rejects this and not
        // the schema — the point of the test is who is asking, not what.
        { participants: [{ id: '2f1c8d5e-0000-4000-8000-000000000000', score: 1 }] },
      ],
    ],
    ['delete the tournament', (id) => ['delete', `/api/tournaments/${id}`, {}]],
    ['read the manage view', (id) => ['get', `/api/tournaments/${id}/manage`, undefined]],
  ]

  it.each(hostOnly)('refuses a signed-in stranger trying to %s', async (_label, build) => {
    const tournament = await createTournament(host.agent)
    const [method, path, body] = build(tournament.id)

    const request = stranger.agent[method](path)
    if (body !== undefined) request.send(body)

    await request.expect(403)
  })

  it.each(hostOnly)('refuses a participant trying to %s', async (_label, build) => {
    const tournament = await createTournament(host.agent, { entryFee: 0, prize: 0 })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    const [method, path, body] = build(tournament.id)
    const request = mei.agent[method](path)
    if (body !== undefined) request.send(body)

    await request.expect(403)
  })

  it.each(hostOnly)('refuses a guest trying to %s', async (_label, build) => {
    const tournament = await createTournament(host.agent)
    const [method, path, body] = build(tournament.id)

    const request = guest()[method](path)
    if (body !== undefined) request.send(body)

    await request.expect(401)
  })
})

describe('the host edit endpoint', () => {
  it('rejects fields a host is not allowed to change', async () => {
    const tournament = await createTournament(host.agent)

    // Editing the prize after people have paid to enter would move the
    // goalposts; the schema is strict, so it is a 400 rather than a silent drop.
    await host.agent.patch(`/api/tournaments/${tournament.id}`).send({ prize: 999_999 }).expect(400)
    await host.agent
      .patch(`/api/tournaments/${tournament.id}`)
      .send({ maxCapacity: 128 })
      .expect(400)
    await host.agent.patch(`/api/tournaments/${tournament.id}`).send({ bank: 999 }).expect(400)

    const unchanged = await Tournament.findById(tournament.id)
    expect(unchanged.prize).toBe(40)
    expect(unchanged.bank).toBe(0)
  })

  it('refuses edits once the tournament has started', async () => {
    const tournament = await liveTournament()
    await host.agent
      .patch(`/api/tournaments/${tournament.id}`)
      .send({ title: 'Too late' })
      .expect(400)
  })
})

describe('joining', () => {
  it('refuses the host their own tournament', async () => {
    const tournament = await createTournament(host.agent)

    await host.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(400)
    expect(await creditsOf(host.user.id)).toBe(START)
  })

  it('refuses a second entry and charges only once', async () => {
    const tournament = await createTournament(host.agent, { entryFee: 10 })

    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(409)

    expect(await creditsOf(mei.user.id)).toBe(START - 10)
    expect((await Tournament.findById(tournament.id)).enrolledUsers).toHaveLength(1)
  })

  it('refuses once every slot is taken', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 2, entryFee: 10 })

    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    await ada.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(409)
    expect(await creditsOf(ada.user.id)).toBe(START)
  })

  it('refuses after the tournament has started', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 2, entryFee: 0, prize: 0 })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    await ada.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(400)
  })

  it('refuses a player who cannot cover the fee, and charges nothing', async () => {
    const broke = await signUp('skint', { credits: 5 })
    const tournament = await createTournament(host.agent, { entryFee: 10 })

    await broke.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(400)

    expect(await creditsOf(broke.user.id)).toBe(5)
    expect((await Tournament.findById(tournament.id)).bank).toBe(0)
  })

  it('refuses a team entry into a solo tournament, and the reverse', async () => {
    const team = await createTeam(mei.agent, [tomas.agent], 'Night Owls')

    const solo = await createTournament(host.agent)
    await mei.agent
      .post(`/api/tournaments/${solo.id}/join/team`)
      .send({ teamId: team.id })
      .expect(400)

    const teamBased = await createTournament(host.agent, {
      teamSize: 2,
      maxCapacity: 2,
      entryFee: 0,
      prize: 0,
    })
    await mei.agent.post(`/api/tournaments/${teamBased.id}/join/solo`).expect(400)
  })

  describe('as a team', () => {
    it('refuses anyone but the leader, who is the one who pays', async () => {
      const team = await createTeam(mei.agent, [tomas.agent], 'Night Owls')
      const tournament = await createTournament(host.agent, {
        teamSize: 2,
        maxCapacity: 2,
        entryFee: 10,
        prize: 40,
      })

      await tomas.agent
        .post(`/api/tournaments/${tournament.id}/join/team`)
        .send({ teamId: team.id })
        .expect(403)

      expect(await creditsOf(tomas.user.id)).toBe(START)
    })

    it('refuses a team of the wrong size', async () => {
      const team = await createTeam(mei.agent, [], 'Night Owls')
      const tournament = await createTournament(host.agent, {
        teamSize: 2,
        maxCapacity: 2,
        entryFee: 10,
        prize: 40,
      })

      const response = await mei.agent
        .post(`/api/tournaments/${tournament.id}/join/team`)
        .send({ teamId: team.id })
        .expect(400)

      expect(response.body.error.message).toMatch(/exactly 2/)
      expect(await creditsOf(mei.user.id)).toBe(START)
    })

    it('refuses a team whose member is already competing individually', async () => {
      const tournament = await createTournament(host.agent, {
        teamSize: 2,
        maxCapacity: 2,
        entryFee: 0,
        prize: 0,
      })

      const first = await createTeam(mei.agent, [tomas.agent], 'Night Owls')
      await mei.agent
        .post(`/api/tournaments/${tournament.id}/join/team`)
        .send({ teamId: first.id })
        .expect(200)

      const second = await createTeam(ada.agent, [tomas.agent], 'Day Larks')
      await ada.agent
        .post(`/api/tournaments/${tournament.id}/join/team`)
        .send({ teamId: second.id })
        .expect(409)
    })
  })
})

describe('starting', () => {
  it('refuses a bracket that is not full', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4, entryFee: 0, prize: 0 })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    const response = await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(400)
    expect(response.body.error.message).toMatch(/1 of 4/)
  })

  it('refuses a battle royale with fewer than two entrants', async () => {
    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      maxCapacity: 8,
      entryFee: 0,
      prize: undefined,
      prizes: [{ rank: 1, prize: 0 }],
    })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(400)
  })

  it('refuses while the bank is short of the advertised prizes', async () => {
    const tournament = await createTournament(host.agent, {
      maxCapacity: 2,
      entryFee: 1,
      prize: 100,
    })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    const response = await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(400)
    expect(response.body.error.message).toMatch(/2 of the 100/)
  })

  it('refuses a second start', async () => {
    const tournament = await liveTournament()
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(400)
  })
})

describe('recording results', () => {
  it('refuses a winner who is not competing in this tournament', async () => {
    const tournament = await liveTournament()
    const outsider = await signUp('outsider')

    const order = (await Tournament.findById(tournament.id)).bracketOrder.filter(Boolean)
    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: [outsider.user.id, order[0], order[0]] })
      .expect(400)
  })

  it('refuses a matches array of the wrong length', async () => {
    const tournament = await liveTournament()

    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: [null] })
      .expect(400)
  })

  it('refuses match results before the tournament starts', async () => {
    const tournament = await createTournament(host.agent)

    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: [null, null, null] })
      .expect(400)
  })

  it('refuses a score for someone who is not competing', async () => {
    const tournament = await liveTournament()
    const outsider = await signUp('outsider')

    await host.agent
      .patch(`/api/tournaments/${tournament.id}/participants`)
      .send({ participants: [{ id: outsider.user.id, score: 99 }] })
      .expect(400)
  })
})

describe('ending', () => {
  it('refuses a bracket whose final has no recorded winner', async () => {
    const tournament = await liveTournament()

    const response = await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(400)
    expect(response.body.error.message).toMatch(/final/i)

    // Nothing was paid out on the failed attempt.
    expect((await Tournament.findById(tournament.id)).bank).toBe(40)
  })

  it('refuses a tournament that has not started', async () => {
    const tournament = await createTournament(host.agent)
    await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(400)
  })

  it('refuses a second end, and pays out only once', async () => {
    const worldBefore = await totalCredits()
    const tournament = await liveTournament()

    const order = (await Tournament.findById(tournament.id)).bracketOrder.filter(Boolean)
    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: [order[0], order[2], order[0]] })
      .expect(200)

    await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(400)

    expect(await totalCredits()).toBe(worldBefore)
    expect((await Tournament.findById(tournament.id)).bank).toBe(0)
  })
})

describe('the bank', () => {
  it('caps an oversized deposit instead of destroying the difference', async () => {
    const tournament = await createTournament(host.agent, { entryFee: 0, prize: 30 })

    const response = await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 500 })
      .expect(200)

    expect(response.body.deposited).toBe(30)
    expect(await creditsOf(host.user.id)).toBe(START - 30)
  })

  it('refuses a deposit into a bank that is already full', async () => {
    const tournament = await createTournament(host.agent, { entryFee: 0, prize: 10 })
    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 10 })
      .expect(200)

    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 1 })
      .expect(400)

    expect(await creditsOf(host.user.id)).toBe(START - 10)
  })

  it('refuses a zero or negative deposit', async () => {
    const tournament = await createTournament(host.agent, { entryFee: 0, prize: 30 })

    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: 0 })
      .expect(400)
    await host.agent
      .post(`/api/tournaments/${tournament.id}/bank/deposit`)
      .send({ amount: -50 })
      .expect(400)

    expect(await creditsOf(host.user.id)).toBe(START)
  })
})

describe('applications', () => {
  async function gated() {
    return createTournament(host.agent, {
      type: 'battle royale',
      maxCapacity: 2,
      entryFee: 0,
      accessibility: 'application required',
      applicationForm: ['Name'],
      prize: undefined,
      prizes: [{ rank: 1, prize: 0 }],
    })
  }

  it('refuses an application whose answers do not match the form', async () => {
    const tournament = await gated()

    await mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [{ label: 'Nickname', input: 'mei' }] })
      .expect(400)

    await mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [] })
      .expect(400)
  })

  it('refuses a blank answer', async () => {
    const tournament = await gated()

    await mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [{ label: 'Name', input: '   ' }] })
      .expect(400)
  })

  it('refuses a second application from the same applicant', async () => {
    const tournament = await gated()
    const application = { fields: [{ label: 'Name', input: 'mei' }] }

    await mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send(application)
      .expect(201)
    await mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send(application)
      .expect(409)
  })

  it('refuses applications to an open tournament', async () => {
    const tournament = await createTournament(host.agent)

    await mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [] })
      .expect(400)
  })

  // A host could accept more applicants than there were slots, and the last of
  // them would be turned away at the door having already been told they were in.
  it('stops accepting once every slot is spoken for', async () => {
    const tournament = await gated()

    for (const player of [mei, tomas, ada]) {
      await player.agent
        .post(`/api/tournaments/${tournament.id}/applications`)
        .send({ fields: [{ label: 'Name', input: 'x' }] })
        .expect(201)
    }

    const queue = await host.agent.get(`/api/tournaments/${tournament.id}/manage`).expect(200)
    const outcomes = []
    for (const application of queue.body.tournament.applications) {
      const response = await host.agent.post(
        `/api/tournaments/${tournament.id}/applications/${application.id}/accept`
      )
      outcomes.push(response.status)
    }

    expect(outcomes.filter((status) => status === 200)).toHaveLength(2)
    expect(outcomes.filter((status) => status === 409)).toHaveLength(1)
  })
})

describe('what a guest can see', () => {
  it('can browse the public view without an account', async () => {
    const tournament = await createTournament(host.agent)

    const response = await guest().get(`/api/tournaments/${tournament.id}`).expect(200)

    expect(response.body.tournament.title).toBe('Test Cup')
    expect(response.body.tournament.viewer).toEqual({
      isHost: false,
      isJoined: false,
      hasApplied: false,
      isAccepted: false,
    })
  })

  it('can browse the list, search, and filters', async () => {
    await createTournament(host.agent, { title: 'Chess Night', category: 'chess' })
    await createTournament(host.agent, { title: 'Racing Cup', category: 'racing' })

    await guest().get('/api/tournaments').expect(200)
    await guest().get('/api/tournaments/trending').expect(200)
    await guest().get('/api/tournaments/categories').expect(200)

    const filtered = await guest().get('/api/tournaments?category=chess').expect(200)
    expect(filtered.body.tournaments.map((entry) => entry.title)).toEqual(['Chess Night'])
  })

  it('gets a 400 for a malformed id rather than a 500', async () => {
    await guest().get('/api/tournaments/not-a-uuid').expect(400)
  })

  it('gets a 404 for an id that does not exist', async () => {
    await guest().get('/api/tournaments/2f1c8d5e-0000-4000-8000-000000000000').expect(404)
  })
})
