import { describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTeam, createTournament, guest, signUp } from './setup/api.js'
import User from '../src/models/user.model.js'
import Tournament from '../src/models/tournament.model.js'
import Team from '../src/models/team.model.js'
import { joinSolo } from '../src/modules/tournaments/tournament.service.js'
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

    // A real account. The reset is for the demo data; it must not touch this.
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

    expect(await User.exists({ email: 'visitor@example.com' })).toBeTruthy()
    expect(await User.exists({ email: 'demo@tourney.app' })).toBeTruthy()
    expect(await Tournament.countDocuments()).toBe(response.body.seeded.tournaments)
  })

  // A real host, their tournament and their team all outlive the nightly reset.
  it('leaves a real host, their tournament and their team alone', async () => {
    await seedDemoData()

    const host = await signUp('realhost', { isHost: true })
    const player = await signUp('realplayer')
    const team = await createTeam(host.agent, [player.agent], 'Real Deal')
    const tournament = await createTournament(host.agent, { title: 'Real Cup' })
    await player.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    // The two worlds touching, in both directions: the real player is in a demo
    // tournament, and a demo player is in the real one.
    const melee = await Tournament.findOne({ title: 'Midweek Melee' })
    await player.agent.post(`/api/tournaments/${melee._id}/join/solo`).expect(200)
    const lena = await User.findOne({ username: 'lena' })
    await joinSolo(tournament.id, lena._id)

    const reseed = () => guest().get('/api/cron/reseed').set('Authorization', AUTHORISED)
    await reseed().expect(200)
    await reseed().expect(200)

    expect(await User.exists({ _id: host.user.id })).toBeTruthy()
    expect(await User.exists({ _id: player.user.id })).toBeTruthy()
    expect((await Team.findById(team.id)).members).toHaveLength(2)

    const survivor = await Tournament.findById(tournament.id)
    // The demo entrant is still a real document, so the bracket can be played out.
    for (const entry of survivor.enrolledUsers) {
      expect(await User.exists({ _id: entry.userId }), entry.userId).toBeTruthy()
    }

    // And the reseed is still idempotent with real data present.
    expect(await Tournament.countDocuments()).toBe(11)
    expect(await User.countDocuments()).toBe(16)
  })

  it('adopts demo documents seeded before the isDemo flag existed', async () => {
    await seedDemoData()
    for (const model of [User, Team, Tournament]) {
      await model.collection.updateMany({}, { $unset: { isDemo: '' } })
    }
    const before = await User.findOne({ username: 'mei' })

    // First run: nothing is flagged, so nothing is cleared — and the seed flags it.
    const first = await guest().get('/api/cron/reseed').set('Authorization', AUTHORISED)
    expect(first.body.cleared).toMatchObject({ users: 0, tournaments: 0, teams: 0 })
    expect(await Tournament.countDocuments({ isDemo: true })).toBe(10)
    expect(await Team.countDocuments({ isDemo: true })).toBe(4)
    expect(await User.countDocuments({ isDemo: true })).toBe(13)

    // Second run: a normal rebuild.
    const second = await guest().get('/api/cron/reseed').set('Authorization', AUTHORISED)
    expect(second.body.cleared).toMatchObject({ users: 13, tournaments: 10, teams: 4 })
    expect((await User.findOne({ username: 'mei' }))._id).not.toBe(before._id)
    expect(await Tournament.countDocuments()).toBe(10)
  })

  it('is idempotent — running it twice leaves the same dataset', async () => {
    const first = await guest().get('/api/cron/reseed').set('Authorization', AUTHORISED).expect(200)
    const snapshot = {
      users: await User.countDocuments(),
      tournaments: await Tournament.countDocuments(),
    }

    const second = await guest()
      .get('/api/cron/reseed')
      .set('Authorization', AUTHORISED)
      .expect(200)

    for (const key of ['users', 'teams', 'tournaments']) {
      expect(second.body.seeded[key], key).toBe(first.body.seeded[key])
    }

    expect({
      users: await User.countDocuments(),
      tournaments: await Tournament.countDocuments(),
    }).toEqual(snapshot)
  })
})
