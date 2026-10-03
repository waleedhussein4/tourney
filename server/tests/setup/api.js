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
 * `credits`, `isHost`, `role` and `emailVerified` are applied straight to the
 * document: how a user came by them is the subject of other tests, not a
 * precondition of every one. `emailVerified` defaults to `true` so existing
 * suites don't need to know about verification unless they are the ones
 * testing it.
 */
export async function signUp(
  name,
  { credits = 0, isHost = false, role, emailVerified = true } = {}
) {
  const agent = client()

  await agent
    .post('/api/auth/signup')
    .send({ email: `${name}@example.com`, username: name, password: PASSWORD })
    .expect(201)

  const update = { credits, isHost, emailVerified }
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
    entryFee: 0,
    prize: 0,
    ...(overrides.type === 'battle royale' ? { prizes: [{ rank: 1, prize: 0 }] } : {}),
    startDate: new Date(now + DAY).toISOString(),
    endDate: new Date(now + 3 * DAY).toISOString(),
    ...overrides,
  }
}

/**
 * Creates a tournament as `host` and returns the public view of it.
 *
 * Published by default, applied straight to the document: how a tournament gets
 * * published is the subject of `tournaments.guards`, not a precondition of every
 * other suite. Pass `{ published: false }` to get the draft the API really makes.
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

/**
 * Builds a full `{ id, winner }` result set that marches `championId` to the
 * title, mirroring the same round-1-from-the-draw, later-rounds-from-the-
 * previous-round's-winner propagation `updateMatches` does — so a match's
 * winner is always one of its own two competitors, never an arbitrary id.
 */
export function resultsFor(matches, order, championId) {
  const participantsByKey = new Map()
  for (const match of matches.filter((entry) => entry.round === 1)) {
    participantsByKey.set(`1-${match.slot}`, [order[match.slot * 2], order[match.slot * 2 + 1]])
  }

  const maxRound = Math.max(...matches.map((entry) => entry.round))
  const results = []

  for (const match of matches) {
    const participants = participantsByKey.get(`${match.round}-${match.slot}`) ?? [null, null]
    const winner = participants.includes(championId) ? championId : participants[0]
    results.push({ id: match.id, winner })

    if (match.round < maxRound) {
      const nextKey = `${match.round + 1}-${Math.floor(match.slot / 2)}`
      const next = participantsByKey.get(nextKey) ?? [null, null]
      next[match.slot % 2] = winner
      participantsByKey.set(nextKey, next)
    }
  }

  return results
}
