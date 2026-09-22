import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { reportLimiter } from '../../middleware/rateLimits.js'
import { becomeHost, getDashboard, getHostDashboard, getMe, reportUser } from './user.controller.js'
import { reportUserSchema, userIdParams } from './user.schemas.js'

export const userRouter = Router()

userRouter.use(requireAuth)

userRouter.get('/me', getMe)
userRouter.get('/me/dashboard', getDashboard)
userRouter.get('/me/host-dashboard', getHostDashboard)
userRouter.post('/me/become-host', becomeHost)

userRouter.post(
  '/:userId/report',
  reportLimiter,
  validate({ params: userIdParams, body: reportUserSchema }),
  reportUser
)
