import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTeam, createTournament, signUp, tournamentPayload } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'

useDatabase()

let host
let players

beforeEach(async () => {
  host = await signUp('hostie', { isHost: true, plan: true })
  players = {}
  for (const name of ['mei', 'tomas', 'ada', 'kofi', 'lena', 'oscar']) {
    players[name] = await signUp(name)
  }
})

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

describe('a solo bracket, from creation to a crowned champion', () => {
  it('carries a tournament from empty slots to a recorded winner', async () => {
    const tournament = await createTournament(host.agent, {
      title: 'Solo Ladder Open',
      maxCapacity: 4,
    })

    expect(tournament.matches).toEqual([null, null, null])

    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }

    const started = await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)
    expect(started.body.tournament.hasStarted).toBe(true)
    expect(started.body.tournament.bracketOrder.filter(Boolean)).toHaveLength(4)

    const order = await bracketOrder(tournament.id)
    const champion = players.mei.user.id

    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: matchesFor(order, 4, champion) })
      .expect(200)

    const ended = await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)

    expect(ended.body.tournament.hasEnded).toBe(true)
    expect(ended.body.winners).toEqual([{ rank: 1, id: champion }])
  })
})

describe('a team bracket', () => {
  it('takes two teams through to a finished bracket', async () => {
    const owls = await createTeam(players.mei.agent, [players.tomas.agent], 'Night Owls')
    const larks = await createTeam(players.ada.agent, [players.kofi.agent], 'Day Larks')

    const tournament = await createTournament(host.agent, {
      title: 'Team Title Run',
      teamSize: 2,
      maxCapacity: 2,
    })

    // The documented rule: the leader enters on the team's behalf.
    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: owls.id })
      .expect(200)
    await players.ada.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: larks.id })
      .expect(200)

    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const order = await bracketOrder(tournament.id)
    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({ matches: matchesFor(order, 2, owls.id) })
      .expect(200)

    const ended = await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)
    expect(ended.body.winners).toEqual([{ rank: 1, id: owls.id }])
  })
})

describe('a battle royale', () => {
  it('ranks entrants by score and ends with the leaderboard order', async () => {
    const tournament = await createTournament(host.agent, {
      title: 'Score Attack',
      type: 'battle royale',
      maxCapacity: 4,
    })

    for (const name of ['mei', 'tomas', 'ada', 'kofi']) {
      await players[name].agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }

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

    const ended = await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)

    expect(ended.body.winners).toEqual([
      { rank: 1, id: players.kofi.user.id },
      { rank: 2, id: players.ada.user.id },
      { rank: 3, id: players.tomas.user.id },
    ])
  })

  it('ranks winning teams by their combined score', async () => {
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
    })

    await players.mei.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: owls.id })
      .expect(200)
    await players.kofi.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: larks.id })
      .expect(200)

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

    const ended = await host.agent.post(`/api/tournaments/${tournament.id}/end`).expect(200)
    expect(ended.body.winners).toEqual([
      { rank: 1, id: larks.id },
      { rank: 2, id: owls.id },
    ])
  })
})

describe('an application-gated tournament', () => {
  it('takes an applicant from applying, through acceptance, to competing', async () => {
    const tournament = await createTournament(host.agent, {
      title: 'By Invitation',
      type: 'battle royale',
      maxCapacity: 4,
      accessibility: 'application required',
      applicationForm: ['In-game name', 'Region'],
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
  })

  it('lets the host reject an application, which lets nobody in', async () => {
    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      accessibility: 'application required',
      applicationForm: ['Name'],
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
  })
})

describe('cancelling before the start', () => {
  it('removes the tournament entirely', async () => {
    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      maxCapacity: 4,
    })

    await players.mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await players.tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    await host.agent.delete(`/api/tournaments/${tournament.id}`).expect(200)

    expect(await Tournament.findById(tournament.id)).toBeNull()
  })

  it('refuses once the tournament has started', async () => {
    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      maxCapacity: 2,
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
