import crypto from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDatabase } from './setup/database.js'
import { client, guest, PASSWORD, signUp } from './setup/api.js'
import User from '../src/models/user.model.js'

// `mailCanSend` has to be mocked too: the service checks it before doing any
// work, and an undefined export would make every reset look unconfigured.
vi.mock('../src/lib/mailer.js', () => ({ sendMail: vi.fn(), mailCanSend: true }))
const { sendMail } = await import('../src/lib/mailer.js')

useDatabase()

beforeEach(() => {
  vi.clearAllMocks()
})

/** Pulls the token out of the reset link the mocked mailer was sent. */
function tokenFromLastEmail() {
  const text = sendMail.mock.calls.at(-1)[0].text
  return new URL(/https?:\/\/\S+/.exec(text)[0]).searchParams.get('token')
}

describe('POST /api/auth/forgot-password', () => {
  it('returns the same success response for an unknown email, and sends nothing', async () => {
    const response = await guest()
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
      .expect(200)

    expect(response.body.message).toEqual(expect.any(String))
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('emails a reset link for a known account', async () => {
    await signUp('ada')

    const response = await guest()
      .post('/api/auth/forgot-password')
      .send({ email: 'ada@example.com' })
      .expect(200)

    expect(sendMail).toHaveBeenCalledTimes(1)
    const [{ to, text }] = sendMail.mock.calls[0]
    expect(to).toBe('ada@example.com')
    expect(text).toMatch(/\/reset-password\?token=/)

    const user = await User.findOne({ email: 'ada@example.com' }).select('+resetPasswordToken')
    expect(user.resetPasswordToken).toEqual(expect.any(String))
    // The raw token is never persisted — only its hash.
    expect(text).not.toContain(user.resetPasswordToken)
    // Same response as the unknown-email case.
    expect(response.body.message).toEqual(expect.any(String))
  })

  it('rejects a malformed email', async () => {
    await guest().post('/api/auth/forgot-password').send({ email: 'not-an-email' }).expect(400)
    expect(sendMail).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/reset-password', () => {
  it('resets the password and the new one logs in', async () => {
    await signUp('ada')
    await guest().post('/api/auth/forgot-password').send({ email: 'ada@example.com' }).expect(200)
    const token = tokenFromLastEmail()

    await guest()
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewPassw0rd' })
      .expect(200)

    await guest()
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: PASSWORD })
      .expect(401)

    await client()
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'NewPassw0rd' })
      .expect(200)
  })

  it('cannot be used twice', async () => {
    await signUp('ada')
    await guest().post('/api/auth/forgot-password').send({ email: 'ada@example.com' }).expect(200)
    const token = tokenFromLastEmail()

    await guest()
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewPassw0rd' })
      .expect(200)

    await guest()
      .post('/api/auth/reset-password')
      .send({ token, password: 'AnotherPassw0rd' })
      .expect(400)
  })

  it('rejects an expired token', async () => {
    await signUp('ada')
    await guest().post('/api/auth/forgot-password').send({ email: 'ada@example.com' }).expect(200)
    const token = tokenFromLastEmail()

    await User.updateOne(
      { email: 'ada@example.com' },
      { $set: { resetPasswordExpires: new Date(Date.now() - 1000) } }
    )

    await guest()
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewPassw0rd' })
      .expect(400)
  })

  it('rejects a tampered or made-up token', async () => {
    await signUp('ada')
    await guest().post('/api/auth/forgot-password').send({ email: 'ada@example.com' }).expect(200)

    await guest()
      .post('/api/auth/reset-password')
      .send({ token: crypto.randomBytes(32).toString('hex'), password: 'NewPassw0rd' })
      .expect(400)
  })

  it('rejects a weak new password, leaving the old one working', async () => {
    await signUp('ada')
    await guest().post('/api/auth/forgot-password').send({ email: 'ada@example.com' }).expect(200)
    const token = tokenFromLastEmail()

    const response = await guest()
      .post('/api/auth/reset-password')
      .send({ token, password: 'weak' })
      .expect(400)
    expect(response.body.error.code).toBe('VALIDATION_FAILED')

    await client()
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: PASSWORD })
      .expect(200)
  })
})
