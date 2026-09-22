import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, signUp } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'

useDatabase()

let host
let players

beforeEach(async () => {
  host = await signUp('hostie', { isHost: true, plan: true })
  players = {}
  for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
    players[name] = await signUp(name)
  }
})

async function startedBracket(overrides = {}) {
  const tournament = await createTournament(host.agent, {
    title: 'Attention Cup',
    maxCapacity: 4,
    ...overrides,
  })
  for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
    await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
  }
  await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)
  const doc = await Tournament.findById(tournament.id)
  return { tournamentId: tournament.id, doc }
}

async function finalizeMatch(tournamentId, match) {
  const [a, b] = match.participants
  const reporter = Object.values(players).find((p) => p.user.id === a)
  const confirmer = Object.values(players).find((p) => p.user.id === b)

  await reporter.agent
    .post(`/api/tournaments/${tournamentId}/matches/${match.id}/report`)
    .send({
      scores: [
        { participantId: a, score: 5 },
        { participantId: b, score: 2 },
      ],
    })
    .expect(200)

  await confirmer.agent
    .post(`/api/tournaments/${tournamentId}/matches/${match.id}/confirm`)
    .send({ agree: true })
    .expect(200)
}

describe('host attention summary', () => {
  it('counts pending applications', async () => {
    const tournament = await createTournament(host.agent, {
      title: 'Gated Cup',
      accessibility: 'application required',
      applicationForm: ['Why?'],
    })
    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [{ label: 'Why?', input: 'Because.' }] })
      .expect(201)

    const manage = await host.agent.get(`/api/tournaments/${tournament.id}/manage`).expect(200)
    expect(manage.body.tournament.attention).toMatchObject({
      pendingApplications: 1,
      disputedMatches: [],
      unscheduledMatches: [],
      awaitingConfirmation: [],
      roundsReady: [],
      total: 1,
    })
  })

  it('counts matches with both competitors set but no scheduled time', async () => {
    const { tournamentId, doc } = await startedBracket()
    const manage = await host.agent.get(`/api/tournaments/${tournamentId}/manage`).expect(200)
    const round1Ids = doc.matches.filter((m) => m.round === 1).map((m) => String(m._id))

    expect(manage.body.tournament.attention.unscheduledMatches.sort()).toEqual(round1Ids.sort())
    expect(manage.body.tournament.attention.total).toBe(2)
  })

  it('counts a disputed match', async () => {
    const { tournamentId, doc } = await startedBracket()
    const match = doc.matches.find((m) => m.round === 1)
    const [a, b] = match.participants
    const reporter = Object.values(players).find((p) => p.user.id === a)
    const disputer = Object.values(players).find((p) => p.user.id === b)

    await reporter.agent
      .post(`/api/tournaments/${tournamentId}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: a, score: 5 },
          { participantId: b, score: 2 },
        ],
      })
      .expect(200)
    await disputer.agent
      .post(`/api/tournaments/${tournamentId}/matches/${match.id}/confirm`)
      .send({ agree: false })
      .expect(200)

    const manage = await host.agent.get(`/api/tournaments/${tournamentId}/manage`).expect(200)
    expect(manage.body.tournament.attention.disputedMatches).toEqual([match.id])
  })

  it("counts a result reported and awaiting the opponent's confirmation", async () => {
    const { tournamentId, doc } = await startedBracket()
    const match = doc.matches.find((m) => m.round === 1)
    const [a, b] = match.participants
    const reporter = Object.values(players).find((p) => p.user.id === a)

    await reporter.agent
      .post(`/api/tournaments/${tournamentId}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: a, score: 5 },
          { participantId: b, score: 2 },
        ],
      })
      .expect(200)

    const manage = await host.agent.get(`/api/tournaments/${tournamentId}/manage`).expect(200)
    expect(manage.body.tournament.attention.awaitingConfirmation).toEqual([match.id])
  })

  it('flags a round as ready once every match in it is final', async () => {
    const { tournamentId, doc } = await startedBracket()
    const round1 = doc.matches.filter((m) => m.round === 1)

    for (const match of round1) {
      await finalizeMatch(tournamentId, match)
    }

    const manage = await host.agent.get(`/api/tournaments/${tournamentId}/manage`).expect(200)
    expect(manage.body.tournament.attention.roundsReady).toEqual([1])
  })

  it('reads as reassurance when nothing needs the host', async () => {
    const tournament = await createTournament(host.agent, { title: 'Quiet Cup', maxCapacity: 2 })
    const manage = await host.agent.get(`/api/tournaments/${tournament.id}/manage`).expect(200)
    expect(manage.body.tournament.attention.total).toBe(0)
  })
})

describe('host dashboard across tournaments', () => {
  it('shows only tournaments this host runs, with per-tournament counts', async () => {
    const otherHost = await signUp('otherhost', { isHost: true, plan: true })

    const mine = await createTournament(host.agent, {
      title: 'Gated Cup',
      accessibility: 'application required',
      applicationForm: ['Why?'],
    })
    await players.mei.agent
      .post(`/api/tournaments/${mine.id}/applications`)
      .send({ fields: [{ label: 'Why?', input: 'Because.' }] })
      .expect(201)

    await createTournament(otherHost.agent, { title: 'Not Yours' })

    const dashboard = await host.agent.get('/api/users/me/host-dashboard').expect(200)
    expect(dashboard.body.tournaments).toHaveLength(1)
    expect(dashboard.body.tournaments[0]).toMatchObject({
      tournamentId: mine.id,
      tournamentTitle: 'Gated Cup',
      pendingApplications: 1,
      total: 1,
    })
  })

  it('gives a non-host nothing', async () => {
    await createTournament(host.agent, { title: 'Someone Elses Cup' })

    const dashboard = await players.mei.agent.get('/api/users/me/host-dashboard').expect(200)
    expect(dashboard.body.tournaments).toEqual([])
  })
})
