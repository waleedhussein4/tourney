import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, signUp } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'
import Notification from '../src/models/notification.model.js'

useDatabase()

let host
let players

beforeEach(async () => {
  host = await signUp('hostie', { isHost: true, plan: true })
  players = {}
  for (const name of ['mei', 'tomas']) {
    players[name] = await signUp(name)
  }
})

/** Gets a disputed match to a two-player bracket, ready for the host to resolve. */
async function disputedMatch(tournament) {
  await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
  await players.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
  await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

  const tournamentDoc = await Tournament.findById(tournament.id)
  const match = tournamentDoc.matches[0]
  const [a, b] = match.participants

  await players.mei.agent
    .post(`/api/tournaments/${tournament.id}/matches/${match.id}/report`)
    .send({
      scores: [
        { participantId: a, score: 5 },
        { participantId: b, score: 2 },
      ],
    })
    .expect(200)

  await players.tomas.agent
    .post(`/api/tournaments/${tournament.id}/matches/${match.id}/confirm`)
    .send({ agree: false })
    .expect(200)

  return { match, a, b }
}

describe('resolving a disputed match', () => {
  it('lets the host settle it, finalizing the winner they choose', async () => {
    const tournament = await createTournament(host.agent, { title: 'Dispute Cup', maxCapacity: 2 })
    const { match, a, b } = await disputedMatch(tournament)

    const resolved = await host.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/resolve`)
      .send({
        scores: [
          { participantId: a, score: 4 },
          { participantId: b, score: 6 },
        ],
      })
      .expect(200)

    const resolvedMatch = resolved.body.tournament.matches.find((m) => m.id === match.id)
    expect(resolvedMatch.state).toBe('final')
    expect(resolvedMatch.winner).toBe(b)
    // A host resolution stays distinguishable from a result the players agreed on.
    expect(resolvedMatch.confirmedBy).toBe(host.user.id)
    expect(resolvedMatch.reportedBy).toBe(players.mei.user.id)
  })

  it('advances the resolved winner into the next round', async () => {
    const tournament = await createTournament(host.agent, { title: 'Dispute Cup', maxCapacity: 4 })
    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      if (!players[name]) players[name] = await signUp(name)
      await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const tournamentDoc = await Tournament.findById(tournament.id)
    const match = tournamentDoc.matches.find((entry) => entry.round === 1)
    const byId = new Map(
      [players.mei, players.tomas, players.ada, players.kofi].map((p) => [p.user.id, p])
    )
    const a = byId.get(match.participants[0])
    const b = byId.get(match.participants[1])

    await a.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: a.user.id, score: 3 },
          { participantId: b.user.id, score: 1 },
        ],
      })
      .expect(200)
    await b.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/confirm`)
      .send({ agree: false })
      .expect(200)

    const resolved = await host.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/resolve`)
      .send({
        scores: [
          { participantId: a.user.id, score: 1 },
          { participantId: b.user.id, score: 3 },
        ],
      })
      .expect(200)

    const next = resolved.body.tournament.matches.find(
      (m) => m.round === 2 && m.slot === Math.floor(match.slot / 2)
    )
    expect(next.participants[match.slot % 2]).toBe(b.user.id)
  })

  it('is refused to anyone but the host', async () => {
    const tournament = await createTournament(host.agent, { title: 'Dispute Cup', maxCapacity: 2 })
    const { match, a, b } = await disputedMatch(tournament)

    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/resolve`)
      .send({
        scores: [
          { participantId: a, score: 4 },
          { participantId: b, score: 6 },
        ],
      })
      .expect(403)
  })

  it('is refused on a match that is not disputed', async () => {
    const tournament = await createTournament(host.agent, { title: 'Dispute Cup', maxCapacity: 2 })
    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await players.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const tournamentDoc = await Tournament.findById(tournament.id)
    const match = tournamentDoc.matches[0]

    await host.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/resolve`)
      .send({
        scores: [
          { participantId: match.participants[0], score: 4 },
          { participantId: match.participants[1], score: 6 },
        ],
      })
      .expect(400)
  })

  it('notifies each competitor exactly once', async () => {
    const tournament = await createTournament(host.agent, { title: 'Dispute Cup', maxCapacity: 2 })
    const { match, a, b } = await disputedMatch(tournament)

    await host.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/resolve`)
      .send({
        scores: [
          { participantId: a, score: 4 },
          { participantId: b, score: 6 },
        ],
      })
      .expect(200)

    const notifications = await Notification.find({
      type: 'result_resolved',
      subjectId: match.id,
    })
    expect(notifications).toHaveLength(2)
    expect(new Set(notifications.map((n) => n.user))).toEqual(new Set([a, b]))
  })
})
