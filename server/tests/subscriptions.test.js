import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, guest, planOf, signUp } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'
import User from '../src/models/user.model.js'

useDatabase()

let host

beforeEach(async () => {
  host = await signUp('hostie', { isHost: true })
})

describe('the free plan', () => {
  it('publishes one tournament, then refuses a second with PLAN_LIMIT_REACHED', async () => {
    await createTournament(host.agent, {}, { published: false })
    const first = await createTournament(host.agent, {}, { published: false })
    const second = await createTournament(host.agent, {}, { published: false })

    await host.agent.post(`/api/tournaments/${first.id}/publish`).expect(200)

    const blocked = await host.agent.post(`/api/tournaments/${second.id}/publish`).expect(402)
    expect(blocked.body.error.code).toBe('PLAN_LIMIT_REACHED')
  })

  it('frees the allowance once the live tournament ends', async () => {
    const first = await createTournament(host.agent, { maxCapacity: 2 }, { published: false })
    const second = await createTournament(host.agent, {}, { published: false })
    await host.agent.post(`/api/tournaments/${first.id}/publish`).expect(200)
    await host.agent.post(`/api/tournaments/${second.id}/publish`).expect(402)

    // Fill and finish the first — this is a battle royale, so scores are
    // enough to end it once the entrants are in.
    await Tournament.updateOne({ _id: first.id }, { $set: { hasStarted: true, hasEnded: true } })

    await host.agent.post(`/api/tournaments/${second.id}/publish`).expect(200)
  })

  it('frees the allowance once the live tournament is unpublished', async () => {
    const first = await createTournament(host.agent, {}, { published: false })
    const second = await createTournament(host.agent, {}, { published: false })
    await host.agent.post(`/api/tournaments/${first.id}/publish`).expect(200)
    await host.agent.post(`/api/tournaments/${second.id}/publish`).expect(402)

    await host.agent.post(`/api/tournaments/${first.id}/unpublish`).expect(200)

    await host.agent.post(`/api/tournaments/${second.id}/publish`).expect(200)
  })
})

describe('an active plan', () => {
  it('publishes as many tournaments as it likes', async () => {
    const paid = await signUp('paidhost', { isHost: true, plan: true })

    for (let i = 0; i < 4; i += 1) {
      const tournament = await createTournament(paid.agent, {}, { published: false })
      await paid.agent.post(`/api/tournaments/${tournament.id}/publish`).expect(200)
    }
  })

  it('counts past_due as active', async () => {
    const pastDue = await signUp('shakyhost', { isHost: true })
    await User.updateOne(
      { _id: pastDue.user.id },
      { $set: { hostingPlan: { status: 'past_due', provider: 'test', updatedAt: new Date() } } }
    )
    expect(await planOf(pastDue.user.id)).toBe('past_due')

    const first = await createTournament(pastDue.agent, {}, { published: false })
    const second = await createTournament(pastDue.agent, {}, { published: false })
    await pastDue.agent.post(`/api/tournaments/${first.id}/publish`).expect(200)
    await pastDue.agent.post(`/api/tournaments/${second.id}/publish`).expect(200)
  })
})

describe('unpublishing', () => {
  it('works before the tournament starts', async () => {
    const tournament = await createTournament(host.agent)
    await host.agent.post(`/api/tournaments/${tournament.id}/unpublish`).expect(200)
    expect((await Tournament.findById(tournament.id)).publishState).toBe('draft')
  })

  it('refuses once the tournament has started', async () => {
    const tournament = await createTournament(host.agent)
    await Tournament.updateOne({ _id: tournament.id }, { $set: { hasStarted: true } })

    await host.agent.post(`/api/tournaments/${tournament.id}/unpublish`).expect(400)
  })

  it('refuses a tournament that is already a draft', async () => {
    const tournament = await createTournament(host.agent, {}, { published: false })
    await host.agent.post(`/api/tournaments/${tournament.id}/unpublish`).expect(409)
  })
})

describe('a draft tournament', () => {
  it('is invisible on browse and trending', async () => {
    await createTournament(host.agent, { title: 'Secret Cup' }, { published: false })

    const list = await guest().get('/api/tournaments').expect(200)
    expect(list.body.tournaments.map((t) => t.title)).not.toContain('Secret Cup')

    const trending = await guest().get('/api/tournaments/trending').expect(200)
    expect(trending.body.tournaments.map((t) => t.title)).not.toContain('Secret Cup')
  })

  it('is a 404 to a non-host, but visible to its host', async () => {
    const draft = await createTournament(host.agent, {}, { published: false })
    const stranger = await signUp('mallory')

    await stranger.agent.get(`/api/tournaments/${draft.id}`).expect(404)
    await guest().get(`/api/tournaments/${draft.id}`).expect(404)
    await host.agent.get(`/api/tournaments/${draft.id}`).expect(200)
  })

  it('cannot be joined or started', async () => {
    const draft = await createTournament(host.agent, {}, { published: false })
    const player = await signUp('mei')

    await player.agent.post(`/api/tournaments/${draft.id}/join/solo`).expect(404)
    await host.agent.post(`/api/tournaments/${draft.id}/start`).expect(400)
  })
})

describe('GET /api/billing/plan', () => {
  it('answers signed out', async () => {
    const response = await guest().get('/api/billing/plan').expect(200)
    expect(response.body).toMatchObject({
      plan: { name: 'Host', priceCents: 500, interval: 'month' },
      freeLiveTournaments: 1,
      currency: 'USD',
    })
  })
})

describe('GET /api/billing/me', () => {
  it('requires auth', async () => {
    await guest().get('/api/billing/me').expect(401)
  })

  it('reports canPublish correctly against the free allowance', async () => {
    const before = await host.agent.get('/api/billing/me').expect(200)
    expect(before.body.billing.canPublish).toBe(true)

    const first = await createTournament(host.agent)
    const after = await host.agent.get('/api/billing/me').expect(200)
    expect(after.body.billing.liveTournaments).toBe(1)
    expect(after.body.billing.canPublish).toBe(false)

    await Tournament.updateOne({ _id: first.id }, { $set: { hasEnded: true } })
    const freed = await host.agent.get('/api/billing/me').expect(200)
    expect(freed.body.billing.canPublish).toBe(true)
  })
})

describe('a legacy tournament with no publishState field', () => {
  it('reads as published', async () => {
    const tournament = await createTournament(host.agent, {}, { published: false })
    await Tournament.collection.updateOne({ _id: tournament.id }, { $unset: { publishState: '' } })

    const response = await guest().get(`/api/tournaments/${tournament.id}`).expect(200)
    expect(response.body.tournament.id).toBe(tournament.id)

    const list = await guest().get('/api/tournaments').expect(200)
    expect(list.body.tournaments.map((t) => t.id)).toContain(tournament.id)
  })
})
