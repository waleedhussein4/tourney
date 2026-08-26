import { asyncHandler } from '../../utils/asyncHandler.js'
import * as userService from './user.service.js'

/**
 * The one endpoint the client needs to know who it is talking to. It replaces
 * the original `loggedin` / `isHost` / `isAdmin` trio, each of which answered a
 * bare `true`/`false` that a 401 body could impersonate.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.userId)
  res.json({ user: user.toPublicJSON() })
})

export const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await userService.listTransactions(req.userId, req.query)
  res.json({ transactions })
})

export const becomeHost = asyncHandler(async (req, res) => {
  const user = await userService.becomeHost(req.userId)
  res.json({ user: user.toPublicJSON() })
})
