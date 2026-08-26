import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { authLimiter } from '../../middleware/rateLimits.js'
import { loginSchema, signupSchema } from './auth.schemas.js'
import { login, logout, signup } from './auth.controller.js'

export const authRouter = Router()

authRouter.post('/signup', authLimiter, validate({ body: signupSchema }), signup)
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), login)
authRouter.post('/logout', logout)
