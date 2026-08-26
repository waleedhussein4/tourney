import { asyncHandler } from '../../utils/asyncHandler.js'
import { clearAuthCookie, setAuthCookie, signAuthToken } from '../../middleware/auth.js'
import { authenticateUser, registerUser } from './auth.service.js'

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
