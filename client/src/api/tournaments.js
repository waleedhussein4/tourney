import { del, get, patch, post } from './client.js'

// --- reading ------------------------------------------------------------------

/**
 * The browse list.
 *
 * @param {{page?: number, limit?: number, search?: string, category?: string,
 *          type?: string, accessibility?: string, status?: string}} params
 */
export const listTournaments = (params, options) =>
  get('/api/tournaments', { ...options, query: params })

export const getTournament = (id, options) => get(`/api/tournaments/${id}`, options)

/** The host's view: everything public, plus the applications queue and standings. */
export const getManageView = (id) => get(`/api/tournaments/${id}/manage`)

export const listTrending = (limit = 8) => get('/api/tournaments/trending', { query: { limit } })

export const listCategories = () => get('/api/tournaments/categories')

/** Everything the caller hosts or competes in. */
export const listMyTournaments = () => get('/api/tournaments/mine')

// --- writing ------------------------------------------------------------------

export const createTournament = (payload) => post('/api/tournaments', payload)

export const updateTournament = (id, changes) => patch(`/api/tournaments/${id}`, changes)

export const cancelTournament = (id) => del(`/api/tournaments/${id}`)

export const postUpdate = (id, content) => post(`/api/tournaments/${id}/updates`, { content })

// --- publishing ---------------------------------------------------------------

/** 402 with `error.code === 'PLAN_LIMIT_REACHED'` when the free plan is full. */
export const publishTournament = (id) => post(`/api/tournaments/${id}/publish`)

/** Takes it back to a draft only the host can see. */
export const unpublishTournament = (id) => post(`/api/tournaments/${id}/unpublish`)

// --- entering -----------------------------------------------------------------

export const joinSolo = (id) => post(`/api/tournaments/${id}/join/solo`)

export const joinAsTeam = (id, teamId) => post(`/api/tournaments/${id}/join/team`, { teamId })

/**
 * @param {string} id
 * @param {{teamId?: string, fields: {label: string, input: string}[]}} application
 */
export const applyToTournament = (id, application) =>
  post(`/api/tournaments/${id}/applications`, application)

export const acceptApplication = (id, applicationId) =>
  post(`/api/tournaments/${id}/applications/${applicationId}/accept`)

export const rejectApplication = (id, applicationId) =>
  post(`/api/tournaments/${id}/applications/${applicationId}/reject`)

// --- running it ---------------------------------------------------------------

export const shuffleBracket = (id) => post(`/api/tournaments/${id}/shuffle`)

export const startTournament = (id) => post(`/api/tournaments/${id}/start`)

export const endTournament = (id) => post(`/api/tournaments/${id}/end`)

/** `[{ id, winner }]` — the winner of each match, by match id; `winner: null` clears it. */
export const saveMatches = (id, matches) => patch(`/api/tournaments/${id}/matches`, { matches })

/**
 * Sets when matches are played, by match id — one call for a single match or
 * a whole round. `scheduledAt` values are UTC ISO strings.
 * @param {{ id: string, scheduledAt: string }[]} matches
 */
export const scheduleMatches = (id, matches) =>
  patch(`/api/tournaments/${id}/matches/schedule`, { matches })

/** Score and elimination edits, by participant id. */
export const saveParticipants = (id, participants) =>
  patch(`/api/tournaments/${id}/participants`, { participants })

/**
 * A competitor (or the host, standing in) reports a match's result.
 * @param {{ scores: { participantId: string, score: number }[] }} body
 */
export const reportMatch = (id, matchId, body) =>
  post(`/api/tournaments/${id}/matches/${matchId}/report`, body)

/** The other competitor confirms (`agree: true`) or disputes (`agree: false`) a reported result. */
export const confirmMatch = (id, matchId, agree) =>
  post(`/api/tournaments/${id}/matches/${matchId}/confirm`, { agree })

// --- query keys ---------------------------------------------------------------

/**
 * One place the cache keys are spelled, so an invalidation after a mutation
 * cannot miss the query it was meant to refresh.
 */
export const tournamentKeys = {
  all: ['tournaments'],
  list: (params) => ['tournaments', 'list', params],
  detail: (id) => ['tournaments', 'detail', id],
  manage: (id) => ['tournaments', 'manage', id],
  trending: ['tournaments', 'trending'],
  categories: ['tournaments', 'categories'],
  mine: ['tournaments', 'mine'],
}
