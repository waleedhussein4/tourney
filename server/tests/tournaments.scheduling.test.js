import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, signUp } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'
import * as tournamentService from '../src/modules/tournaments/tournament.service.js'

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

async function startedTournament() {
  const tournament = await createTournament(host.agent, { title: 'Schedule Cup', maxCapacity: 4 })
  for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
    await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
  }
  await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)
  const doc = await Tournament.findById(tournament.id)
  return { tournamentId: tournament.id, doc }
}

describe('scheduling matches', () => {
  it('sets scheduledAt and moves a pending match to scheduled', async () => {
    const { tournamentId, doc } = await startedTournament()
    const match = doc.matches.find((entry) => entry.round === 1)
    const at = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

    const res = await host.agent
      .patch(`/api/tournaments/${tournamentId}/matches/schedule`)
      .send({ matches: [{ id: match.id, scheduledAt: at.toISOString() }] })
      .expect(200)

    const updated = res.body.tournament.matches.find((entry) => entry.id === match.id)
    expect(updated.state).toBe('scheduled')
    expect(new Date(updated.scheduledAt).toISOString()).toBe(at.toISOString())
  })

  it('schedules a whole round in one call', async () => {
    const { tournamentId, doc } = await startedTournament()
    const round1 = doc.matches.filter((entry) => entry.round === 1)
    const at = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

    const res = await host.agent
      .patch(`/api/tournaments/${tournamentId}/matches/schedule`)
      .send({
        matches: round1.map((match) => ({ id: match.id, scheduledAt: at.toISOString() })),
      })
      .expect(200)

    for (const match of round1) {
      const updated = res.body.tournament.matches.find((entry) => entry.id === match.id)
      expect(updated.state).toBe('scheduled')
    }
  })

  it('rejects a time outside the tournament window', async () => {
    const { tournamentId, doc } = await startedTournament()
    const match = doc.matches.find((entry) => entry.round === 1)
    const tooLate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await host.agent
      .patch(`/api/tournaments/${tournamentId}/matches/schedule`)
      .send({ matches: [{ id: match.id, scheduledAt: tooLate.toISOString() }] })
      .expect(400)
  })

  it('rejects a past time when first scheduling a match', async () => {
    const { tournamentId, doc } = await startedTournament()
    const match = doc.matches.find((entry) => entry.round === 1)
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000)

    await host.agent
      .patch(`/api/tournaments/${tournamentId}/matches/schedule`)
      .send({ matches: [{ id: match.id, scheduledAt: past.toISOString() }] })
      .expect(400)
  })

  it('allows editing an already-scheduled match to a past time', async () => {
    const { tournamentId, doc } = await startedTournament()
    const match = doc.matches.find((entry) => entry.round === 1)
    // Early in the window — will become "the past" once the clock advances below.
    const early = new Date(Date.now() + 36 * 60 * 60 * 1000)

    await tournamentService.scheduleMatches(tournamentId, host.user.id, [
      { id: match.id, scheduledAt: early },
    ])

    // Move "now" to after `early` — the service reads `new Date()` internally,
    // so this makes re-setting the same match to that same time an edit of a
    // match whose time has already passed, not a first scheduling.
    vi.setSystemTime(new Date(early.getTime() + 60 * 60 * 1000))
    try {
      const updated = await tournamentService.scheduleMatches(tournamentId, host.user.id, [
        { id: match.id, scheduledAt: early },
      ])
      const updatedMatch = updated.matches.find((entry) => entry.id === match.id)
      expect(updatedMatch.scheduledAt.toISOString()).toBe(early.toISOString())
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not overwrite a final match state when scheduling, and stores UTC', async () => {
    const { tournamentId, doc } = await startedTournament()
    const match = doc.matches.find((entry) => entry.round === 1)
    const [a, b] = match.participants

    // Report and confirm to reach `final`.
    const reporter = [players.mei, players.tomas, players.ada, players.kofi].find(
      (player) => player.user.id === a
    )
    const confirmer = [players.mei, players.tomas, players.ada, players.kofi].find(
      (player) => player.user.id === b
    )
    await reporter.agent
      .post(`/api/tournaments/${tournamentId}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: a, score: 3 },
          { participantId: b, score: 1 },
        ],
      })
      .expect(200)
    await confirmer.agent
      .post(`/api/tournaments/${tournamentId}/matches/${match.id}/confirm`)
      .send({ agree: true })
      .expect(200)

    // A submitter in a timezone far from UTC (offset baked into the ISO string),
    // within the tournament's window.
    const withinWindow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    withinWindow.setMilliseconds(0)
    const shifted = new Date(withinWindow.getTime() + 9 * 60 * 60 * 1000)
    const localTime = `${shifted.toISOString().replace('Z', '')}+09:00`
    const res = await host.agent
      .patch(`/api/tournaments/${tournamentId}/matches/schedule`)
      .send({ matches: [{ id: match.id, scheduledAt: localTime }] })
      .expect(200)

    const updated = res.body.tournament.matches.find((entry) => entry.id === match.id)
    expect(updated.state).toBe('final')

    const stored = await Tournament.findById(tournamentId)
    const storedMatch = stored.matches.find((entry) => entry.id === match.id)
    expect(storedMatch.scheduledAt.toISOString()).toBe(withinWindow.toISOString())
  })
})
