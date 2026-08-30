import { describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { guest } from './setup/api.js'
import User from '../src/models/user.model.js'
import Tournament from '../src/models/tournament.model.js'
import Product from '../src/models/product.model.js'
import { assertCronAuthorised } from '../src/modules/cron/cron.routes.js'
import { seedDemoData } from '../scripts/seed-data.js'

useDatabase()

// Matches tests/setup/global-setup.js, which puts this in the environment
// before config/env.js reads it.
const SECRET = 'test-cron-secret-long-enough'
const AUTHORISED = `Bearer ${SECRET}`

/**
 * The reseed route can empty the production database. These tests are about the
 * lock, not the reseed: every way of arriving without the right token has to be
 * refused, including the one where the deployment forgot to configure a token
 * at all.
 */
describe('cron authorisation', () => {
  it('refuses outright when no secret is configured', () => {
    expect(() => assertCronAuthorised(AUTHORISED, undefined)).toThrowError(
      expect.objectContaining({ status: 503, code: 'CRON_NOT_CONFIGURED' })
    )
    expect(() => assertCronAuthorised(AUTHORISED, '')).toThrowError(
      expect.objectContaining({ status: 503 })
    )
  })

  it('rejects a missing, malformed, or wrong token', () => {
    for (const header of [
      undefined,
      '',
      SECRET, // no "Bearer " prefix
      'Bearer ',
      'Bearer wrong',
      `Basic ${SECRET}`,
      `Bearer ${SECRET} `, // trailing space is a different token
      `Bearer ${SECRET.toUpperCase()}`,
    ]) {
      expect(() => assertCronAuthorised(header, SECRET), `header: ${header}`).toThrowError(
        expect.objectContaining({ status: 401 })
      )
    }
  })

  it('accepts the configured token', () => {
    expect(() => assertCronAuthorised(AUTHORISED, SECRET)).not.toThrow()
  })
})

describe('POST/GET /api/cron/reseed', () => {
  it('is unauthorised without the bearer token, and changes nothing', async () => {
    await seedDemoData()
    const before = await User.countDocuments()
    expect(before).toBeGreaterThan(0)

    await guest().get('/api/cron/reseed').expect(401)
    await guest().post('/api/cron/reseed').expect(401)
    await guest().get('/api/cron/reseed').set('Authorization', 'Bearer nope').expect(401)

    expect(await User.countDocuments()).toBe(before)
  })

  it('rebuilds the demo data on GET, which is what Vercel Cron sends', async () => {
    await seedDemoData()

    // Something a visitor left behind: it should not survive the reset.
    await guest()
      .post('/api/auth/signup')
      .send({ email: 'visitor@example.com', username: 'visitor', password: 'Passw0rdy' })
      .expect(201)
    expect(await User.exists({ email: 'visitor@example.com' })).toBeTruthy()

    const response = await guest()
      .get('/api/cron/reseed')
      .set('Authorization', AUTHORISED)
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(response.body.cleared.users).toBeGreaterThan(0)
    expect(response.body.seeded.users).toBeGreaterThan(0)
    expect(response.body.durationMs).toBeGreaterThanOrEqual(0)

    expect(await User.exists({ email: 'visitor@example.com' })).toBeNull()
    expect(await User.exists({ email: 'demo@tourney.app' })).toBeTruthy()
    expect(await Tournament.countDocuments()).toBe(response.body.seeded.tournaments)
  })

  it('is idempotent — running it twice leaves the same dataset', async () => {
    const first = await guest().get('/api/cron/reseed').set('Authorization', AUTHORISED).expect(200)
    const snapshot = {
      users: await User.countDocuments(),
      tournaments: await Tournament.countDocuments(),
      products: await Product.countDocuments(),
    }

    const second = await guest()
      .get('/api/cron/reseed')
      .set('Authorization', AUTHORISED)
      .expect(200)

    // The demo data is rebuilt from scratch every time...
    for (const key of ['users', 'teams', 'tournaments']) {
      expect(second.body.seeded[key], key).toBe(first.body.seeded[key])
    }
    // ...but the credit packages are catalogue rows, not demo data: the reset
    // leaves them alone, so the second run finds nothing to create.
    expect(first.body.seeded.products).toBe(3)
    expect(second.body.seeded.products).toBe(0)

    expect({
      users: await User.countDocuments(),
      tournaments: await Tournament.countDocuments(),
      products: await Product.countDocuments(),
    }).toEqual(snapshot)
  })
})
