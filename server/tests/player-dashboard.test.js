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

async function startedTournament(overrides = {}) {
  const tournament = await createTournament(host.agent, {
    title: 'Dash Cup',
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

describe('player dashboard', () => {
  it('returns the next scheduled match, opponent, and viewer-only visibility', async () => {
    const { tournamentId, doc } = await startedTournament()
    const match = doc.matches.find((entry) => entry.round === 1)
    const [aId, bId] = match.participants
    const roster = [players.mei, players.tomas, players.ada, players.kofi]
    const a = roster.find((p) => p.user.id === aId)
    const b = roster.find((p) => p.user.id === bId)
    const stranger = roster.find((p) => p !== a && p !== b)

    const at = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    await host.agent
      .patch(`/api/tournaments/${tournamentId}/matches/schedule`)
      .send({ matches: [{ id: match.id, scheduledAt: at.toISOString() }] })
      .expect(200)

    const dashboard = await a.agent.get('/api/users/me/dashboard').expect(200)
    expect(dashboard.body.nextMatch).toMatchObject({
      tournamentId,
      tournamentTitle: 'Dash Cup',
      round: 1,
      opponentName: b.user.username,
    })
    expect(new Date(dashboard.body.nextMatch.scheduledAt).toISOString()).toBe(at.toISOString())

    // A player not in this match sees no match at all — never leaks who else
    // is scheduled.
    const strangerDash = await stranger.agent.get('/api/users/me/dashboard').expect(200)
    expect(strangerDash.body.nextMatch).toBeNull()
  })

  it('shows a reported result to the opponent awaiting confirmation, not to the reporter', async () => {
    const { tournamentId, doc } = await startedTournament()
    const match = doc.matches.find((entry) => entry.round === 1)
    const [aId, bId] = match.participants
    const roster = [players.mei, players.tomas, players.ada, players.kofi]
    const a = roster.find((p) => p.user.id === aId)
    const b = roster.find((p) => p.user.id === bId)

    await a.agent
      .post(`/api/tournaments/${tournamentId}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: aId, score: 3 },
          { participantId: bId, score: 1 },
        ],
      })
      .expect(200)

    const bDash = await b.agent.get('/api/users/me/dashboard').expect(200)
    expect(bDash.body.awaitingConfirmation).toHaveLength(1)
    expect(bDash.body.awaitingConfirmation[0]).toMatchObject({
      tournamentId,
      matchId: match.id,
      opponentName: a.user.username,
    })

    // The reporter already knows the result they filed — it does not wait on
    // their own confirmation.
    const aDash = await a.agent.get('/api/users/me/dashboard').expect(200)
    expect(aDash.body.awaitingConfirmation).toHaveLength(0)
  })

  it('lists an open application as pending and an accepted one as accepted', async () => {
    const tournament = await createTournament(host.agent, {
      title: 'Gated Cup',
      accessibility: 'application required',
      applicationForm: ['Why should you get in?'],
    })

    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [{ label: 'Why should you get in?', input: 'Because.' }] })
      .expect(201)
    await players.ada.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [{ label: 'Why should you get in?', input: 'Also because.' }] })
      .expect(201)

    const doc = await Tournament.findById(tournament.id)
    const adaApplication = doc.applications.find(
      (entry) => entry.applicantId === players.ada.user.id
    )
    await host.agent
      .post(`/api/tournaments/${tournament.id}/applications/${adaApplication.id}/accept`)
      .expect(200)

    const meiDash = await players.mei.agent.get('/api/users/me/dashboard').expect(200)
    expect(meiDash.body.applications).toEqual([
      { tournamentId: tournament.id, tournamentTitle: 'Gated Cup', status: 'pending' },
    ])

    const adaDash = await players.ada.agent.get('/api/users/me/dashboard').expect(200)
    expect(adaDash.body.applications).toEqual([
      { tournamentId: tournament.id, tournamentTitle: 'Gated Cup', status: 'accepted' },
    ])

    // Never applied — nothing shows up.
    const kofiDash = await players.kofi.agent.get('/api/users/me/dashboard').expect(200)
    expect(kofiDash.body.applications).toEqual([])
  })

  it('resolves a team match opponent through the enrolled team, not through applications data', async () => {
    const owls = await createTeam(players.mei.agent, [players.tomas.agent], 'Night Owls')
    const larks = await createTeam(players.ada.agent, [players.kofi.agent], 'Day Larks')

    const tournament = await createTournament(host.agent, {
      title: 'Team Dash Cup',
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

    const doc = await Tournament.findById(tournament.id)
    const match = doc.matches.find((entry) => entry.round === 1)
    const at = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches/schedule`)
      .send({ matches: [{ id: match.id, scheduledAt: at.toISOString() }] })
      .expect(200)

    const dash = await players.tomas.agent.get('/api/users/me/dashboard').expect(200)
    expect(dash.body.nextMatch).toMatchObject({ opponentName: 'Day Larks' })
  })
})
