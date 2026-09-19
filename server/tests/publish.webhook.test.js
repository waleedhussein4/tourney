import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, guest, signUp } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'
import PublishRequest from '../src/models/publishRequest.model.js'

// The gateway is the one thing these tests must not talk to. Everything it
// would tell us — is this delivery genuine, what did it say — is stubbed, so
// what is under test is our half: what we do once a payment is believed.
vi.mock('../src/payments/paddle.js', () => ({
  canTakeCards: () => true,
  createCheckout: vi.fn(async () => ({ transactionId: 'txn_test_1' })),
  readEvent: vi.fn(),
  isPaymentSettled: (event) => event?.eventType === 'transaction.completed',
  paymentFrom: (event) => ({
    providerRef: event.data.id,
    tournamentId: event.data.customData?.tournamentId ?? null,
    publishRequestId: event.data.customData?.publishRequestId ?? null,
    totalCents: Number(event.data.details?.totals?.total ?? NaN),
    currency: event.data.currencyCode ?? null,
  }),
}))

const gateway = await import('../src/payments/paddle.js')

useDatabase()

let host

beforeEach(async () => {
  vi.clearAllMocks()
  gateway.createCheckout.mockResolvedValue({ transactionId: 'txn_test_1' })
  host = await signUp('hostie', { credits: 500, isHost: true })
})

/** A 16-slot draft — $3 — already waiting on its payment. */
async function awaitingPayment() {
  const created = await createTournament(
    host.agent,
    { maxCapacity: 16, prize: 160 },
    { published: false }
  )
  const { body } = await host.agent.post(`/api/tournaments/${created.id}/publish`).expect(200)
  return { id: created.id, checkout: body.checkout }
}

/** What the gateway would have handed us, once we believed it. */
function settledEvent(tournamentId, { totalCents = 300, id = 'txn_test_1' } = {}) {
  return {
    eventId: `evt_${id}`,
    eventType: 'transaction.completed',
    data: {
      id,
      customData: { tournamentId },
      details: { totals: { total: String(totalCents) } },
      currencyCode: 'USD',
    },
  }
}

function deliver(event) {
  gateway.readEvent.mockResolvedValueOnce(event)
  return guest()
    .post('/api/webhooks/paddle')
    .set('Content-Type', 'application/json')
    .set('Paddle-Signature', 'ts=1;h1=stubbed')
    .send(JSON.stringify(event))
}

describe('opening a checkout', () => {
  it('hands the host a transaction to pay, and waits', async () => {
    const { id, checkout } = await awaitingPayment()

    expect(checkout).toEqual({ transactionId: 'txn_test_1' })
    expect((await Tournament.findById(id)).publishState).toBe('pending_payment')

    // The gateway is told what is being bought by us, not by the browser.
    expect(gateway.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ tournamentId: id })
    )
  })

  it('does not offer the email fallback while a card can be taken', async () => {
    const created = await createTournament(
      host.agent,
      { maxCapacity: 16, prize: 160 },
      { published: false }
    )
    const { body } = await host.agent.get(`/api/tournaments/${created.id}/publish`).expect(200)

    expect(body.publishing.gateway).toMatchObject({ provider: 'paddle' })
    expect(body.publishing.contactEmail).toBeNull()
  })

  it('never sends the API key to the browser', async () => {
    const created = await createTournament(
      host.agent,
      { maxCapacity: 16, prize: 160 },
      { published: false }
    )
    const { text } = await host.agent.get(`/api/tournaments/${created.id}/publish`).expect(200)

    expect(text).not.toMatch(/apikey|api_key|webhook_?secret/i)
  })
})

describe('POST /api/webhooks/paddle', () => {
  it('publishes the tournament when the gateway says it is paid', async () => {
    const { id } = await awaitingPayment()

    await deliver(settledEvent(id)).expect(200)

    expect((await Tournament.findById(id)).publishState).toBe('published')

    const request = await PublishRequest.findOne({ tournamentId: id })
    expect(request).toMatchObject({
      status: 'confirmed',
      provider: 'paddle',
      providerRef: 'txn_test_1',
    })
    expect(request.confirmedAt).toBeTruthy()

    // And it is a tournament the public can now find.
    const browse = await guest().get('/api/tournaments').expect(200)
    expect(browse.body.tournaments.map((entry) => entry.id)).toEqual([id])
  })

  it('refuses a delivery it cannot verify, and publishes nothing', async () => {
    const { id } = await awaitingPayment()

    gateway.readEvent.mockRejectedValueOnce(new Error('bad signature'))
    await guest()
      .post('/api/webhooks/paddle')
      .set('Content-Type', 'application/json')
      .set('Paddle-Signature', 'ts=1;h1=forged')
      .send(JSON.stringify(settledEvent(id)))
      .expect(400)

    expect((await Tournament.findById(id)).publishState).toBe('pending_payment')
  })

  it('ignores a payment for the wrong amount', async () => {
    const { id } = await awaitingPayment()

    // 1 cent for a $3 tier. Answered 200 so the gateway stops retrying, but
    // nothing is published.
    await deliver(settledEvent(id, { totalCents: 1 })).expect(200)

    expect((await Tournament.findById(id)).publishState).toBe('pending_payment')
    expect((await PublishRequest.findOne({ tournamentId: id })).status).toBe('pending')
  })

  it('is idempotent — the same event twice publishes once', async () => {
    const { id } = await awaitingPayment()

    await deliver(settledEvent(id)).expect(200)
    const first = await PublishRequest.findOne({ tournamentId: id })

    await deliver(settledEvent(id)).expect(200)
    const second = await PublishRequest.findOne({ tournamentId: id })

    expect(await PublishRequest.countDocuments({ tournamentId: id })).toBe(1)
    expect(second.confirmedAt.getTime()).toBe(first.confirmedAt.getTime())
  })

  it('does nothing for an event that is not a settled payment', async () => {
    const { id } = await awaitingPayment()

    await deliver({ ...settledEvent(id), eventType: 'transaction.created' }).expect(200)

    expect((await Tournament.findById(id)).publishState).toBe('pending_payment')
  })

  it('shrugs off a payment for a tournament that is not waiting on one', async () => {
    const published = await createTournament(host.agent)

    await deliver(settledEvent(published.id)).expect(200)

    expect((await Tournament.findById(published.id)).publishState).toBe('published')
    expect(await PublishRequest.countDocuments()).toBe(0)
  })
})
