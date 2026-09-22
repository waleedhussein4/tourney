import { asyncHandler } from '../../utils/asyncHandler.js'
import * as notificationService from './notification.service.js'

export const list = asyncHandler(async (req, res) => {
  const result = await notificationService.listForUser(req.userId, req.query)
  res.json(result)
})

export const getUnreadCount = asyncHandler(async (req, res) => {
  res.json({ count: await notificationService.unreadCount(req.userId) })
})

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.userId, req.params.notificationId)
  res.json({ notification })
})

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.userId)
  res.json({ ok: true })
})

export const getPreferences = asyncHandler(async (req, res) => {
  res.json({ preferences: await notificationService.getEmailPreferences(req.userId) })
})

export const updatePreferences = asyncHandler(async (req, res) => {
  res.json({ preferences: await notificationService.updateEmailPreferences(req.userId, req.body) })
})

/** Public — reached from a link in an email, signed out. */
export const unsubscribe = asyncHandler(async (req, res) => {
  const { userId, category, token } = req.body
  const preferences = await notificationService.unsubscribeByToken(userId, category, token)
  res.json({ category, preferences })
})
