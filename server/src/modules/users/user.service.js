import User from '../../models/user.model.js'
import { ApiError } from '../../utils/ApiError.js'

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
 */
export async function becomeHost(userId) {
  const updated = await User.findOneAndUpdate(
    { _id: userId, isHost: false },
    { $set: { isHost: true } },
    { new: true }
  )
  if (updated) return updated

  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')
  throw ApiError.badRequest('You are already a host')
}
