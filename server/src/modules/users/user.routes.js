import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { becomeHost, getDashboard, getMe } from './user.controller.js'

export const userRouter = Router()

userRouter.use(requireAuth)

userRouter.get('/me', getMe)
userRouter.get('/me/dashboard', getDashboard)
userRouter.post('/me/become-host', becomeHost)
