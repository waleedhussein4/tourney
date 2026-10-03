import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTournament, guest, signUp } from './setup/api.js'

useDatabase()

let host

beforeEach(async () => {
  host = await signUp('hostie', { isHost: true })
})

describe('publishing', () => {
  it('is free and instant, and hides the tournament again on unpublish', async () => {
    const draft = await createTournament(host.agent, {}, { published: false })
    await guest().get(`/api/tournaments/${draft.id}`).expect(404)

    const published = await host.agent.post(`/api/tournaments/${draft.id}/publish`).expect(200)
    expect(published.body.tournament.publishState).toBe('published')
    await guest().get(`/api/tournaments/${draft.id}`).expect(200)

    await host.agent.post(`/api/tournaments/${draft.id}/publish`).expect(409)

    const hidden = await host.agent.post(`/api/tournaments/${draft.id}/unpublish`).expect(200)
    expect(hidden.body.tournament.publishState).toBe('draft')
    await guest().get(`/api/tournaments/${draft.id}`).expect(404)
  })

  it('is refused to anyone but the host', async () => {
    const draft = await createTournament(host.agent, {}, { published: false })
    const other = await signUp('other', { isHost: true })
    await other.agent.post(`/api/tournaments/${draft.id}/publish`).expect(403)
  })
})
