// A thin client for the rewritten tournament API.
//
// The pages that call it are still the original ones and speak in usernames,
// team names, and the old field names; the API speaks in ids and the new ones.
// Translating in one module keeps that seam in a single file, to be deleted
// along with the pages when the client is rewritten.

const json = { 'Content-Type': 'application/json' }

async function request(path, options = {}) {
  const response = await fetch(path, { credentials: 'include', ...options })
  const body = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(body?.error?.message ?? 'Something went wrong')
    error.status = response.status
    error.details = body?.error?.details
    throw error
  }
  return body
}

/** Turns the API's participant list back into the two arrays the pages read. */
function toLegacyShape(view) {
  const isTeamBased = view.teamSize > 1
  const nameById = new Map(view.participants.map((p) => [p.id, p.name]))

  const enrolledUsers = isTeamBased
    ? []
    : view.participants.map((p) => ({
        UUID: p.id,
        username: p.name,
        score: p.score,
        eliminated: p.eliminated,
      }))

  const enrolledTeams = isTeamBased
    ? view.participants.map((p) => ({
        UUID: p.id,
        teamName: p.name,
        score: p.score,
        eliminated: p.eliminated,
        players: (p.members ?? []).map((m) => ({
          UUID: m.id,
          username: m.name,
          score: m.score,
          eliminated: m.eliminated,
        })),
      }))
    : []

  return {
    ...view,
    UUID: view.id,
    // The old pages branch on `earnings` being a number or a rank table.
    earnings: view.type === 'brackets' ? view.prize : view.prizes,
    application: view.applicationForm,
    enrolledUsers,
    enrolledTeams,
    // Stored as participant ids; rendered as the names the bracket shows.
    matches: (view.matches ?? []).map((id) => (id ? (nameById.get(id) ?? null) : null)),
    isHost: view.viewer.isHost,
    isJoined: view.viewer.isJoined,
    hasApplied: view.viewer.hasApplied,
    isAccepted: view.viewer.isAccepted,
    applications: (view.applications ?? []).map((application) => ({
      UUID: application.id,
      ...(application.isTeam ? { teamName: application.name } : { username: application.name }),
      application: application.fields,
    })),
    // Kept so writes can translate names back into ids.
    _participants: view.participants,
    _nameToId: new Map(view.participants.map((p) => [p.name, p.id])),
  }
}

export const getTournament = (id) =>
  request(`/api/tournaments/${id}`).then((data) => toLegacyShape(data.tournament))

export const getManagedTournament = (id) =>
  request(`/api/tournaments/${id}/manage`).then((data) => toLegacyShape(data.tournament))

export const listTournaments = (params) =>
  request(`/api/tournaments?${new URLSearchParams(params)}`)

export const getTrending = () =>
  request('/api/tournaments/trending').then((data) => data.tournaments)

export const getMyTournaments = () =>
  request('/api/tournaments/mine').then((data) => data.tournaments)

export const getCategories = () =>
  request('/api/tournaments/categories').then((data) => data.categories)

export const createTournament = (payload) =>
  request('/api/tournaments', { method: 'POST', headers: json, body: JSON.stringify(payload) })

export const patchTournament = (id, patch) =>
  request(`/api/tournaments/${id}`, {
    method: 'PATCH',
    headers: json,
    body: JSON.stringify(patch),
  })

export const postUpdate = (id, content) =>
  request(`/api/tournaments/${id}/updates`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ content }),
  })

export const joinSolo = (id) => request(`/api/tournaments/${id}/join/solo`, { method: 'POST' })

export const joinAsTeam = (id, teamId) =>
  request(`/api/tournaments/${id}/join/team`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ teamId }),
  })

export const apply = (id, { teamId, fields }) =>
  request(`/api/tournaments/${id}/applications`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ teamId, fields }),
  })

export const acceptApplication = (id, applicationId) =>
  request(`/api/tournaments/${id}/applications/${applicationId}/accept`, { method: 'POST' })

export const rejectApplication = (id, applicationId) =>
  request(`/api/tournaments/${id}/applications/${applicationId}/reject`, { method: 'POST' })

export const deposit = (id, amount) =>
  request(`/api/tournaments/${id}/bank/deposit`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ amount }),
  })

export const shuffleBrackets = (id) => request(`/api/tournaments/${id}/shuffle`, { method: 'POST' })

export const startTournament = (id) => request(`/api/tournaments/${id}/start`, { method: 'POST' })

export const endTournament = (id) => request(`/api/tournaments/${id}/end`, { method: 'POST' })

/** Match winners are edited by name on screen and stored by id. */
export const saveMatches = (id, winnerNames, tournament) =>
  request(`/api/tournaments/${id}/matches`, {
    method: 'PATCH',
    headers: json,
    body: JSON.stringify({
      matches: winnerNames.map((name) => (name ? (tournament._nameToId.get(name) ?? null) : null)),
    }),
  })

/** Solo score / elimination edits, keyed by username on screen. */
export const saveSoloParticipants = (id, participants, tournament) =>
  request(`/api/tournaments/${id}/participants`, {
    method: 'PATCH',
    headers: json,
    body: JSON.stringify({
      participants: participants
        .map((participant) => ({
          id: tournament._nameToId.get(participant.username),
          score: Number(participant.score) || 0,
          eliminated: Boolean(participant.eliminated),
        }))
        .filter((participant) => participant.id),
    }),
  })

/** Team score / elimination edits, keyed by team name and username on screen. */
export const saveTeamParticipants = (id, teams, tournament) =>
  request(`/api/tournaments/${id}/participants`, {
    method: 'PATCH',
    headers: json,
    body: JSON.stringify({
      participants: teams
        .map((team) => {
          const source = tournament._participants.find((p) => p.name === team.teamName)
          if (!source) return null
          const memberIdByName = new Map((source.members ?? []).map((m) => [m.name, m.id]))
          return {
            id: source.id,
            score: Number(team.score) || 0,
            eliminated: Boolean(team.eliminated),
            members: (team.players ?? [])
              .map((player) => ({
                id: memberIdByName.get(player.username),
                score: Number(player.score) || 0,
                eliminated: Boolean(player.eliminated),
              }))
              .filter((member) => member.id),
          }
        })
        .filter(Boolean),
    }),
  })
