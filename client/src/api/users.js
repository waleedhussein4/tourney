import { get, post } from './client.js'

/** The signed-in user, or a 401 if there is no session. */
export const getCurrentUser = (options) => get('/api/users/me', options)

export const getMyTransactions = (limit = 50) =>
  get('/api/users/me/transactions', { query: { limit } })

export const becomeHost = () => post('/api/users/me/become-host')
