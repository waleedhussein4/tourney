import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { authLimiter } from '../../middleware/rateLimits.js'
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from './auth.schemas.js'
import { forgotPassword, login, logout, resetPasswordHandler, signup } from './auth.controller.js'

export const authRouter = Router()

authRouter.post('/signup', authLimiter, validate({ body: signupSchema }), signup)
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), login)
authRouter.post('/logout', logout)
authRouter.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPassword
)
authRouter.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  resetPasswordHandler
)
