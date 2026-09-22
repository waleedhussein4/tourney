import { del, get, post } from './client.js'

export const seedDemoData = () => post('/api/admin/seed')

export const clearDemoData = () => del('/api/admin/seed')

// --- moderation ---------------------------------------------------------------

export const listReports = () => get('/api/admin/reports')

export const suspendUser = (userId, reason) =>
  post(`/api/admin/users/${userId}/suspend`, { reason })

export const unsuspendUser = (userId, reason) =>
  post(`/api/admin/users/${userId}/unsuspend`, { reason })

export const unpublishAnyTournament = (tournamentId, reason) =>
  post(`/api/admin/tournaments/${tournamentId}/unpublish`, { reason })

export const deleteAnyTournament = (tournamentId, reason) =>
  del(`/api/admin/tournaments/${tournamentId}`, { body: { reason } })
