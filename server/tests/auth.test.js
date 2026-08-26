import { describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { client, guest, PASSWORD, signUp } from './setup/api.js'
import User from '../src/models/user.model.js'
import Transaction from '../src/models/transaction.model.js'
import { HOST_UPGRADE_COST } from '../src/config/constants.js'

useDatabase()

const DAY_IN_SECONDS = 24 * 60 * 60

/** Reads the one auth cookie off a response, failing loudly if there is not exactly one. */
function authCookie(response) {
  const cookies = response.headers['set-cookie'] ?? []
  expect(cookies).toHaveLength(1)
  return cookies[0]
}

describe('POST /api/auth/signup', () => {
  it('creates an account and signs the caller in', async () => {
    const agent = client()

    const response = await agent
      .post('/api/auth/signup')
      .send({ email: 'ada@example.com', username: 'ada', password: PASSWORD })
      .expect(201)

    expect(response.body.user).toMatchObject({
      username: 'ada',
      email: 'ada@example.com',
      credits: 0,
      isHost: false,
      isAdmin: false,
    })

    await agent.get('/api/users/me').expect(200)
  })

  it('never returns the password hash', async () => {
    const response = await client()
      .post('/api/auth/signup')
      .send({ email: 'ada@example.com', username: 'ada', password: PASSWORD })
      .expect(201)

    expect(response.body.user).not.toHaveProperty('password')
    expect(JSON.stringify(response.body)).not.toContain('$2b$')
  })

  it('stores the email lowercased so one address cannot become two accounts', async () => {
    await client()
      .post('/api/auth/signup')
      .send({ email: 'Ada@Example.COM', username: 'ada', password: PASSWORD })
      .expect(201)

    expect(await User.findOne({ email: 'ada@example.com' })).not.toBeNull()

    await client()
      .post('/api/auth/signup')
      .send({ email: 'ADA@example.com', username: 'someone-else', password: PASSWORD })
      .expect(409)
  })

  it.each([
    ['too short', 'Ab1'],
    ['no uppercase', 'passw0rdy'],
    ['no lowercase', 'PASSW0RDY'],
    ['no digit', 'Passwordy'],
  ])('rejects a password that is %s', async (_label, password) => {
    const response = await client()
      .post('/api/auth/signup')
      .send({ email: 'ada@example.com', username: 'ada', password })
      .expect(400)

    expect(response.body.error.code).toBe('VALIDATION_FAILED')
    expect(response.body.error.details.length).toBeGreaterThan(0)
    expect(await User.countDocuments()).toBe(0)
  })

  it('rejects a malformed email', async () => {
    await client()
      .post('/api/auth/signup')
      .send({ email: 'not-an-email', username: 'ada', password: PASSWORD })
      .expect(400)
  })

  describe('duplicates', () => {
    it('reports a taken email as a conflict, leaving one account', async () => {
      await signUp('ada')

      const response = await client()
        .post('/api/auth/signup')
        .send({ email: 'ada@example.com', username: 'different', password: PASSWORD })
        .expect(409)

      expect(response.body.error.message).toMatch(/email/i)
      expect(await User.countDocuments()).toBe(1)
    })

    it('reports a taken username as a conflict', async () => {
      await signUp('ada')

      await client()
        .post('/api/auth/signup')
        .send({ email: 'other@example.com', username: 'ada', password: PASSWORD })
        .expect(409)

      expect(await User.countDocuments()).toBe(1)
    })

    // The original swallowed the failed insert, returned `undefined`, and signed
    // a token for it — so a duplicate signup handed out a session belonging to
    // no one.
    it('does not issue a session when the signup fails', async () => {
      await signUp('ada')
      const agent = client()

      await agent
        .post('/api/auth/signup')
        .send({ email: 'ada@example.com', username: 'different', password: PASSWORD })
        .expect(409)

      await agent.get('/api/users/me').expect(401)
    })
  })
})

describe('the auth cookie', () => {
  it('is emitted exactly once, HttpOnly, SameSite=Lax and scoped to the site', async () => {
    const response = await client()
      .post('/api/auth/signup')
      .send({ email: 'ada@example.com', username: 'ada', password: PASSWORD })
      .expect(201)

    const cookie = authCookie(response)
    expect(cookie).toMatch(/^token=/)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=Lax/i)
    expect(cookie).toMatch(/Path=\//)
  })

  it('is not marked Secure outside production, so it works over plain http locally', async () => {
    const response = await client()
      .post('/api/auth/signup')
      .send({ email: 'ada@example.com', username: 'ada', password: PASSWORD })
      .expect(201)

    expect(authCookie(response)).not.toMatch(/Secure/i)
  })
})

describe('POST /api/auth/login', () => {
  it('signs an existing user in', async () => {
    await signUp('ada')
    const agent = client()

    const response = await agent
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: PASSWORD })
      .expect(200)

    expect(response.body.user.username).toBe('ada')
    await agent.get('/api/users/me').expect(200)
  })

  it('gives the same answer for a wrong password and an unknown email', async () => {
    await signUp('ada')

    const wrongPassword = await client()
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'Wrong0000' })
      .expect(401)

    const unknownEmail = await client()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Wrong0000' })
      .expect(401)

    // Two different messages here would be a free account-enumeration oracle.
    // The original said "Incorrect email" or "Incorrect password" depending on
    // which one it was, which told an attacker exactly which addresses exist.
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message)
    expect(wrongPassword.body.error.message).not.toMatch(/^Incorrect (email|password)$/i)
  })

  it('does not require the current password policy, so old accounts can still sign in', async () => {
    await signUp('ada')
    // A weak password would fail the signup schema; the login schema must not
    // reject it before it gets the chance to be wrong.
    await client()
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'weak' })
      .expect(401)
  })

  describe('remember me', () => {
    const maxAge = (response) => Number(/Max-Age=(\d+)/i.exec(authCookie(response))?.[1])

    it('lasts a day by default', async () => {
      await signUp('ada')

      const response = await client()
        .post('/api/auth/login')
        .send({ email: 'ada@example.com', password: PASSWORD })
        .expect(200)

      expect(maxAge(response)).toBe(DAY_IN_SECONDS)
    })

    it('lasts thirty days when asked', async () => {
      await signUp('ada')

      const response = await client()
        .post('/api/auth/login')
        .send({ email: 'ada@example.com', password: PASSWORD, rememberMe: true })
        .expect(200)

      expect(maxAge(response)).toBe(30 * DAY_IN_SECONDS)
    })
  })
})

describe('POST /api/auth/logout', () => {
  it('clears the cookie and ends the session', async () => {
    const { agent } = await signUp('ada')

    await agent.post('/api/auth/logout').expect(204)
    await agent.get('/api/users/me').expect(401)
  })

  it('is harmless when nobody is signed in', async () => {
    await guest().post('/api/auth/logout').expect(204)
  })
})

describe('GET /api/users/me', () => {
  it('answers 401 for a guest, in the standard error shape', async () => {
    const response = await guest().get('/api/users/me').expect(401)

    expect(response.body).toEqual({ error: { message: expect.any(String) } })
    // The endpoint it replaces answered a bare `false`, which a 401 body could
    // impersonate — every truthiness check on it read a signed-out visitor as
    // a host.
    expect(response.body).not.toBe(false)
  })

  it('returns the whole identity in one call', async () => {
    const { agent } = await signUp('ada', { credits: 42, isHost: true, role: 'admin' })

    const { body } = await agent.get('/api/users/me').expect(200)

    expect(body.user).toMatchObject({
      username: 'ada',
      credits: 42,
      isHost: true,
      isAdmin: true,
    })
  })

  it('rejects a token signed for an account that no longer exists', async () => {
    const { agent, user } = await signUp('ada')
    await User.deleteOne({ _id: user.id })

    await agent.get('/api/users/me').expect(401)
  })

  it('rejects a forged cookie', async () => {
    await guest().get('/api/users/me').set('Cookie', 'token=not-a-real-jwt').expect(401)
  })
})

describe('POST /api/users/me/become-host', () => {
  it('charges the fixed price, flips isHost, and writes a ledger row', async () => {
    const { agent, user } = await signUp('ada', { credits: 25 })

    const { body } = await agent.post('/api/users/me/become-host').expect(200)

    expect(body.user.isHost).toBe(true)
    expect(body.user.credits).toBe(25 - HOST_UPGRADE_COST)

    const ledger = await Transaction.find({ userId: user.id }).lean()
    expect(ledger).toHaveLength(1)
    expect(ledger[0]).toMatchObject({ type: 'host_upgrade', amount: -HOST_UPGRADE_COST })
  })

  it('refuses when the balance is short, and charges nothing', async () => {
    const { agent, user } = await signUp('ada', { credits: HOST_UPGRADE_COST - 1 })

    await agent.post('/api/users/me/become-host').expect(400)

    const account = await User.findById(user.id)
    expect(account.credits).toBe(HOST_UPGRADE_COST - 1)
    expect(account.isHost).toBe(false)
    expect(await Transaction.countDocuments()).toBe(0)
  })

  it('refuses a second upgrade and does not charge again', async () => {
    const { agent, user } = await signUp('ada', { credits: 100 })

    await agent.post('/api/users/me/become-host').expect(200)
    await agent.post('/api/users/me/become-host').expect(400)

    expect(await User.findById(user.id).then((account) => account.credits)).toBe(
      100 - HOST_UPGRADE_COST
    )
  })

  it('requires a signed-in caller', async () => {
    await guest().post('/api/users/me/become-host').expect(401)
  })

  // Two simultaneous requests both pass a read-then-write balance check; only
  // the conditional update stops the account going negative.
  it('cannot be raced into a negative balance', async () => {
    const { agent, user } = await signUp('ada', { credits: HOST_UPGRADE_COST })

    const results = await Promise.allSettled([
      agent.post('/api/users/me/become-host'),
      agent.post('/api/users/me/become-host'),
    ])

    const succeeded = results.filter(
      (result) => result.status === 'fulfilled' && result.value.status === 200
    )
    expect(succeeded).toHaveLength(1)

    const account = await User.findById(user.id)
    expect(account.credits).toBe(0)
    expect(await Transaction.countDocuments()).toBe(1)
  })
})

describe('GET /api/users/me/transactions', () => {
  it('lists the caller ledger, newest first', async () => {
    const { agent } = await signUp('ada', { credits: 100 })
    await agent.post('/api/users/me/become-host').expect(200)

    const { body } = await agent.get('/api/users/me/transactions').expect(200)

    expect(body.transactions).toHaveLength(1)
    expect(body.transactions[0].type).toBe('host_upgrade')
  })

  it('shows a user only their own rows', async () => {
    const ada = await signUp('ada', { credits: 100 })
    await signUp('bob', { credits: 100 })
    await ada.agent.post('/api/users/me/become-host').expect(200)

    const bob = client()
    await bob.post('/api/auth/login').send({ email: 'bob@example.com', password: PASSWORD })

    const { body } = await bob.get('/api/users/me/transactions').expect(200)
    expect(body.transactions).toHaveLength(0)
  })

  it('requires a signed-in caller', async () => {
    await guest().get('/api/users/me/transactions').expect(401)
  })
})

describe('the endpoints the rewrite deleted', () => {
  // Each of these was a way to obtain credits, or an identity check that a 401
  // body could defeat. They must stay gone.
  it.each([
    ['POST', '/api/user/removeEarn'],
    ['POST', '/api/user/payment'],
    ['GET', '/api/user/loggedin'],
    ['GET', '/api/user/isHost'],
    ['GET', '/api/user/isAdmin'],
    ['GET', '/api/user/profile'],
  ])('%s %s is gone', async (method, path) => {
    const response = await guest()[method.toLowerCase()](path).send({})
    expect(response.status).toBe(404)
  })
})
