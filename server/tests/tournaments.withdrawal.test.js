import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, signUp } from './setup/api.js'
import Tournament from '../src/models/tournament.model.js'

useDatabase()

let host
let mei
let tomas
let ada
let kofi

beforeEach(async () => {
  host = await signUp('hostie', { isHost: true, plan: true })
  mei = await signUp('mei')
  tomas = await signUp('tomas')
  ada = await signUp('ada')
  kofi = await signUp('kofi')
})

describe('withdrawing before a tournament starts', () => {
  it('frees the slot', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    const response = await mei.agent.post(`/api/tournaments/${tournament.id}/withdraw`).expect(200)

    expect(response.body.tournament.viewer.isJoined).toBe(false)
    expect(response.body.tournament.participants).toHaveLength(0)

    const stored = await Tournament.findById(tournament.id)
    expect(stored.enrolledUsers).toHaveLength(0)
  })

  it('promotes the longest-waiting waitlist entry, in order', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 2 })

    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    // Both waitlisted, ada first.
    await ada.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    await kofi.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    await mei.agent.post(`/api/tournaments/${tournament.id}/withdraw`).expect(200)

    const afterFirst = await Tournament.findById(tournament.id)
    expect(afterFirst.participantIds()).toContain(ada.user.id)
    expect(afterFirst.waitlist.map((entry) => entry.userId)).toEqual([kofi.user.id])

    const adaView = await ada.agent.get(`/api/tournaments/${tournament.id}`).expect(200)
    expect(adaView.body.tournament.viewer.isJoined).toBe(true)
    expect(adaView.body.tournament.viewer.isWaitlisted).toBe(false)
  })

  it('refuses to withdraw someone who was never in the tournament', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })

    await mei.agent.post(`/api/tournaments/${tournament.id}/withdraw`).expect(400)
  })
})

describe('withdrawing after a tournament starts', () => {
  it('forfeits the remaining match, advances the opponent, and keeps final matches intact', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 4 })
    for (const player of [mei, tomas, ada, kofi]) {
      await player.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)
    }
    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)

    let tournamentDoc = await Tournament.findById(tournament.id)
    const [matchA, matchB] = tournamentDoc.matches.filter((match) => match.round === 1)

    // Finalize matchA the normal way — this is the record that must not move.
    await host.agent
      .patch(`/api/tournaments/${tournament.id}/matches`)
      .send({
        matches: tournamentDoc.matches.map((match) => ({
          id: match.id,
          winner: match.id === matchA.id ? matchA.participants[0] : match.winner,
        })),
      })
      .expect(200)

    // Whoever is still in matchB withdraws — their opponent forfeits them in.
    const [p1, p2] = matchB.participants
    const withdrawing = [mei, tomas, ada, kofi].find(
      (player) => String(player.user.id) === String(p1)
    )

    await withdrawing.agent.post(`/api/tournaments/${tournament.id}/withdraw`).expect(200)

    tournamentDoc = await Tournament.findById(tournament.id)
    const finishedA = tournamentDoc.matches.id(matchA.id)
    const finishedB = tournamentDoc.matches.id(matchB.id)
    const final = tournamentDoc.matches.find((match) => match.round === 2)

    // matchA's record is untouched by the other match's withdrawal.
    expect(finishedA.winner).toBe(matchA.participants[0])
    expect(finishedA.state).toBe('final')

    // matchB is forfeited to the opponent, not deleted or left dangling.
    expect(finishedB.state).toBe('final')
    expect(finishedB.winner).toBe(String(p2))
    expect(finishedB.participants).toEqual([String(p1), String(p2)])

    // The forfeit winner advanced into the final.
    expect(final.participants).toContain(String(p2))

    const withdrawnEntry = tournamentDoc.enrolledUsers.find(
      (entry) => String(entry.userId) === String(p1)
    )
    expect(withdrawnEntry.withdrawn).toBe(true)
    expect(withdrawnEntry.eliminated).toBe(true)
  })
})

describe('concurrent joins for the last slot', () => {
  it('lets exactly one of two overlapping requests take it, waitlisting the other', async () => {
    const tournament = await createTournament(host.agent, { maxCapacity: 2 })
    await mei.agent.post(`/api/tournaments/${tournament.id}/join/solo`).expect(200)

    // Two more entrants race for the single remaining slot, fired together so
    // their transactions genuinely overlap rather than running one after another.
    const [tomasResult, adaResult] = await Promise.all([
      tomas.agent.post(`/api/tournaments/${tournament.id}/join/solo`),
      ada.agent.post(`/api/tournaments/${tournament.id}/join/solo`),
    ])

    expect(tomasResult.status).toBe(200)
    expect(adaResult.status).toBe(200)

    const joined = [tomasResult, adaResult].filter(
      (response) => response.body.tournament.viewer.isJoined
    )
    const waitlisted = [tomasResult, adaResult].filter(
      (response) => response.body.tournament.viewer.isWaitlisted
    )

    expect(joined).toHaveLength(1)
    expect(waitlisted).toHaveLength(1)

    const stored = await Tournament.findById(tournament.id)
    expect(stored.enrolledUsers).toHaveLength(2)
    expect(stored.waitlist).toHaveLength(1)
  })
})
