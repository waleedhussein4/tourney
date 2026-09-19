import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, guest, signUp, totalCredits } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'
import PublishRequest from '../src/models/publishRequest.model.js'
import { PUBLISH_TIERS, tierFor } from '../src/config/publishing.js'
import { migratePublishState } from '../scripts/migrate-publish-state.js'

useDatabase()

let host
let stranger
let mei
let admin

beforeEach(async () => {
  host = await signUp('hostie', { credits: 500, isHost: true })
  stranger = await signUp('mallory', { credits: 500, isHost: true })
  mei = await signUp('mei', { credits: 500 })
  admin = await signUp('root', { role: 'admin' })
})

/** A tournament exactly as the API makes it: a draft nobody has published. */
function draft(overrides = {}) {
  return createTournament(host.agent, overrides, { published: false })
}

/** A 16-slot draft — the `small` paid tier. */
function paidDraft(overrides = {}) {
  return draft({ maxCapacity: 16, prize: 160, ...overrides })
}

/** Publishes a paid draft and returns `{ tournament, request }`, the latter from the admin queue. */
async function pendingPayment(overrides = {}) {
  const created = await paidDraft(overrides)
  const { body } = await host.agent.post(`/api/tournaments/${created.id}/publish`).expect(200)
  const queue = await admin.agent.get('/api/admin/publish-requests').expect(200)
  const request = queue.body.requests.find((entry) => entry.tournamentId === created.id)
  return { tournament: body.tournament, request }
}

describe('pricing', () => {
  it('derives the tier from the player cap', () => {
    expect(tierFor(2).tier).toBe('free')
    expect(tierFor(8).tier).toBe('free')
    expect(tierFor(9).tier).toBe('small')
    expect(tierFor(16).tier).toBe('small')
    expect(tierFor(17).tier).toBe('large')
    expect(tierFor(64).tier).toBe('large')
    expect(tierFor(65)).toBeNull()
  })

  it('charges what docs/MONETISATION.md says', () => {
    expect(PUBLISH_TIERS.map((entry) => [entry.tier, entry.amountLbp])).toEqual([
      ['free', 0],
      ['small', 150_000],
      ['large', 300_000],
    ])
  })
})

describe('POST /api/tournaments/:id/publish', () => {
  it('creates every tournament as a draft', async () => {
    const created = await draft()
    expect(created.publishState).toBe('draft')
  })

  it('publishes a free-tier tournament immediately, with no request row', async () => {
    const created = await draft({ maxCapacity: 8, prize: 80 })

    const { body } = await host.agent.post(`/api/tournaments/${created.id}/publish`).expect(200)

    expect(body.tournament.publishState).toBe('published')
    expect(await PublishRequest.countDocuments()).toBe(0)
  })

  it('sends a paid-tier tournament to pending_payment and records what is owed', async () => {
    const created = await paidDraft()

    const { body } = await host.agent.post(`/api/tournaments/${created.id}/publish`).expect(200)

    expect(body.tournament.publishState).toBe('pending_payment')
    expect(body.tournament.publishRequest).toMatchObject({ tier: 'small', amountLbp: 150_000 })
    expect(body.tournament.publishRequest.requestedAt).toBeTruthy()

    const stored = await Tournament.findById(created.id)
    expect(stored.publishRequest.tier).toBe('small')
    expect(stored.publishRequest.amountLbp).toBe(150_000)
  })

  it('prices the large tier', async () => {
    const created = await draft({ maxCapacity: 64, prize: 640 })
    const { body } = await host.agent.post(`/api/tournaments/${created.id}/publish`).expect(200)
    expect(body.tournament.publishRequest).toMatchObject({ tier: 'large', amountLbp: 300_000 })
  })

  it('refuses a cap no tier covers, and leaves the draft alone', async () => {
    const created = await draft({ maxCapacity: 128, prize: 1280 })

    await host.agent.post(`/api/tournaments/${created.id}/publish`).expect(400)

    expect((await Tournament.findById(created.id)).publishState).toBe('draft')
    expect(await PublishRequest.countDocuments()).toBe(0)
  })

  it('is the host’s action alone', async () => {
    const created = await paidDraft()

    await guest().post(`/api/tournaments/${created.id}/publish`).expect(401)
    await stranger.agent.post(`/api/tournaments/${created.id}/publish`).expect(403)

    expect((await Tournament.findById(created.id)).publishState).toBe('draft')
  })

  it('answers 409 when the tournament is not a draft, without a second request row', async () => {
    const { tournament } = await pendingPayment()
    await host.agent.post(`/api/tournaments/${tournament.id}/publish`).expect(409)
    expect(await PublishRequest.countDocuments()).toBe(1)

    const published = await createTournament(host.agent)
    await host.agent.post(`/api/tournaments/${published.id}/publish`).expect(409)
  })

  it('moves no credits', async () => {
    const before = await totalCredits()
    const { request } = await pendingPayment()
    await admin.agent.post(`/api/admin/publish-requests/${request.id}/confirm`).expect(200)
    expect(await totalCredits()).toBe(before)
  })
})

describe('an unpublished tournament', () => {
  for (const state of ['draft', 'pending_payment']) {
    describe(`in ${state}`, () => {
      let tournament

      beforeEach(async () => {
        tournament =
          state === 'draft'
            ? await draft({ maxCapacity: 2, prize: 20 })
            : (await pendingPayment()).tournament
      })

      it('is missing from browse, search filters, and trending', async () => {
        const browse = await guest().get('/api/tournaments').expect(200)
        expect(browse.body.tournaments).toEqual([])
        expect(browse.body.pagination.total).toBe(0)

        const filtered = await guest().get('/api/tournaments?status=upcoming').expect(200)
        expect(filtered.body.tournaments).toEqual([])

        const trending = await guest().get('/api/tournaments/trending').expect(200)
        expect(trending.body.tournaments).toEqual([])
      })

      it('is a 404 to everyone but its host', async () => {
        await guest().get(`/api/tournaments/${tournament.id}`).expect(404)
        await mei.agent.get(`/api/tournaments/${tournament.id}`).expect(404)
        await admin.agent.get(`/api/tournaments/${tournament.id}`).expect(404)

        const own = await host.agent.get(`/api/tournaments/${tournament.id}`).expect(200)
        expect(own.body.tournament.publishState).toBe(state)
      })

      it('shows up in its host’s own list', async () => {
        const { body } = await host.agent.get('/api/tournaments/mine').expect(200)
        expect(body.tournaments.map((entry) => entry.id)).toEqual([tournament.id])
      })

      it('cannot be joined or applied to, and takes nobody’s entry fee', async () => {
        const before = await totalCredits()

        await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(404)
        await mei.agent
          .post(`/api/tournaments/${tournament.id}/applications`)
          .send({ fields: [] })
          .expect(404)

        const stored = await Tournament.findById(tournament.id)
        expect(stored.participantCount()).toBe(0)
        expect(stored.bank).toBe(0)
        expect(await totalCredits()).toBe(before)
      })

      it('cannot be started', async () => {
        await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(400)
        expect((await Tournament.findById(tournament.id)).hasStarted).toBe(false)
      })
    })
  }

  it('cannot be joined as a team either', async () => {
    const created = await draft({ teamSize: 2, maxCapacity: 2, prize: 40 })
    const { body } = await mei.agent.post('/api/teams').send({ name: 'Night Owls' }).expect(201)

    await mei.agent
      .post(`/api/tournaments/${created.id}/join/team`)
      .send({ teamId: body.team.id ?? body.team._id })
      .expect(404)
  })
})

describe('a published tournament', () => {
  it('is on browse and joinable once a free tier publishes', async () => {
    const created = await draft({ maxCapacity: 2, prize: 20 })
    await host.agent.post(`/api/tournaments/${created.id}/publish`).expect(200)

    const browse = await guest().get('/api/tournaments').expect(200)
    expect(browse.body.tournaments.map((entry) => entry.id)).toEqual([created.id])

    await guest().get(`/api/tournaments/${created.id}`).expect(200)
    await mei.agent.post(`/api/tournaments/${created.id}/join/solo`).expect(200)
  })

  it('does not tell the public what its host paid', async () => {
    const { tournament, request } = await pendingPayment()
    await admin.agent.post(`/api/admin/publish-requests/${request.id}/confirm`).expect(200)

    const seen = await mei.agent.get(`/api/tournaments/${tournament.id}`).expect(200)
    expect(seen.body.tournament.publishRequest).toBeUndefined()
  })
})

describe('the admin queue', () => {
  it('lists pending requests newest first, with who and how much', async () => {
    const first = await pendingPayment({ title: 'First Cup' })
    const second = await pendingPayment({ title: 'Second Cup', maxCapacity: 64, prize: 640 })

    const { body } = await admin.agent.get('/api/admin/publish-requests').expect(200)

    expect(body.requests.map((entry) => entry.tournamentId)).toEqual([
      second.tournament.id,
      first.tournament.id,
    ])
    expect(body.requests[0]).toMatchObject({
      tournamentTitle: 'Second Cup',
      host: { id: host.user.id, name: 'hostie' },
      tier: 'large',
      amountLbp: 300_000,
      status: 'pending',
    })
    expect(body.requests[0].requestedAt).toBeTruthy()
  })

  it('drops a request from the list once it is resolved', async () => {
    const { request } = await pendingPayment()
    await admin.agent.post(`/api/admin/publish-requests/${request.id}/confirm`).expect(200)

    const { body } = await admin.agent.get('/api/admin/publish-requests').expect(200)
    expect(body.requests).toEqual([])
  })

  it('is 401 for a guest and 403 for anyone who is not an admin — hosts included', async () => {
    const { tournament, request } = await pendingPayment()
    const routes = [
      ['get', '/api/admin/publish-requests'],
      ['post', `/api/admin/publish-requests/${request.id}/confirm`],
      ['post', `/api/admin/publish-requests/${request.id}/reject`],
    ]

    for (const [method, path] of routes) {
      await guest()[method](path).expect(401)
      await mei.agent[method](path).expect(403)
      await host.agent[method](path).expect(403)
    }

    // And being turned away changed nothing.
    expect((await Tournament.findById(tournament.id)).publishState).toBe('pending_payment')
    expect((await PublishRequest.findById(request.id)).status).toBe('pending')
  })
})

describe('confirm', () => {
  it('publishes the tournament and records who confirmed, when, and the Whish reference', async () => {
    const { tournament, request } = await pendingPayment()

    const { body } = await admin.agent
      .post(`/api/admin/publish-requests/${request.id}/confirm`)
      .send({ whishRef: 'WH-12345' })
      .expect(200)

    expect(body.request).toMatchObject({
      status: 'confirmed',
      confirmedBy: admin.user.id,
      whishRef: 'WH-12345',
    })
    expect(body.request.confirmedAt).toBeTruthy()

    expect((await Tournament.findById(tournament.id)).publishState).toBe('published')
    const browse = await guest().get('/api/tournaments').expect(200)
    expect(browse.body.tournaments.map((entry) => entry.id)).toEqual([tournament.id])
  })

  it('does not need a Whish reference', async () => {
    const { request } = await pendingPayment()
    const { body } = await admin.agent
      .post(`/api/admin/publish-requests/${request.id}/confirm`)
      .expect(200)
    expect(body.request.whishRef).toBeUndefined()
  })

  it('rejects a body it does not recognise, rather than losing a misspelt reference', async () => {
    const { request } = await pendingPayment()
    await admin.agent
      .post(`/api/admin/publish-requests/${request.id}/confirm`)
      .send({ whishref: 'WH-12345' })
      .expect(400)
    expect((await PublishRequest.findById(request.id)).status).toBe('pending')
  })

  it('is a 409 on a request that is no longer pending', async () => {
    const confirmed = await pendingPayment({ title: 'Confirmed Cup' })
    await admin.agent
      .post(`/api/admin/publish-requests/${confirmed.request.id}/confirm`)
      .expect(200)
    await admin.agent
      .post(`/api/admin/publish-requests/${confirmed.request.id}/confirm`)
      .expect(409)
    await admin.agent.post(`/api/admin/publish-requests/${confirmed.request.id}/reject`).expect(409)
    expect((await Tournament.findById(confirmed.tournament.id)).publishState).toBe('published')

    const rejected = await pendingPayment({ title: 'Rejected Cup' })
    await admin.agent.post(`/api/admin/publish-requests/${rejected.request.id}/reject`).expect(200)
    await admin.agent.post(`/api/admin/publish-requests/${rejected.request.id}/confirm`).expect(409)
    expect((await Tournament.findById(rejected.tournament.id)).publishState).toBe('draft')
  })

  it('is a 409 when the tournament itself is not pending_payment, whatever the row says', async () => {
    const { tournament, request } = await pendingPayment()
    await Tournament.updateOne({ _id: tournament.id }, { $set: { publishState: 'draft' } })

    await admin.agent.post(`/api/admin/publish-requests/${request.id}/confirm`).expect(409)
    await admin.agent.post(`/api/admin/publish-requests/${request.id}/reject`).expect(409)

    expect((await PublishRequest.findById(request.id)).status).toBe('pending')
  })

  it('is a 404 for a request that does not exist', async () => {
    await admin.agent
      .post('/api/admin/publish-requests/5b1f0a0e-8a53-4c53-9c6f-0f6f4f2f7a11/confirm')
      .expect(404)
  })
})

describe('reject', () => {
  it('returns the tournament to draft and keeps the reason', async () => {
    const { tournament, request } = await pendingPayment()

    const { body } = await admin.agent
      .post(`/api/admin/publish-requests/${request.id}/reject`)
      .send({ reason: 'No transfer received' })
      .expect(200)

    expect(body.request).toMatchObject({ status: 'rejected', reason: 'No transfer received' })
    expect((await Tournament.findById(tournament.id)).publishState).toBe('draft')
    await guest().get(`/api/tournaments/${tournament.id}`).expect(404)
  })

  it('lets the host try again, under a new request row', async () => {
    const { tournament, request } = await pendingPayment()
    await admin.agent.post(`/api/admin/publish-requests/${request.id}/reject`).expect(200)

    await host.agent.post(`/api/tournaments/${tournament.id}/publish`).expect(200)

    const rows = await PublishRequest.find({ tournamentId: tournament.id }).sort({ requestedAt: 1 })
    expect(rows.map((row) => row.status)).toEqual(['rejected', 'pending'])
  })
})

describe('the audit trail', () => {
  it('has exactly one PublishRequest row for every paid publish, and none for free ones', async () => {
    await pendingPayment({ title: 'Small Cup' })
    await pendingPayment({ title: 'Large Cup', maxCapacity: 64, prize: 640 })
    const free = await draft({ title: 'Free Cup' })
    await host.agent.post(`/api/tournaments/${free.id}/publish`).expect(200)

    // Checked from both sides, the way the conservation suite checks the ledger:
    // every tournament that was asked for money has a row, and every row points
    // at a tournament that was asked for the same amount.
    const asked = await Tournament.find({ 'publishRequest.tier': { $exists: true } })
    const rows = await PublishRequest.find()

    expect(asked).toHaveLength(2)
    expect(rows).toHaveLength(2)
    for (const tournament of asked) {
      const matching = rows.filter((row) => row.tournamentId === String(tournament._id))
      expect(matching).toHaveLength(1)
      expect(matching[0].amountLbp).toBe(tournament.publishRequest.amountLbp)
      expect(matching[0].tier).toBe(tournament.publishRequest.tier)
      expect(matching[0].hostId).toBe(host.user.id)
    }
  })

  it('closes a pending request when its host cancels the tournament', async () => {
    const { tournament, request } = await pendingPayment()

    await host.agent.delete(`/api/tournaments/${tournament.id}`).expect(200)

    const row = await PublishRequest.findById(request.id)
    expect(row.status).toBe('rejected')
    const queue = await admin.agent.get('/api/admin/publish-requests').expect(200)
    expect(queue.body.requests).toEqual([])
  })
})

describe('the migration', () => {
  /** Inserted through the driver, so the document has no `publishState` — as every pre-existing one does. */
  async function legacyTournament(title) {
    const created = await draft({ title })
    await Tournament.collection.updateOne({ _id: created.id }, { $unset: { publishState: '' } })
    return created
  }

  it('marks tournaments that predate publishState as published', async () => {
    const legacy = await legacyTournament('Old Cup')
    const browseBefore = await guest().get('/api/tournaments').expect(200)
    expect(browseBefore.body.tournaments).toEqual([])

    expect(await migratePublishState()).toEqual({ migrated: 1 })

    const browseAfter = await guest().get('/api/tournaments').expect(200)
    expect(browseAfter.body.tournaments.map((entry) => entry.id)).toEqual([legacy.id])
  })

  it('is idempotent, and never promotes a real draft or a pending payment', async () => {
    await legacyTournament('Old Cup')
    const fresh = await draft({ title: 'New Draft' })
    const { tournament: pending } = await pendingPayment({ title: 'Waiting Cup' })

    expect(await migratePublishState()).toEqual({ migrated: 1 })
    expect(await migratePublishState()).toEqual({ migrated: 0 })

    expect((await Tournament.findById(fresh.id)).publishState).toBe('draft')
    expect((await Tournament.findById(pending.id)).publishState).toBe('pending_payment')
  })
})
