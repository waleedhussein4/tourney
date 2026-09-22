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

export const becomeHost = asyncHandler(async (req, res) => {
  const user = await userService.becomeHost(req.userId)
  res.json({ user: user.toPublicJSON() })
})

/** What's next for this player: their next match, results awaiting their
 * confirmation, and tournaments they've applied to. */
export const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await userService.getDashboard(req.userId)
  res.json(dashboard)
})
