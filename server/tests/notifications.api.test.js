import { describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { guest, signUp } from './setup/api.js'
import Notification from '../src/models/notification.model.js'

useDatabase()

function makeNotification(userId, overrides = {}) {
  return Notification.create({
    user: userId,
    type: 'tournament_ended',
    subjectId: crypto.randomUUID(),
    title: 'Tournament ended',
    body: 'It is over.',
    ...overrides,
  })
}

describe('GET /api/notifications', () => {
  it('requires authentication', async () => {
    await guest().get('/api/notifications').expect(401)
  })

  it("lists only the caller's own notifications, newest first", async () => {
    const { agent, user } = await signUp('mei')
    const other = await signUp('tomas')

    await makeNotification(user.id, { title: 'First' })
    await new Promise((resolve) => setTimeout(resolve, 5))
    await makeNotification(user.id, { title: 'Second' })
    await makeNotification(other.user.id, { title: 'Not yours' })

    const { body } = await agent.get('/api/notifications').expect(200)
    expect(body.notifications).toHaveLength(2)
    expect(body.notifications.map((n) => n.title)).toEqual(['Second', 'First'])
    expect(body.unreadCount).toBe(2)
  })
})

describe('GET /api/notifications/unread-count', () => {
  it('counts only unread notifications', async () => {
    const { agent, user } = await signUp('mei')
    const a = await makeNotification(user.id)
    await makeNotification(user.id)
    a.read = true
    await a.save()

    const { body } = await agent.get('/api/notifications/unread-count').expect(200)
    expect(body.count).toBe(1)
  })
})

describe('POST /api/notifications/:id/read', () => {
  it('marks one notification read', async () => {
    const { agent, user } = await signUp('mei')
    const notification = await makeNotification(user.id)

    const { body } = await agent.post(`/api/notifications/${notification._id}/read`).expect(200)
    expect(body.notification.read).toBe(true)

    const { body: after } = await agent.get('/api/notifications/unread-count').expect(200)
    expect(after.count).toBe(0)
  })

  it("refuses to mark another user's notification read", async () => {
    const { agent } = await signUp('mei')
    const other = await signUp('tomas')
    const notification = await makeNotification(other.user.id)

    await agent.post(`/api/notifications/${notification._id}/read`).expect(404)
  })
})

describe('POST /api/notifications/read-all', () => {
  it("marks every one of the caller's notifications read", async () => {
    const { agent, user } = await signUp('mei')
    await makeNotification(user.id)
    await makeNotification(user.id)

    await agent.post('/api/notifications/read-all').expect(200)

    const { body } = await agent.get('/api/notifications/unread-count').expect(200)
    expect(body.count).toBe(0)
  })
})

describe('the idempotency key', () => {
  it('is a database-level unique index, not just an application check', async () => {
    const { user } = await signUp('mei')
    const subjectId = crypto.randomUUID()

    await makeNotification(user.id, { type: 'match_scheduled', subjectId })
    await expect(makeNotification(user.id, { type: 'match_scheduled', subjectId })).rejects.toThrow(
      /duplicate key|E11000/
    )

    expect(
      await Notification.countDocuments({ user: user.id, type: 'match_scheduled', subjectId })
    ).toBe(1)
  })
})
