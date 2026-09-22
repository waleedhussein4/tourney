import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, signUp } from './setup/api.js'
import Notification from '../src/models/notification.model.js'
import Tournament from '../src/models/tournament.model.js'
import * as tournamentService from '../src/modules/tournaments/tournament.service.js'
import { runReminderSweep } from '../src/modules/notifications/notification.service.js'

// Same reason as email-verification.test.js: the service checks `mailCanSend`
// before doing any work, so the mock has to carry both exports.
vi.mock('../src/lib/mailer.js', () => ({ sendMail: vi.fn(), mailCanSend: true }))
const { sendMail } = await import('../src/lib/mailer.js')

useDatabase()

let host
let players

beforeEach(async () => {
  vi.clearAllMocks()
  host = await signUp('hostie', { isHost: true, plan: true })
  players = {}
  for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
    players[name] = await signUp(name)
  }
})

function notificationsFor(userId) {
  return Notification.find({ user: userId })
}

async function startedTournament(title = 'Schedule Cup') {
  const tournament = await createTournament(host.agent, { title, maxCapacity: 4 })
  for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
    await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
  }
  await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)
  return tournament.id
}

async function firstMatchup(tournamentId) {
  const tournament = await Tournament.findById(tournamentId)
  const match = tournament.matches.find((entry) => entry.round === 1)
  const roster = [players.mei, players.tomas, players.ada, players.kofi]
  const byId = new Map(roster.map((player) => [player.user.id, player]))
  return { match, a: byId.get(match.participants[0]), b: byId.get(match.participants[1]) }
}

/**
 * A full `{ id, winner }` result set that marches `championId` to the title —
 * copied from tournaments.lifecycle.test.js's `resultsFor`, the shape
 * `PATCH /matches` needs.
 */
function resultsFor(matches, order, championId) {
  const participantsByKey = new Map()
  for (const match of matches.filter((entry) => entry.round === 1)) {
    participantsByKey.set(`1-${match.slot}`, [order[match.slot * 2], order[match.slot * 2 + 1]])
  }
  const maxRound = Math.max(...matches.map((entry) => entry.round))
  const results = []
  for (const match of matches) {
    const participants = participantsByKey.get(`${match.round}-${match.slot}`) ?? [null, null]
    const winner = participants.includes(championId) ? championId : participants[0]
    results.push({ id: match.id, winner })
    if (match.round < maxRound) {
      const nextKey = `${match.round + 1}-${Math.floor(match.slot / 2)}`
      const next = participantsByKey.get(nextKey) ?? [null, null]
      next[match.slot % 2] = winner
      participantsByKey.set(nextKey, next)
    }
  }
  return results
}

describe('application decided', () => {
  async function gatedTournament() {
    return createTournament(host.agent, {
      title: 'By Invitation',
      type: 'battle royale',
      maxCapacity: 4,
      accessibility: 'application required',
      applicationForm: ['Name'],
    })
  }

  it('notifies the applicant when accepted, and nobody else', async () => {
    const tournament = await gatedTournament()
    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [{ label: 'Name', input: 'mei' }] })
      .expect(201)

    const queue = await host.agent.get(`/api/tournaments/${tournament.id}/manage`).expect(200)
    const applicationId = queue.body.tournament.applications[0].id

    vi.clearAllMocks()
    await host.agent
      .post(`/api/tournaments/${tournament.id}/applications/${applicationId}/accept`)
      .expect(200)

    const meiNotifications = await notificationsFor(players.mei.user.id)
    expect(meiNotifications).toHaveLength(1)
    expect(meiNotifications[0].type).toBe('application_accepted')

    expect(await notificationsFor(players.tomas.user.id)).toHaveLength(0)
    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(sendMail.mock.calls[0][0]).toMatchObject({ to: 'mei@example.com', critical: false })
  })

  it('notifies the applicant when rejected, and nobody else', async () => {
    const tournament = await gatedTournament()
    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [{ label: 'Name', input: 'mei' }] })
      .expect(201)

    const queue = await host.agent.get(`/api/tournaments/${tournament.id}/manage`).expect(200)
    const applicationId = queue.body.tournament.applications[0].id

    await host.agent
      .post(`/api/tournaments/${tournament.id}/applications/${applicationId}/reject`)
      .expect(200)

    const meiNotifications = await notificationsFor(players.mei.user.id)
    expect(meiNotifications).toHaveLength(1)
    expect(meiNotifications[0].type).toBe('application_rejected')
    expect(await notificationsFor(players.tomas.user.id)).toHaveLength(0)
  })
})

describe('tournament published', () => {
  it('notifies whoever is already enrolled when a draft goes live', async () => {
    const draft = await createTournament(host.agent, { title: 'Draft Cup' }, { published: false })
    await Tournament.updateOne(
      { _id: draft.id },
      { $push: { enrolledUsers: { userId: players.mei.user.id, score: 0, eliminated: false } } }
    )

    await tournamentService.publishTournament(draft.id, host.user.id)

    const meiNotifications = await notificationsFor(players.mei.user.id)
    expect(meiNotifications).toHaveLength(1)
    expect(meiNotifications[0].type).toBe('tournament_published')
    expect(await notificationsFor(players.tomas.user.id)).toHaveLength(0)
  })
})

describe('match scheduled', () => {
  it('notifies only the two competitors in that match', async () => {
    const tournamentId = await startedTournament()
    const { match, a, b } = await firstMatchup(tournamentId)
    const others = Object.values(players).filter((p) => p !== a && p !== b)

    vi.clearAllMocks()
    await host.agent
      .patch(`/api/tournaments/${tournamentId}/matches/schedule`)
      .send({
        matches: [{ id: match.id, scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString() }],
      })
      .expect(200)

    for (const player of [a, b]) {
      const notifications = await notificationsFor(player.user.id)
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('match_scheduled')
    }
    for (const player of others) {
      expect(await notificationsFor(player.user.id)).toHaveLength(0)
    }
    expect(sendMail).toHaveBeenCalledTimes(2)
  })
})

describe('result confirmed and disputed', () => {
  it('notifies the reporter when the other side confirms', async () => {
    const tournamentId = await startedTournament()
    const { match, a, b } = await firstMatchup(tournamentId)

    await a.agent
      .post(`/api/tournaments/${tournamentId}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: a.user.id, score: 3 },
          { participantId: b.user.id, score: 1 },
        ],
      })
      .expect(200)

    await b.agent
      .post(`/api/tournaments/${tournamentId}/matches/${match.id}/confirm`)
      .send({ agree: true })
      .expect(200)

    const aNotifications = await notificationsFor(a.user.id)
    expect(aNotifications).toHaveLength(1)
    expect(aNotifications[0].type).toBe('result_confirmed')
    // The confirmer is not the one being told — they already know.
    expect(await notificationsFor(b.user.id)).toHaveLength(0)
  })

  it('notifies the reporter when the other side disputes', async () => {
    const tournamentId = await startedTournament()
    const { match, a, b } = await firstMatchup(tournamentId)

    await a.agent
      .post(`/api/tournaments/${tournamentId}/matches/${match.id}/report`)
      .send({
        scores: [
          { participantId: a.user.id, score: 3 },
          { participantId: b.user.id, score: 1 },
        ],
      })
      .expect(200)

    vi.clearAllMocks()
    await b.agent
      .post(`/api/tournaments/${tournamentId}/matches/${match.id}/confirm`)
      .send({ agree: false })
      .expect(200)

    const aNotifications = await notificationsFor(a.user.id)
    expect(aNotifications).toHaveLength(1)
    expect(aNotifications[0].type).toBe('result_disputed')
    expect(sendMail).toHaveBeenCalledTimes(1)
  })
})

describe('tournament ended', () => {
  it('notifies every participant, and nobody who was never in it', async () => {
    const tournamentId = await startedTournament('Ending Cup')
    const order = (await Tournament.findById(tournamentId)).bracketOrder.filter(Boolean)
    const matches = (await Tournament.findById(tournamentId)).matches
    const champion = players.mei.user.id

    await host.agent
      .patch(`/api/tournaments/${tournamentId}/matches`)
      .send({ matches: resultsFor(matches, order, champion) })
      .expect(200)

    await host.agent.post(`/api/tournaments/${tournamentId}/end`).expect(200)

    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      const notifications = await notificationsFor(players[name].user.id)
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('tournament_ended')
    }
    expect(await notificationsFor(host.user.id)).toHaveLength(0)
  })
})

describe('the reminder sweep', () => {
  it('notifies participants of a tournament starting within 24 hours', async () => {
    const tournament = await createTournament(host.agent, {
      title: 'Soon Cup',
      startDate: new Date(Date.now() + 3 * 3600000).toISOString(),
      endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    })
    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    await runReminderSweep()

    const meiNotifications = await notificationsFor(players.mei.user.id)
    expect(meiNotifications).toHaveLength(1)
    expect(meiNotifications[0].type).toBe('tournament_starting_soon')
    expect(await notificationsFor(players.tomas.user.id)).toHaveLength(0)
  })

  it('notifies match competitors of a match starting within the hour, and nobody else', async () => {
    const tournamentId = await startedTournament('Hourly Cup')
    const { match, a, b } = await firstMatchup(tournamentId)
    const others = Object.values(players).filter((p) => p !== a && p !== b)

    // Set the match's schedule directly — the schedule endpoint requires the
    // time fall inside the tournament's own dates, which the default payload
    // sets days out. The sweep only cares about `state`/`scheduledAt`.
    await Tournament.updateOne(
      { _id: tournamentId, 'matches._id': match.id },
      {
        $set: {
          'matches.$.state': 'scheduled',
          'matches.$.scheduledAt': new Date(Date.now() + 30 * 60000),
        },
      }
    )

    await runReminderSweep()

    for (const player of [a, b]) {
      const notifications = await notificationsFor(player.user.id)
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('match_starting_soon')
    }
    for (const player of others) {
      expect(await notificationsFor(player.user.id)).toHaveLength(0)
    }
  })

  it('is idempotent — running it twice writes exactly one notification each', async () => {
    const tournament = await createTournament(host.agent, {
      title: 'Idempotent Cup',
      startDate: new Date(Date.now() + 3 * 3600000).toISOString(),
      endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    })
    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    // Two overlapping/retried runs, exactly what a real sweep can do.
    await Promise.all([runReminderSweep(), runReminderSweep()])
    await runReminderSweep()

    expect(
      await Notification.countDocuments({
        user: players.mei.user.id,
        type: 'tournament_starting_soon',
      })
    ).toBe(1)
  })
})

describe('a failing mail send never breaks the triggering action', () => {
  it('still accepts the application when the email fails', async () => {
    sendMail.mockRejectedValue(new Error('Resend is down'))

    const tournament = await createTournament(host.agent, {
      title: 'Resilient Cup',
      type: 'battle royale',
      maxCapacity: 4,
      accessibility: 'application required',
      applicationForm: ['Name'],
    })
    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/applications`)
      .send({ fields: [{ label: 'Name', input: 'mei' }] })
      .expect(201)
    const queue = await host.agent.get(`/api/tournaments/${tournament.id}/manage`).expect(200)
    const applicationId = queue.body.tournament.applications[0].id

    const response = await host.agent
      .post(`/api/tournaments/${tournament.id}/applications/${applicationId}/accept`)
      .expect(200)

    expect(response.body.tournament.applications).toHaveLength(0)
    expect(response.body.tournament.acceptedUsers ?? response.body.tournament.viewer).toBeTruthy()

    const joined = await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/join/solo`)
      .expect(200)
    expect(joined.body.tournament.viewer.isJoined).toBe(true)

    // The notification itself was still written — only the email leg failed.
    const notifications = await notificationsFor(players.mei.user.id)
    expect(notifications).toHaveLength(1)
  })
})
