import { get, post } from './client.js'

/** The signed-in user, or a 401 if there is no session. */
export const getCurrentUser = (options) => get('/api/users/me', options)

export const becomeHost = () => post('/api/users/me/become-host')

/** What's next for the signed-in player: their next match, results awaiting
 * their confirmation, and tournaments they've applied to. */
export const getDashboard = (options) => get('/api/users/me/dashboard', options)

/** Flags a user for the admin queue. */
export const reportUser = (userId, reason) => post(`/api/users/${userId}/report`, { reason })
