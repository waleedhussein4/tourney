// Entry fees through the waitlist and withdrawal. Whatever a player pays in, they
// get back on leaving before the start, and no credit is created or lost.

import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, creditsOf, signUp, totalCredits } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'
import Transaction from '../src/models/transaction.model.js'

useDatabase()

const START = 100
let host
let players

beforeEach(async () => {
  host = await signUp('hostie', { credits: START, isHost: true })
  players = {}
  for (const name of ['mei', 'tomas', 'ada']) players[name] = await signUp(name, { credits: START })
})

const join = (name, id) => players[name].agent.post(`/api/tournaments/${id}/join/solo`)

describe('the waitlist and the entry fee', () => {
  it('charges nothing to wait, and charges the promoted player when a slot opens', async () => {
    const world = await totalCredits()
    const tournament = await createTournament(host.agent, { maxCapacity: 2, entryFee: 10 })

    await join('mei', tournament.id).expect(200)
    await join('tomas', tournament.id).expect(200)
    await join('ada', tournament.id).expect(200)
    expect(await creditsOf(players.ada.user.id)).toBe(START)

    await players.mei.agent.post(`/api/tournaments/${tournament.id}/withdraw`).expect(200)

    expect(await creditsOf(players.mei.user.id)).toBe(START)
    expect(await creditsOf(players.ada.user.id)).toBe(START - 10)
    expect((await Tournament.findById(tournament.id)).bank).toBe(20)
    expect(await totalCredits()).toBe(world)
    expect(await Transaction.countDocuments({ type: 'refund' })).toBe(1)
  })

  it('skips a waitlisted player who can no longer afford the fee', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 2, entryFee: 50 })
    await join('mei', tournament.id).expect(200)
    await join('ada', tournament.id).expect(200)
    await join('tomas', tournament.id).expect(200)

    const { default: User } = await import('../src/models/user.model.js')
    await User.updateOne({ _id: players.tomas.user.id }, { $set: { credits: 0 } })

    await players.mei.agent.post(`/api/tournaments/${tournament.id}/withdraw`).expect(200)

    const stored = await Tournament.findById(tournament.id)
    expect(stored.participantIds()).toEqual([players.ada.user.id])
    expect(stored.waitlist).toHaveLength(0)
    expect(stored.bank).toBe(50)
  })

  it('refunds the entry fee when the host removes a participant before the start', async () => {
    const world = await totalCredits()
    const tournament = await createTournament(host.agent, { maxCapacity: 4, entryFee: 10 })
    await join('mei', tournament.id).expect(200)

    await host.agent
      .delete(`/api/tournaments/${tournament.id}/participants/${players.mei.user.id}`)
      .send({ reason: 'Duplicate account' })
      .expect(200)

    expect(await creditsOf(players.mei.user.id)).toBe(START)
    expect((await Tournament.findById(tournament.id)).bank).toBe(0)
    expect(await totalCredits()).toBe(world)
  })
})
