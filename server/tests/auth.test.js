import { describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { client, guest, PASSWORD, signUp } from './setup/api.js'
import User from '../src/models/user.model.js'

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
      isHost: false,
      isAdmin: false,
      plan: { status: 'none', active: false },
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
    const { agent } = await signUp('ada', { isHost: true, role: 'admin', plan: true })

    const { body } = await agent.get('/api/users/me').expect(200)

    expect(body.user).toMatchObject({
      username: 'ada',
      isHost: true,
      isAdmin: true,
      plan: { status: 'active', active: true },
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
  it('flips isHost, and costs nothing', async () => {
    const { agent } = await signUp('ada')

    const { body } = await agent.post('/api/users/me/become-host').expect(200)

    expect(body.user.isHost).toBe(true)
    // Hosting is free. What is paid for is running more than one tournament at
    // a time, and that is the plan — which a new account does not have.
    expect(body.user.plan).toMatchObject({ status: 'none', active: false })
  })

  it('refuses a second upgrade', async () => {
    const { agent } = await signUp('ada')

    await agent.post('/api/users/me/become-host').expect(200)
    await agent.post('/api/users/me/become-host').expect(400)
  })

  it('requires a signed-in caller', async () => {
    await guest().post('/api/users/me/become-host').expect(401)
  })

  // Two simultaneous requests both pass a read-then-write check; only the
  // conditional update stops the second one succeeding as well.
  it('cannot be raced into two upgrades', async () => {
    const { agent, user } = await signUp('ada')

    const results = await Promise.allSettled([
      agent.post('/api/users/me/become-host'),
      agent.post('/api/users/me/become-host'),
    ])

    const succeeded = results.filter(
      (result) => result.status === 'fulfilled' && result.value.status === 200
    )
    expect(succeeded).toHaveLength(1)
    expect(await User.findById(user.id).then((account) => account.isHost)).toBe(true)
  })
})

describe('the endpoints the rewrite deleted', () => {
  it('the credit ledger is gone for a signed-in caller too', async () => {
    const { agent } = await signUp('ada')
    await agent.get('/api/users/me/transactions').expect(404)
  })


  // Each of these was a way to obtain credits, or an identity check that a 401
  // body could defeat. The credits they granted no longer exist either.
  it.each([
    ['POST', '/api/user/removeEarn'],
    ['POST', '/api/user/payment'],
    ['GET', '/api/user/loggedin'],
    ['GET', '/api/user/isHost'],
    ['GET', '/api/user/isAdmin'],
    ['GET', '/api/user/profile'],
    // Gone with the demo economy: there is no wallet to top up.
    ['GET', '/api/products'],
    ['POST', '/api/credits/checkout/credits-100'],
  ])('%s %s is gone', async (method, path) => {
    const response = await guest()[method.toLowerCase()](path).send({})
    expect(response.status).toBe(404)
  })
})
