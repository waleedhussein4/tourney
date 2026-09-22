import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import * as schemas from './notification.schemas.js'
import * as controller from './notification.controller.js'

export const notificationRouter = Router()

notificationRouter.use(requireAuth)

notificationRouter.get('/', validate({ query: schemas.listQuerySchema }), controller.list)
notificationRouter.get('/unread-count', controller.getUnreadCount)
notificationRouter.post('/read-all', controller.markAllRead)
notificationRouter.post(
  '/:notificationId/read',
  validate({ params: schemas.notificationIdParams }),
  controller.markRead
)
