import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import * as schemas from './notification.schemas.js'
import * as controller from './notification.controller.js'

export const notificationRouter = Router()

// Public: reached by clicking the unsubscribe link in an email, signed out.
notificationRouter.post(
  '/unsubscribe',
  validate({ body: schemas.unsubscribeSchema }),
  controller.unsubscribe
)

notificationRouter.use(requireAuth)

notificationRouter.get('/', validate({ query: schemas.listQuerySchema }), controller.list)
notificationRouter.get('/unread-count', controller.getUnreadCount)
notificationRouter.post('/read-all', controller.markAllRead)
notificationRouter.get('/preferences', controller.getPreferences)
notificationRouter.patch(
  '/preferences',
  validate({ body: schemas.updatePreferencesSchema }),
  controller.updatePreferences
)
notificationRouter.post(
  '/:notificationId/read',
  validate({ params: schemas.notificationIdParams }),
  controller.markRead
)
