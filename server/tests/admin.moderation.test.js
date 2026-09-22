import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, signUp } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'
import User from '../src/models/user.model.js'
import ModerationAction from '../src/models/moderationAction.model.js'

useDatabase()

let admin
let host
let mei

beforeEach(async () => {
  admin = await signUp('rootadmin', { role: 'admin' })
  host = await signUp('hostie', { isHost: true, plan: true })
  mei = await signUp('mei')
})

const ADMIN_ROUTES = [
  ['post', () => `/api/admin/users/${mei.user.id}/suspend`, { reason: 'x' }],
  ['post', () => `/api/admin/users/${mei.user.id}/unsuspend`, { reason: 'x' }],
  ['get', () => '/api/admin/reports', undefined],
]

describe('admin routes are genuinely admin-only', () => {
  it.each(ADMIN_ROUTES)('%s %s is 403 for a signed-in non-admin', async (method, path, body) => {
    const response = await host.agent[method](path()).send(body)
    expect(response.status).toBe(403)
  })

  it('is 401 for a guest', async () => {
    const { guest } = await import('./setup/api.js')
    await guest().get('/api/admin/reports').expect(401)
  })
})

describe('suspending an account', () => {
  it('sets suspended and records the moderation action', async () => {
    await admin.agent
      .post(`/api/admin/users/${mei.user.id}/suspend`)
      .send({ reason: 'repeated harassment reports' })
      .expect(200)

    const user = await User.findById(mei.user.id)
    expect(user.suspended).toBe(true)
    expect(user.suspendedReason).toBe('repeated harassment reports')

    const [record] = await ModerationAction.find({
      action: 'user_suspended',
      targetId: mei.user.id,
    }).lean()
    expect(record.actor).toBe(admin.user.id)
    expect(record.reason).toBe('repeated harassment reports')
  })

  it('can be lifted', async () => {
    await admin.agent
      .post(`/api/admin/users/${mei.user.id}/suspend`)
      .send({ reason: 'x' })
      .expect(200)
    await admin.agent
      .post(`/api/admin/users/${mei.user.id}/unsuspend`)
      .send({ reason: 'appeal accepted' })
      .expect(200)

    const user = await User.findById(mei.user.id)
    expect(user.suspended).toBe(false)
  })
})

describe('admin tournament takedown', () => {
  it('unpublishes any tournament, not just ones the admin hosts', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })

    await admin.agent
      .post(`/api/admin/tournaments/${tournament.id}/unpublish`)
      .send({ reason: 'reported repeatedly' })
      .expect(200)

    const doc = await Tournament.findById(tournament.id)
    expect(doc.publishState).toBe('draft')
  })

  it('deletes any tournament and records why', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })

    await admin.agent
      .delete(`/api/admin/tournaments/${tournament.id}`)
      .send({ reason: 'violates the rules' })
      .expect(200)

    expect(await Tournament.findById(tournament.id)).toBeNull()

    const [record] = await ModerationAction.find({
      action: 'tournament_deleted',
      targetId: tournament.id,
    }).lean()
    expect(record.reason).toBe('violates the rules')
  })
})
