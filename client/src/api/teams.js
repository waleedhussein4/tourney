import { del, get, patch, post } from './client.js'

export const listMyTeams = () => get('/api/teams/mine')

export const getTeam = (teamId) => get(`/api/teams/${teamId}`)

/** What a non-member can see before joining: a name and a size. */
export const previewTeamByCode = (code) => get(`/api/teams/code/${code}`)

export const createTeam = (name) => post('/api/teams', { name })

export const joinTeamByCode = (code) => post(`/api/teams/join/${code}`)

export const transferLeadership = (teamId, username) =>
  patch(`/api/teams/${teamId}/leader`, { username })

export const kickMember = (teamId, username) =>
  del(`/api/teams/${teamId}/members/${encodeURIComponent(username)}`)

export const leaveTeam = (teamId) => post(`/api/teams/${teamId}/leave`)

export const deleteTeam = (teamId) => del(`/api/teams/${teamId}`)
