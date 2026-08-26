import jwt from 'jsonwebtoken'
import config from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import User from '../models/user.model.js'

export const AUTH_COOKIE = 'token'

const DAY = 24 * 60 * 60

/** Token lifetimes, in seconds. "Remember me" is the only reason they differ. */
export const TOKEN_TTL = { default: DAY, remembered: 30 * DAY }

/** Signs an auth token for a user id. */
export function signAuthToken(userId, { remember = false } = {}) {
  const expiresIn = remember ? TOKEN_TTL.remembered : TOKEN_TTL.default
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn })
}

/**
 * Writes the auth cookie. The one place a `Set-Cookie` header is produced, so
 * there is no way to emit two contradictory ones for the same response.
 */
export function setAuthCookie(res, token, { remember = false } = {}) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
    maxAge: (remember ? TOKEN_TTL.remembered : TOKEN_TTL.default) * 1000,
  })
}

/** Clears the auth cookie using the same attributes it was set with. */
export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
  })
}

/**
 * Resolves the caller from the auth cookie.
 *
 * Returns the user id only if the token verifies *and* the account still
 * exists — a token signed for a since-deleted user is not an identity.
 */
async function resolveUserId(req) {
  const token = req.cookies?.[AUTH_COOKIE]
  if (!token) return null

  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret)
  } catch {
    return null
  }

  // `sub` is the current claim; `_id` is what tokens issued by the original
  // project carry. Accepting both means existing sessions survive the rewrite.
  const userId = payload.sub ?? payload._id
  if (!userId) return null

  const exists = await User.exists({ _id: userId })
  return exists ? String(userId) : null
}

/** Requires a signed-in caller. Sets `req.userId`. */
export async function requireAuth(req, _res, next) {
  try {
    const userId = await resolveUserId(req)
    if (!userId) {
      next(ApiError.unauthorized('You must be signed in to do that'))
      return
    }
    req.userId = userId
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Identifies the caller when possible and continues either way. Public pages use
 * it to compute viewer-specific flags (`isHost`, `isJoined`, …) for signed-in
 * visitors without shutting guests out.
 */
export async function optionalAuth(req, _res, next) {
  try {
    req.userId = await resolveUserId(req)
    next()
  } catch (error) {
    next(error)
  }
}

/** Requires a signed-in caller whose account has the admin role. */
export async function requireAdmin(req, _res, next) {
  try {
    const userId = await resolveUserId(req)
    if (!userId) {
      next(ApiError.unauthorized('You must be signed in to do that'))
      return
    }
    const user = await User.findById(userId).select('role').lean()
    if (user?.role !== 'admin') {
      next(ApiError.forbidden('Administrator access required'))
      return
    }
    req.userId = userId
    next()
  } catch (error) {
    next(error)
  }
}
