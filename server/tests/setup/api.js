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
 * `credits` and `isHost` are applied straight to the document: how a user came
 * by their credits is the subject of other tests, not a precondition of this
 * one.
 */
export async function signUp(name, { credits = 0, isHost = false, role } = {}) {
  const agent = client()

  await agent
    .post('/api/auth/signup')
    .send({ email: `${name}@example.com`, username: name, password: PASSWORD })
    .expect(201)

  const update = { credits, isHost }
  if (role) update.role = role
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
    entryFee: 10,
    prize: 40,
    startDate: new Date(now + DAY).toISOString(),
    endDate: new Date(now + 3 * DAY).toISOString(),
    ...overrides,
  }
}

/** Creates a tournament as `host` and returns the public view of it. */
export async function createTournament(host, overrides = {}) {
  const { body } = await host
    .post('/api/tournaments')
    .send(tournamentPayload(overrides))
    .expect(201)
  return body.tournament
}

/**
 * The total number of credits in existence: every user balance plus every
 * tournament bank.
 *
 * Credits only ever enter the system at the demo checkout and only ever leave it
 * when an account is deleted. Every other operation moves them, so this number
 * is the invariant the conservation tests assert on.
 */
export async function totalCredits() {
  const [users, banks] = await Promise.all([
    User.aggregate([{ $group: { _id: null, total: { $sum: '$credits' } } }]),
    Tournament.aggregate([{ $group: { _id: null, total: { $sum: '$bank' } } }]),
  ])
  return (users[0]?.total ?? 0) + (banks[0]?.total ?? 0)
}

/** A user's current balance, read straight from the database. */
export async function creditsOf(userId) {
  const user = await User.findById(userId).select('credits').lean()
  return user?.credits ?? 0
}
