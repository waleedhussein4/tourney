import { beforeEach, describe, expect, it } from 'vitest'
import { useDatabase } from './setup/database.js'
import { createTeam, createTournament, guest, signUp } from './setup/api.js'
import Team from '../src/models/team.model.js'

useDatabase()

let ada
let bob
let cleo

beforeEach(async () => {
  ada = await signUp('ada')
  bob = await signUp('bob')
  cleo = await signUp('cleo')
})

describe('POST /api/teams', () => {
  it('creates a team with the caller as its leader and only member', async () => {
    const { body } = await ada.agent.post('/api/teams').send({ name: 'Night Owls' }).expect(201)

    expect(body.team).toMatchObject({ name: 'Night Owls', leader: 'ada', isLeader: true })
    expect(body.team.members).toHaveLength(1)
    expect(body.team.members[0]).toMatchObject({ username: 'ada', isLeader: true })
  })

  it('issues a six-character join code from an unambiguous alphabet', async () => {
    const { body } = await ada.agent.post('/api/teams').send({ name: 'Night Owls' }).expect(201)

    // No I, O, 0 or 1: a code gets read aloud and typed from a screenshot.
    expect(body.team.joinCode).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
  })

  it('gives every team a distinct join code', async () => {
    const codes = new Set()
    for (let index = 0; index < 12; index++) {
      const { body } = await ada.agent
        .post('/api/teams')
        .send({ name: `Team ${index}` })
        .expect(201)
      codes.add(body.team.joinCode)
    }
    expect(codes.size).toBe(12)
  })

  it('rejects a name shorter than three characters', async () => {
    await ada.agent.post('/api/teams').send({ name: 'ab' }).expect(400)
  })

  it('reports a taken name as a conflict', async () => {
    await ada.agent.post('/api/teams').send({ name: 'Night Owls' }).expect(201)
    await bob.agent.post('/api/teams').send({ name: 'Night Owls' }).expect(409)
  })

  it('requires a signed-in caller', async () => {
    await guest().post('/api/teams').send({ name: 'Night Owls' }).expect(401)
  })
})

describe('finding a team', () => {
  it('lets a non-member preview a team by its join code', async () => {
    const team = await createTeam(ada.agent, [], 'Night Owls')

    const { body } = await bob.agent.get(`/api/teams/code/${team.joinCode}`).expect(200)

    expect(body.team).toMatchObject({ name: 'Night Owls', isMember: false, memberCount: 1 })
    // A preview is a name and a size — not the roster.
    expect(body.team).not.toHaveProperty('members')
  })

  it('answers 404 for an unknown join code', async () => {
    await bob.agent.get('/api/teams/code/ZZZZZZ').expect(404)
  })

  it('keeps the full team detail to members', async () => {
    const team = await createTeam(ada.agent, [], 'Night Owls')

    await bob.agent.get(`/api/teams/${team.id}`).expect(403)
    await ada.agent.get(`/api/teams/${team.id}`).expect(200)
  })

  it('lists only the caller own teams', async () => {
    await createTeam(ada.agent, [], 'Night Owls')
    await createTeam(bob.agent, [], 'Day Larks')

    const mine = await ada.agent.get('/api/teams/mine').expect(200)
    expect(mine.body.teams.map((team) => team.name)).toEqual(['Night Owls'])
  })
})

describe('POST /api/teams/join/:code', () => {
  it('adds the caller to the roster', async () => {
    const team = await createTeam(ada.agent, [], 'Night Owls')

    const { body } = await bob.agent.post(`/api/teams/join/${team.joinCode}`).expect(200)

    expect(body.team.members.map((member) => member.username).sort()).toEqual(['ada', 'bob'])
  })

  // The original pushed the member again every time, so a double-clicked invite
  // link put the same person on the roster twice.
  it('is idempotent', async () => {
    const team = await createTeam(ada.agent, [], 'Night Owls')

    await bob.agent.post(`/api/teams/join/${team.joinCode}`).expect(200)
    await bob.agent.post(`/api/teams/join/${team.joinCode}`).expect(200)

    const roster = await Team.findById(team.id)
    expect(roster.members).toHaveLength(2)
  })

  // Membership used to be tested by comparing a populated member document to a
  // plain id string, which never matched — so every guard built on it was dead.
  it('recognises a member on a later request', async () => {
    const team = await createTeam(ada.agent, [bob.agent], 'Night Owls')

    const { body } = await bob.agent.get(`/api/teams/${team.id}`).expect(200)
    expect(body.isMember ?? body.team.isMember).toBe(true)
  })

  it('answers 404 for an unknown code', async () => {
    await bob.agent.post('/api/teams/join/ZZZZZZ').expect(404)
  })
})

describe('leader-only operations', () => {
  let team

  beforeEach(async () => {
    team = await createTeam(ada.agent, [bob.agent], 'Night Owls')
  })

  describe('kick', () => {
    it('lets the leader remove a member', async () => {
      const { body } = await ada.agent.delete(`/api/teams/${team.id}/members/bob`).expect(200)
      expect(body.team.members.map((member) => member.username)).toEqual(['ada'])
    })

    it('refuses a member who is not the leader', async () => {
      await bob.agent.delete(`/api/teams/${team.id}/members/ada`).expect(403)
      expect((await Team.findById(team.id)).members).toHaveLength(2)
    })

    it('refuses someone outside the team entirely', async () => {
      await cleo.agent.delete(`/api/teams/${team.id}/members/bob`).expect(403)
    })

    it('refuses to remove the leader, who must hand over first', async () => {
      await ada.agent.delete(`/api/teams/${team.id}/members/ada`).expect(400)
    })

    it('answers 404 for a user who does not exist', async () => {
      await ada.agent.delete(`/api/teams/${team.id}/members/nobody`).expect(404)
    })

    it('refuses to remove someone who is not on the team', async () => {
      await ada.agent.delete(`/api/teams/${team.id}/members/cleo`).expect(400)
    })
  })

  describe('transfer leadership', () => {
    it('lets the leader hand over to a member', async () => {
      const { body } = await ada.agent
        .patch(`/api/teams/${team.id}/leader`)
        .send({ username: 'bob' })
        .expect(200)

      expect(body.team.leader).toBe('bob')
    })

    it('refuses a non-leader', async () => {
      await bob.agent.patch(`/api/teams/${team.id}/leader`).send({ username: 'bob' }).expect(403)
      expect((await Team.findById(team.id)).leader).toBe(ada.user.id)
    })

    it('refuses to hand leadership to someone outside the team', async () => {
      await ada.agent.patch(`/api/teams/${team.id}/leader`).send({ username: 'cleo' }).expect(400)
    })
  })

  describe('leave', () => {
    it('lets a member leave', async () => {
      await bob.agent.post(`/api/teams/${team.id}/leave`).expect(204)
      expect((await Team.findById(team.id)).members).toHaveLength(1)
    })

    it('refuses the leader, so a team is never left headless', async () => {
      await ada.agent.post(`/api/teams/${team.id}/leave`).expect(400)
    })

    it('lets a former leader leave once they have handed over', async () => {
      await ada.agent.patch(`/api/teams/${team.id}/leader`).send({ username: 'bob' }).expect(200)
      await ada.agent.post(`/api/teams/${team.id}/leave`).expect(204)

      const roster = await Team.findById(team.id)
      expect(roster.members).toHaveLength(1)
      expect(roster.leader).toBe(bob.user.id)
    })

    it('refuses someone who is not on the team', async () => {
      await cleo.agent.post(`/api/teams/${team.id}/leave`).expect(403)
    })
  })

  describe('delete', () => {
    it('lets the leader delete the team', async () => {
      await ada.agent.delete(`/api/teams/${team.id}`).expect(204)
      expect(await Team.findById(team.id)).toBeNull()
    })

    it('refuses a non-leader', async () => {
      await bob.agent.delete(`/api/teams/${team.id}`).expect(403)
      expect(await Team.findById(team.id)).not.toBeNull()
    })
  })
})

// A tournament draws its bracket and funds its bank from the roster that entered
// it. Letting the leader empty that roster mid-tournament would leave prizes
// owed to people who are no longer on the team.
describe('roster changes while the team is competing', () => {
  let team
  let host

  beforeEach(async () => {
    host = await signUp('hostie', { credits: 1000, isHost: true })
    team = await createTeam(ada.agent, [bob.agent], 'Night Owls')

    const tournament = await createTournament(host.agent, {
      type: 'battle royale',
      teamSize: 2,
      maxCapacity: 2,
      entryFee: 0,
      prize: undefined,
      prizes: [{ rank: 1, prize: 0 }],
    })

    await ada.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: team.id })
      .expect(200)

    // A second team, so the tournament has enough participants to start.
    const dee = await signUp('dee')
    const eli = await signUp('eli')
    const rivals = await createTeam(dee.agent, [eli.agent], 'Rivals')
    await dee.agent
      .post(`/api/tournaments/${tournament.id}/join/team`)
      .send({ teamId: rivals.id })
      .expect(200)

    await host.agent.post(`/api/tournaments/${tournament.id}/start`).expect(200)
  })

  it('refuses a kick', async () => {
    await ada.agent.delete(`/api/teams/${team.id}/members/bob`).expect(409)
    expect((await Team.findById(team.id)).members).toHaveLength(2)
  })

  it('refuses a member leaving', async () => {
    await bob.agent.post(`/api/teams/${team.id}/leave`).expect(409)
    expect((await Team.findById(team.id)).members).toHaveLength(2)
  })

  it('refuses deleting the team', async () => {
    await ada.agent.delete(`/api/teams/${team.id}`).expect(409)
    expect(await Team.findById(team.id)).not.toBeNull()
  })

  it('allows roster changes again once the tournament has ended', async () => {
    const { body } = await host.agent.get('/api/tournaments/mine').expect(200)
    const tournamentId = body.tournaments[0].id

    await host.agent.post(`/api/tournaments/${tournamentId}/end`).expect(200)
    await ada.agent.delete(`/api/teams/${team.id}/members/bob`).expect(200)
  })
})

describe('the endpoints the rewrite deleted', () => {
  it.each([
    '/api/team/create',
    '/api/team/user',
    '/api/team/user/teamsList',
    '/api/team/view/code/ABCDEF',
  ])('%s is gone', async (path) => {
    const response = await guest().get(path)
    expect(response.status).toBe(404)
  })
})
