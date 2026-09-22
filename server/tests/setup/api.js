// Test-facing helpers for driving the API.
//
// `client()` returns a supertest agent, which keeps cookies between requests —
// so a test signs in the way a browser does and every later call is
// authenticated by the same mechanism production uses.

import request from 'supertest'
import app from '../../src/app.js'
import User from '../../src/models/user.model.js'
import Tournament from '../../src/models/tournament.model.js'

export const PASSWORD = 'Passw0rdy'

/** A fresh, signed-out client with its own cookie jar. */
export function client() {
  return request.agent(app)
}

/** A client with no cookies at all, for checking what a guest can see. */
export function guest() {
  return request(app)
}

/**
 * Signs a new account up and returns `{ agent, user }`.
 *
 * `isHost`, `role`, `plan` and `emailVerified` are applied straight to the
 * document: how an account came by them is the subject of other tests, not a
 * precondition of every one. `plan: true` gives it an active subscription.
 * `emailVerified` defaults to `true` so existing suites don't need to know
 * about verification unless they are the ones testing it.
 */
export async function signUp(
  name,
  { isHost = false, role, plan = false, emailVerified = true } = {}
) {
  const agent = client()

  await agent
    .post('/api/auth/signup')
    .send({ email: `${name}@example.com`, username: name, password: PASSWORD })
    .expect(201)

  const update = { isHost, emailVerified }
  if (role) update.role = role
  if (plan) update.hostingPlan = { status: 'active', provider: 'test', updatedAt: new Date() }
  await User.updateOne({ username: name }, { $set: update })

  const { body } = await agent.get('/api/users/me').expect(200)
  return { agent, user: body.user }
}

/** Creates a team led by `leader`, joined by everyone in `members`. */
export async function createTeam(leader, members, name) {
  const { body } = await leader.post('/api/teams').send({ name }).expect(201)

  for (const member of members) {
    await member.post(`/api/teams/join/${body.team.joinCode}`).expect(200)
  }

  return body.team
}

const DAY = 24 * 60 * 60 * 1000

/** A valid create payload, with only the interesting fields spelled out per test. */
export function tournamentPayload(overrides = {}) {
  const now = Date.now()
  return {
    title: 'Test Cup',
    type: 'brackets',
    category: 'chess',
    accessibility: 'open',
    teamSize: 1,
    maxCapacity: 4,
    startDate: new Date(now + DAY).toISOString(),
    endDate: new Date(now + 3 * DAY).toISOString(),
    ...overrides,
  }
}

/**
 * Creates a tournament as `host` and returns the public view of it.
 *
 * Published by default, applied straight to the document: what it takes to
 * publish is the subject of `subscriptions`, not a precondition of every other
 * suite. Pass `{ published: false }` to get the draft the API really makes.
 */
export async function createTournament(host, overrides = {}, { published = true } = {}) {
  const { body } = await host
    .post('/api/tournaments')
    .send(tournamentPayload(overrides))
    .expect(201)

  if (!published) return body.tournament

  await Tournament.updateOne({ _id: body.tournament.id }, { $set: { publishState: 'published' } })
  return { ...body.tournament, publishState: 'published' }
}

/** A user's plan status, read straight from the database. */
export async function planOf(userId) {
  const user = await User.findById(userId).select('hostingPlan').lean()
  return user?.hostingPlan?.status ?? 'none'
}
