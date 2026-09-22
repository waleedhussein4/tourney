import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTeam, createTournament, signUp } from './setup/api.js'
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

/** Resolves a round-1 match's participant ids back to the players who joined it. */
async function firstMatchup(tournamentId, roster) {
  const tournament = await Tournament.findById(tournamentId)
  const match = tournament.matches.find((entry) => entry.round === 1)
  const [a, b] = match.participants
  const byId = new Map(roster.map((player) => [player.user.id, player]))
  return { match, a: byId.get(a), b: byId.get(b) }
}

describe('reporting and confirming a solo match', () => {
  it('takes a match from reported to final and advances the winner', async () => {
    const tournament = await createTournament(host.agent, { title: 'Score Cup', maxCapacity: 4 })
    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const roster = [players.mei, players.tomas, players.ada, players.kofi]
    const { match, a, b } = await firstMatchup(tournament.id, roster)

    const reported = await a.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: a.user.id, score: 3 },
          { participantId: b.user.id, score: 1 },
        ],
      })
      .expect(200)

    const reportedMatch = reported.body.tournament.matches.find((m) => m.id === match.id)
    expect(reportedMatch.state).toBe('reported')
    expect(reportedMatch.winner).toBe(a.user.id)
    expect(reportedMatch.reportedBy).toBe(a.user.id)

    // Not advanced yet — only a `final` match propagates.
    const next = reported.body.tournament.matches.find(
      (m) => m.round === 2 && m.slot === Math.floor(match.slot / 2)
    )
    expect(next.participants[match.slot % 2] ?? null).toBeNull()

    const confirmed = await b.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/confirm`)
      .send({ agree: true })
      .expect(200)

    const finalMatch = confirmed.body.tournament.matches.find((m) => m.id === match.id)
    expect(finalMatch.state).toBe('final')
    expect(finalMatch.confirmedBy).toBe(b.user.id)

    const advanced = confirmed.body.tournament.matches.find(
      (m) => m.round === 2 && m.slot === Math.floor(match.slot / 2)
    )
    expect(advanced.participants[match.slot % 2]).toBe(a.user.id)
  })

  it('marks a disputed result without advancing the winner', async () => {
    const tournament = await createTournament(host.agent, { title: 'Score Cup', maxCapacity: 4 })
    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const roster = [players.mei, players.tomas, players.ada, players.kofi]
    const { match, a, b } = await firstMatchup(tournament.id, roster)

    await a.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: a.user.id, score: 5 },
          { participantId: b.user.id, score: 2 },
        ],
      })
      .expect(200)

    const disputed = await b.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/confirm`)
      .send({ agree: false })
      .expect(200)

    const disputedMatch = disputed.body.tournament.matches.find((m) => m.id === match.id)
    expect(disputedMatch.state).toBe('disputed')

    const next = disputed.body.tournament.matches.find(
      (m) => m.round === 2 && m.slot === Math.floor(match.slot / 2)
    )
    expect(next.participants[match.slot % 2] ?? null).toBeNull()

    // A disputed match can be reported again.
    await a.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: a.user.id, score: 5 },
          { participantId: b.user.id, score: 2 },
        ],
      })
      .expect(200)
  })
})

describe('team match reporting', () => {
  it('lets any member of the competing team file the report', async () => {
    const owls = await createTeam(players.mei.agent, [players.tomas.agent], 'Night Owls')
    const larks = await createTeam(players.ada.agent, [players.kofi.agent], 'Day Larks')

    const tournament = await createTournament(host.agent, {
      title: 'Team Score Cup',
      teamSize: 2,
      maxCapacity: 2,
    })
    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: owls.id })
      .expect(200)
    await players.ada.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: larks.id })
      .expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const tournamentDoc = await Tournament.findById(tournament.id)
    const match = tournamentDoc.matches[0]

    // tomas is a non-leader member of owls — still allowed to report for the team.
    const reported = await players.tomas.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: owls.id, score: 2 },
          { participantId: larks.id, score: 1 },
        ],
      })
      .expect(200)

    const reportedMatch = reported.body.tournament.matches.find((m) => m.id === match.id)
    expect(reportedMatch.winner).toBe(owls.id)
    expect(reportedMatch.reportedBy).toBe(players.tomas.user.id)
  })
})

describe('a host override', () => {
  it('is distinguishable from a mutually agreed result', async () => {
    const tournament = await createTournament(host.agent, { title: 'Score Cup', maxCapacity: 2 })
    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await players.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const tournamentDoc = await Tournament.findById(tournament.id)
    const match = tournamentDoc.matches[0]

    const overridden = await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: [{ id: match.id, winner: players.mei.user.id }] })
      .expect(200)

    const overriddenMatch = overridden.body.tournament.matches.find((m) => m.id === match.id)
    expect(overriddenMatch.state).toBe('final')
    expect(overriddenMatch.confirmedBy).toBe(host.user.id)
    expect(overriddenMatch.reportedBy).toBe(host.user.id)
  })
})

describe('guards', () => {
  it('refuses a report from someone who is not a competitor in that match', async () => {
    const tournament = await createTournament(host.agent, { title: 'Score Cup', maxCapacity: 4 })
    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const tournamentDoc = await Tournament.findById(tournament.id)
    const round1 = tournamentDoc.matches.find((match) => match.round === 1)
    const outsider = ['mei', 'tomas', 'ada', 'kofi']
      .map((name) => players[name])
      .find((player) => !round1.participants.includes(player.user.id))

    await outsider.agent
      .post(`/api/tournaments/${tournament.id}/matches/${round1.id}/report`)
      .send({
        scores: [
          { participantId: round1.participants[0], score: 1 },
          { participantId: round1.participants[1], score: 0 },
        ],
      })
      .expect(403)
  })

  it('refuses a match report before the tournament has started', async () => {
    const tournament = await createTournament(host.agent, { title: 'Score Cup', maxCapacity: 2 })
    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await players.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    const tournamentDoc = await Tournament.findById(tournament.id)
    const match = tournamentDoc.matches[0]

    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: match.participants[0], score: 1 },
          { participantId: match.participants[1], score: 0 },
        ],
      })
      .expect(400)
  })

  it('refuses a report once the tournament has ended', async () => {
    const tournament = await createTournament(host.agent, { title: 'Score Cup', maxCapacity: 2 })
    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await players.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const tournamentDoc = await Tournament.findById(tournament.id)
    const match = tournamentDoc.matches[0]
    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: [{ id: match.id, winner: players.mei.user.id }] })
      .expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)

    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: match.participants[0], score: 1 },
          { participantId: match.participants[1], score: 0 },
        ],
      })
      .expect(400)
  })

  it('refuses a report on a match that is already final', async () => {
    const tournament = await createTournament(host.agent, { title: 'Score Cup', maxCapacity: 2 })
    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await players.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const tournamentDoc = await Tournament.findById(tournament.id)
    const match = tournamentDoc.matches[0]
    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: [{ id: match.id, winner: players.mei.user.id }] })
      .expect(200)

    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: match.participants[0], score: 1 },
          { participantId: match.participants[1], score: 0 },
        ],
      })
      .expect(400)
  })

  it('refuses the reporter confirming their own report', async () => {
    const tournament = await createTournament(host.agent, { title: 'Score Cup', maxCapacity: 2 })
    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await players.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const tournamentDoc = await Tournament.findById(tournament.id)
    const match = tournamentDoc.matches[0]

    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: match.participants[0], score: 3 },
          { participantId: match.participants[1], score: 1 },
        ],
      })
      .expect(200)

    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/matches/${match.id}/confirm`)
      .send({ agree: true })
      .expect(400)
  })

  it('refuses a match report whose feeder round has not finished', async () => {
    const tournament = await createTournament(host.agent, { title: 'Score Cup', maxCapacity: 4 })
    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const tournamentDoc = await Tournament.findById(tournament.id)
    const round2 = tournamentDoc.matches.find((match) => match.round === 2)

    await host.agent
      .post(`/api/tournaments/${tournament.id}/matches/${round2.id}/report`)
      .send({
        scores: [
          { participantId: players.mei.user.id, score: 1 },
          { participantId: players.tomas.user.id, score: 0 },
        ],
      })
      .expect(400)
  })
})
