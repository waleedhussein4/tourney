import { get, patch, post } from './client.js'

export const listNotifications = () => get('/api/notifications')

export const getUnreadCount = () => get('/api/notifications/unread-count')

export const markNotificationRead = (id) => post(`/api/notifications/${id}/read`)

export const markAllNotificationsRead = () => post('/api/notifications/read-all')

export const getEmailPreferences = () => get('/api/notifications/preferences')

export const updateEmailPreferences = (updates) => patch('/api/notifications/preferences', updates)

/** Public — no session required. Called from the unsubscribe landing page. */
export const unsubscribe = ({ userId, category, token }) =>
  post('/api/notifications/unsubscribe', { userId, category, token })
