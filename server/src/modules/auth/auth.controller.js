import config from '../../config/env.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { clearAuthCookie, setAuthCookie, signAuthToken } from '../../middleware/auth.js'
import {
  authenticateUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from './auth.service.js'

export const signup = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body)
  setAuthCookie(res, signAuthToken(user._id))
  res.status(201).json({ user: user.toPublicJSON() })
})

export const login = asyncHandler(async (req, res) => {
  const { rememberMe } = req.body
  const user = await authenticateUser(req.body)
  setAuthCookie(res, signAuthToken(user._id, { remember: rememberMe }), { remember: rememberMe })
  res.json({ user: user.toPublicJSON() })
})

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res)
  res.status(204).end()
})

export const forgotPassword = asyncHandler(async (req, res) => {
  // CLIENT_URL when it is set (production, behind one origin); otherwise the
  // origin the request itself arrived on, which is the Vite dev origin locally.
  const resetUrlBase = config.clientUrl ?? `${req.protocol}://${req.get('host')}`
  await requestPasswordReset({ email: req.body.email, resetUrlBase })
  // Same response whether or not the account exists — see requestPasswordReset.
  res.json({ message: 'If that email is registered, a reset link is on its way.' })
})

export const resetPasswordHandler = asyncHandler(async (req, res) => {
  await resetPassword(req.body)
  res.json({ message: 'Your password has been reset.' })
})
