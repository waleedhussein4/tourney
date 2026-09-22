import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, guest, planOf, signUp } from './setup/api.js'

// The gateway is the only thing that knows Paddle, so a webhook test mocks it
// rather than fabricating a signed payload — this is a test of
// `applySubscription` and the route around it, not of Paddle's SDK.
vi.mock('../src/payments/paddle.js', () => ({
  canTakeCards: vi.fn(() => true),
  createSubscriptionCheckout: vi.fn(),
  readEvent: vi.fn(),
  isSubscriptionEvent: vi.fn(),
  subscriptionFrom: vi.fn(),
  eventIdOf: vi.fn(),
}))

const gateway = await import('../src/payments/paddle.js')

useDatabase()

let host

beforeEach(() => {
  vi.clearAllMocks()
})

/** Queues up one delivery: the event `readEvent` returns, and what it decodes to. */
function deliver({ event = {}, subscription, isSubscription = true } = {}) {
  gateway.readEvent.mockResolvedValueOnce(event)
  gateway.isSubscriptionEvent.mockReturnValueOnce(isSubscription)
  if (subscription) gateway.subscriptionFrom.mockReturnValueOnce(subscription)
}

function post(body = { any: 'payload' }) {
  return guest()
    .post('/api/webhooks/paddle')
    .set('Content-Type', 'application/json')
    .set('Paddle-Signature', 'sig')
    .send(body)
}

describe('an activating event', () => {
  it('sets the plan active and lets the host publish a second tournament', async () => {
    host = await signUp('hostie', { isHost: true })
    const first = await createTournament(host.agent, {}, { published: false })
    const second = await createTournament(host.agent, {}, { published: false })
    await host.agent.post(`/api/tournaments/${first.id}/publish`).expect(200)
    await host.agent.post(`/api/tournaments/${second.id}/publish`).expect(402)

    deliver({
      subscription: {
        userId: host.user.id,
        subscriptionId: 'sub_1',
        status: 'active',
        renewsAt: null,
      },
    })
    await post().expect(200)

    expect(await planOf(host.user.id)).toBe('active')
    await host.agent.post(`/api/tournaments/${second.id}/publish`).expect(200)
  })
})

describe('a cancel event', () => {
  it('sets the plan canceled and the limit bites again', async () => {
    host = await signUp('hostie', { isHost: true, plan: true })
    const first = await createTournament(host.agent, {}, { published: false })
    const second = await createTournament(host.agent, {}, { published: false })
    await host.agent.post(`/api/tournaments/${first.id}/publish`).expect(200)
    await host.agent.post(`/api/tournaments/${second.id}/publish`).expect(200)

    deliver({
      subscription: {
        userId: host.user.id,
        subscriptionId: 'sub_1',
        status: 'canceled',
        renewsAt: null,
      },
    })
    await post().expect(200)

    expect(await planOf(host.user.id)).toBe('canceled')
    const third = await createTournament(host.agent, {}, { published: false })
    await host.agent.post(`/api/tournaments/${third.id}/publish`).expect(402)
  })
})

describe('an unverifiable delivery', () => {
  it('gets a 400 and changes nothing', async () => {
    host = await signUp('hostie', { isHost: true })
    gateway.readEvent.mockRejectedValueOnce(new Error('bad signature'))

    await post().expect(400)

    expect(await planOf(host.user.id)).toBe('none')
    expect(gateway.isSubscriptionEvent).not.toHaveBeenCalled()
  })
})

describe('a non-subscription event', () => {
  it('gets a 200 and changes nothing', async () => {
    host = await signUp('hostie', { isHost: true })
    deliver({ isSubscription: false })

    await post().expect(200)

    expect(gateway.subscriptionFrom).not.toHaveBeenCalled()
    expect(await planOf(host.user.id)).toBe('none')
  })
})

describe('a duplicate delivery', () => {
  it('is harmless the second time', async () => {
    host = await signUp('hostie', { isHost: true })

    for (let i = 0; i < 2; i += 1) {
      deliver({
        subscription: {
          userId: host.user.id,
          subscriptionId: 'sub_1',
          status: 'active',
          renewsAt: null,
        },
      })
      await post().expect(200)
    }

    expect(await planOf(host.user.id)).toBe('active')
  })
})

describe('an event older than what is recorded', () => {
  it('is ignored, and does not resurrect a cancelled plan', async () => {
    host = await signUp('hostie', { isHost: true })

    deliver({
      event: { occurredAt: '2024-01-02T00:00:00.000Z' },
      subscription: {
        userId: host.user.id,
        subscriptionId: 'sub_1',
        status: 'canceled',
        renewsAt: null,
      },
    })
    await post().expect(200)
    expect(await planOf(host.user.id)).toBe('canceled')

    // An activation that happened before the cancellation above must not undo it.
    deliver({
      event: { occurredAt: '2024-01-01T00:00:00.000Z' },
      subscription: {
        userId: host.user.id,
        subscriptionId: 'sub_1',
        status: 'active',
        renewsAt: null,
      },
    })
    await post().expect(200)

    expect(await planOf(host.user.id)).toBe('canceled')
  })
})

describe('an event with no userId in its customData', () => {
  it('is ignored without error', async () => {
    deliver({
      subscription: { userId: null, subscriptionId: 'sub_1', status: 'active', renewsAt: null },
    })
    await post().expect(200)
  })
})
