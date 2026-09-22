import crypto from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDatabase } from './setup/database.js'
import { client, createTournament, guest, signUp } from './setup/api.js'
import User from '../src/models/user.model.js'

// Same reason as password-reset.test.js: the service checks `mailCanSend`
// before doing any work, so the mock has to carry both exports.
vi.mock('../src/lib/mailer.js', () => ({ sendMail: vi.fn(), mailCanSend: true }))
const { sendMail } = await import('../src/lib/mailer.js')

useDatabase()

beforeEach(() => {
  vi.clearAllMocks()
})

/** Pulls the token out of the verification link the mocked mailer was sent. */
function tokenFromLastEmail() {
  const text = sendMail.mock.calls.at(-1)[0].text
  return new URL(/https?:\/\/\S+/.exec(text)[0]).searchParams.get('token')
}

describe('POST /api/auth/signup', () => {
  it('starts a new account unverified and emails a verification link', async () => {
    const agent = client()

    const response = await agent
      .post('/api/auth/signup')
      .send({ email: 'ada@example.com', username: 'ada', password: 'Passw0rdy' })
      .expect(201)

    expect(response.body.user.emailVerified).toBe(false)

    expect(sendMail).toHaveBeenCalledTimes(1)
    const [{ to, text, critical }] = sendMail.mock.calls[0]
    expect(to).toBe('ada@example.com')
    expect(text).toMatch(/\/verify-email\?token=/)
    // A failed send must never fail signup.
    expect(critical).toBe(false)

    const user = await User.findOne({ email: 'ada@example.com' }).select('+verifyEmailToken')
    expect(user.verifyEmailToken).toEqual(expect.any(String))
    expect(text).not.toContain(user.verifyEmailToken)
  })
})

describe('POST /api/auth/verify-email', () => {
  it('verifies a fresh account exactly once', async () => {
    const { agent } = await signUp('ada', { emailVerified: false })
    const token = tokenFromLastEmail()

    await guest().post('/api/auth/verify-email').send({ token }).expect(200)

    const { body } = await agent.get('/api/users/me').expect(200)
    expect(body.user.emailVerified).toBe(true)
  })

  it('rejects a replay of an already-used token', async () => {
    await signUp('ada', { emailVerified: false })
    const token = tokenFromLastEmail()

    await guest().post('/api/auth/verify-email').send({ token }).expect(200)

    const response = await guest().post('/api/auth/verify-email').send({ token }).expect(409)
    expect(response.body.error.code).toBe('VERIFY_ALREADY_DONE')
  })

  it('rejects an expired token', async () => {
    await signUp('ada', { emailVerified: false })
    const token = tokenFromLastEmail()

    await User.updateOne(
      { username: 'ada' },
      { $set: { verifyEmailExpires: new Date(Date.now() - 1000) } }
    )

    const response = await guest().post('/api/auth/verify-email').send({ token }).expect(400)
    expect(response.body.error.code).toBe('VERIFY_EXPIRED')
  })

  it('rejects a tampered or made-up token', async () => {
    await signUp('ada', { emailVerified: false })

    const response = await guest()
      .post('/api/auth/verify-email')
      .send({ token: crypto.randomBytes(32).toString('hex') })
      .expect(400)
    expect(response.body.error.code).toBe('VERIFY_INVALID')
  })
})

describe('POST /api/auth/resend-verification', () => {
  it('sends a fresh link for the signed-in caller', async () => {
    const { agent } = await signUp('ada', { emailVerified: false })
    sendMail.mockClear()

    await agent.post('/api/auth/resend-verification').expect(200)

    expect(sendMail).toHaveBeenCalledTimes(1)
    const token = tokenFromLastEmail()
    await guest().post('/api/auth/verify-email').send({ token }).expect(200)
  })

  it('refuses an already-verified account', async () => {
    const { agent } = await signUp('ada')

    const response = await agent.post('/api/auth/resend-verification').expect(409)
    expect(response.body.error.code).toBe('VERIFY_ALREADY_DONE')
  })

  it('requires a signed-in caller', async () => {
    await guest().post('/api/auth/resend-verification').expect(401)
  })
})

describe('what an unverified account cannot do', () => {
  it('cannot become a host', async () => {
    const { agent } = await signUp('ada', { emailVerified: false })

    const response = await agent.post('/api/users/me/become-host').expect(403)
    expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED')
  })

  it('can become a host once verified', async () => {
    const { agent } = await signUp('ada', { emailVerified: false })
    const token = tokenFromLastEmail()
    await guest().post('/api/auth/verify-email').send({ token }).expect(200)

    const response = await agent.post('/api/users/me/become-host').expect(200)
    expect(response.body.user.isHost).toBe(true)
  })

  it('can still browse and join freely while unverified', async () => {
    const host = await signUp('hostie', { isHost: true })
    const tournament = await createTournament(host.agent)

    const { agent } = await signUp('mei', { emailVerified: false })
    await agent.get(`/api/tournaments/${tournament.id}`).expect(200)
  })
})
