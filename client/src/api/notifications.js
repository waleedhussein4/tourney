import { get, post } from './client.js'

export const listNotifications = () => get('/api/notifications')

export const getUnreadCount = () => get('/api/notifications/unread-count')

export const markNotificationRead = (id) => post(`/api/notifications/${id}/read`)

export const markAllNotificationsRead = () => post('/api/notifications/read-all')
