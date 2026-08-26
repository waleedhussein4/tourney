import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { transactionQuerySchema } from './user.schemas.js'
import { becomeHost, getMe, getMyTransactions } from './user.controller.js'

export const userRouter = Router()

userRouter.use(requireAuth)

userRouter.get('/me', getMe)
userRouter.get('/me/transactions', validate({ query: transactionQuerySchema }), getMyTransactions)
userRouter.post('/me/become-host', becomeHost)
