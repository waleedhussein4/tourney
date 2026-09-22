import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, signUp } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'
import ModerationAction from '../src/models/moderationAction.model.js'
import User from '../src/models/user.model.js'

useDatabase()

let host
let stranger
let mei
let tomas

beforeEach(async () => {
  host = await signUp('hostie', { isHost: true, plan: true })
  stranger = await signUp('mallory', { isHost: true, plan: true })
  mei = await signUp('mei')
  tomas = await signUp('tomas')
})

describe('removing a participant', () => {
  it('frees the slot before the tournament starts', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    await host.agent
      .delete(`/api/tournaments/${tournament.id}/participants/${mei.user.id}`)
      .send({ reason: 'harassing other players in chat' })
      .expect(200)

    const doc = await Tournament.findById(tournament.id)
    expect(doc.enrolledUsers).toHaveLength(0)
  })

  it('writes an audit record with who, what, when, and why', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    await host.agent
      .delete(`/api/tournaments/${tournament.id}/participants/${mei.user.id}`)
      .send({ reason: 'harassing other players in chat' })
      .expect(200)

    const [record] = await ModerationAction.find({
      action: 'participant_removed',
      targetId: tournament.id,
    }).lean()
    expect(record).toBeTruthy()
    expect(record.actor).toBe(host.user.id)
    expect(record.reason).toBe('harassing other players in chat')
    expect(record.createdAt).toBeTruthy()
  })

  it('notifies the removed participant', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    await host.agent
      .delete(`/api/tournaments/${tournament.id}/participants/${mei.user.id}`)
      .send({ reason: 'harassing other players in chat' })
      .expect(200)

    const { body } = await mei.agent.get('/api/notifications').expect(200)
    expect(body.notifications.some((n) => n.type === 'participant_removed')).toBe(true)
  })

  it('forfeits remaining matches instead of corrupting the bracket once it has started', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })
    const ada = await signUp('ada')
    const kofi = await signUp('kofi')
    for (const player of [mei, tomas, ada, kofi]) {
      await player.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    const before = await Tournament.findById(tournament.id)
    const round1 = before.matches.filter((match) => match.round === 1)
    expect(round1).toHaveLength(2)
    const meiMatch = round1.find((match) => match.participants.includes(mei.user.id))
    const opponent = meiMatch.participants.find((id) => id !== mei.user.id)

    await host.agent
      .delete(`/api/tournaments/${tournament.id}/participants/${mei.user.id}`)
      .send({ reason: 'no-show, repeated warnings' })
      .expect(200)

    const after = await Tournament.findById(tournament.id)
    // History is preserved — the match still exists and still names both
    // original competitors — but the removed player forfeits it.
    const forfeited = after.matches.find((match) => match.id === meiMatch.id)
    expect(forfeited.participants).toContain(mei.user.id)
    expect(forfeited.state).toBe('final')
    expect(forfeited.winner).toBe(opponent)

    const meiEntry = after.enrolledUsers.find((entry) => String(entry.userId) === mei.user.id)
    expect(meiEntry).toBeTruthy()
    expect(meiEntry.eliminated).toBe(true)
  })

  it('is 403 for someone who does not host this tournament', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    await stranger.agent
      .delete(`/api/tournaments/${tournament.id}/participants/${mei.user.id}`)
      .send({ reason: 'nope' })
      .expect(403)
  })

  it('requires a reason', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    await host.agent
      .delete(`/api/tournaments/${tournament.id}/participants/${mei.user.id}`)
      .send({ reason: '' })
      .expect(400)
  })
})

describe('a suspended account', () => {
  it('cannot sign in, and is told it is suspended rather than given a wrong-password message', async () => {
    await User.updateOne(
      { _id: mei.user.id },
      { $set: { suspended: true, suspendedReason: 'abuse reports' } }
    )

    const { body } = await tomas.agent
      .post('/api/auth/login')
      .send({ email: 'mei@example.com', password: 'Passw0rdy' })
      .expect(403)

    expect(body.error.code).toBe('ACCOUNT_SUSPENDED')
    expect(body.error.message.toLowerCase()).toContain('suspended')
  })

  it('cannot host or join once already signed in', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })
    await User.updateOne({ _id: mei.user.id }, { $set: { suspended: true } })

    const { body } = await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(403)
    expect(body.error.code).toBe('ACCOUNT_SUSPENDED')

    await mei.agent.post('/api/users/me/become-host').expect(403)
  })
})
