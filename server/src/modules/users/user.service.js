import User from '../../models/user.model.js'
import { ApiError } from '../../utils/ApiError.js'

// An account with an unverified email may browse and join tournaments freely —
// there is nothing an unproven address puts at risk there. It may not become a
// host (`becomeHost`, below), and since `createTournament` already requires
// `isHost`, that single gate also keeps it from ever publishing. Blocked with
// a specific 403 (`EMAIL_NOT_VERIFIED`), never a silent no-op.

/** Loads a user or fails with a 404. */
export async function getUser(userId) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')
  return user
}

/**
 * Turns an account into a host.
 *
 * Free, and instant. What costs money is publishing more than one tournament at
 * a time, and that is the subscription — charging twice, once to hold the title
 * and again to use it, is a toll booth in front of a toll booth.
 *
 * Requires a verified email: `createTournament` already requires `isHost`, so
 * gating this one endpoint is enough to keep an unproven address off the whole
 * hosting path, publish included, without duplicating the check everywhere.
 */
export async function becomeHost(userId) {
  const updated = await User.findOneAndUpdate(
    { _id: userId, isHost: false, emailVerified: true },
    { $set: { isHost: true } },
    { new: true }
  )
  if (updated) return updated

  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')
  if (!user.emailVerified) {
    throw new ApiError(403, 'Verify your email before you can become a host', {
      code: 'EMAIL_NOT_VERIFIED',
    })
  }
  throw ApiError.badRequest('You are already a host')
}
