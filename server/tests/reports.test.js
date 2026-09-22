import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, signUp } from './setup/api.js'
import Report from '../src/models/report.model.js'

useDatabase()

let host
let mei

beforeEach(async () => {
  host = await signUp('hostie', { isHost: true, plan: true })
  mei = await signUp('mei')
})

describe('reporting', () => {
  it('files a report against a tournament, landing in the admin queue', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })

    await mei.agent
      .post(`/api/tournaments/${tournament.id}/report`)
      .send({ reason: 'this listing is fraudulent' })
      .expect(201)

    const [report] = await Report.find({ targetType: 'tournament', targetId: tournament.id }).lean()
    expect(report.reporter).toBe(mei.user.id)
    expect(report.reason).toBe('this listing is fraudulent')
    expect(report.createdAt).toBeTruthy()
  })

  it('files a report against a user', async () => {
    await mei.agent
      .post(`/api/users/${host.user.id}/report`)
      .send({ reason: 'abusive messages' })
      .expect(201)

    const [report] = await Report.find({ targetType: 'user', targetId: host.user.id }).lean()
    expect(report.reporter).toBe(mei.user.id)
  })

  it('404s reporting a made-up id', async () => {
    await mei.agent
      .post('/api/users/00000000-0000-4000-8000-000000000000/report')
      .send({ reason: 'x' })
      .expect(404)
  })

  it('requires a reason', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })
    await mei.agent
      .post(`/api/tournaments/${tournament.id}/report`)
      .send({ reason: '' })
      .expect(400)
  })
})
