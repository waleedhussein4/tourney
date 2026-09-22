import crypto from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDatabase } from './setup/database.js'
import { guest, signUp } from './setup/api.js'
import Notification from '../src/models/notification.model.js'
import User from '../src/models/user.model.js'
import config from '../src/config/env.js'
import { notify } from '../src/modules/notifications/notification.service.js'

// Same reason as notifications.test.js: `notify` checks `mailCanSend`-adjacent
// state before doing any work, so the mock has to carry both exports.
vi.mock('../src/lib/mailer.js', () => ({ sendMail: vi.fn(), mailCanSend: true }))
const { sendMail } = await import('../src/lib/mailer.js')

useDatabase()

beforeEach(() => {
  vi.clearAllMocks()
})

function signToken(userId, category) {
  return crypto.createHmac('sha256', config.jwtSecret).update(`${userId}:${category}`).digest('hex')
}

describe('a disabled category', () => {
  it('still creates the in-app notification but sends no email', async () => {
    const { user } = await signUp('mei')
    await User.updateOne({ _id: user.id }, { $set: { 'emailPreferences.matchScheduled': false } })
    sendMail.mockClear()

    const notification = await notify({
      userId: user.id,
      type: 'match_scheduled',
      subjectId: crypto.randomUUID(),
      title: 'Match scheduled',
      body: 'Your match is scheduled.',
    })

    expect(notification).not.toBeNull()
    expect(await Notification.countDocuments({ user: user.id, type: 'match_scheduled' })).toBe(1)
    expect(sendMail).not.toHaveBeenCalled()
  })
})

describe('an enabled category', () => {
  it('sends an email with a working unsubscribe link', async () => {
    const { user } = await signUp('tomas')
    sendMail.mockClear()

    await notify({
      userId: user.id,
      type: 'result_disputed',
      subjectId: crypto.randomUUID(),
      title: 'Result disputed',
      body: 'Your result was disputed.',
    })

    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(sendMail.mock.calls[0][0].text).toContain('/unsubscribe?')
  })
})

describe('security mail', () => {
  it('sends regardless of notification preferences', async () => {
    const { agent, user } = await signUp('ada', { emailVerified: false })
    await User.updateOne(
      { _id: user.id },
      {
        $set: {
          emailPreferences: {
            matchScheduled: false,
            matchStartingSoon: false,
            resultDisputed: false,
            applicationDecided: false,
          },
        },
      }
    )

    sendMail.mockClear()
    await agent.post('/api/auth/resend-verification').expect(200)

    expect(sendMail).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/notifications/unsubscribe', () => {
  it('works signed out with a valid token, and turns off only that category', async () => {
    const { user } = await signUp('kofi')
    const token = signToken(user.id, 'matchScheduled')

    const { body } = await guest()
      .post('/api/notifications/unsubscribe')
      .send({ userId: user.id, category: 'matchScheduled', token })
      .expect(200)

    expect(body.preferences.matchScheduled).toBe(false)
    expect(body.preferences.resultDisputed).toBe(true)

    const stored = await User.findById(user.id).select('emailPreferences').lean()
    expect(stored.emailPreferences.matchScheduled).toBe(false)
  })

  it('rejects a tampered token', async () => {
    const { user } = await signUp('lena')
    const token = signToken(user.id, 'matchScheduled')
    const tampered = token.slice(0, -1) + (token.at(-1) === '0' ? '1' : '0')

    await guest()
      .post('/api/notifications/unsubscribe')
      .send({ userId: user.id, category: 'matchScheduled', token: tampered })
      .expect(400)

    const stored = await User.findById(user.id).select('emailPreferences').lean()
    expect(stored.emailPreferences.matchScheduled).toBe(true)
  })

  it("rejects a token signed for a different user's category", async () => {
    const { user: victim } = await signUp('nia')
    const { user: attacker } = await signUp('omar')
    const tokenForAttacker = signToken(attacker.id, 'matchScheduled')

    await guest()
      .post('/api/notifications/unsubscribe')
      .send({ userId: victim.id, category: 'matchScheduled', token: tokenForAttacker })
      .expect(400)
  })
})

describe('GET/PATCH /api/notifications/preferences', () => {
  it('requires authentication', async () => {
    await guest().get('/api/notifications/preferences').expect(401)
    await guest()
      .patch('/api/notifications/preferences')
      .send({ matchScheduled: false })
      .expect(401)
  })

  it('reads and updates the signed-in caller preferences', async () => {
    const { agent } = await signUp('priya')

    const initial = await agent.get('/api/notifications/preferences').expect(200)
    expect(initial.body.preferences).toEqual({
      matchScheduled: true,
      matchStartingSoon: true,
      resultDisputed: true,
      applicationDecided: true,
    })

    const updated = await agent
      .patch('/api/notifications/preferences')
      .send({ matchScheduled: false, resultDisputed: false })
      .expect(200)

    expect(updated.body.preferences.matchScheduled).toBe(false)
    expect(updated.body.preferences.resultDisputed).toBe(false)
    expect(updated.body.preferences.matchStartingSoon).toBe(true)
  })
})
