import User from '../../models/user.model.js'
import Transaction from '../../models/transaction.model.js'
import { HOST_UPGRADE_COST } from '../../config/constants.js'
import { withTransaction } from '../../db/withTransaction.js'
import { ApiError } from '../../utils/ApiError.js'

/** Loads a user or fails with a 404. */
export async function getUser(userId) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')
  return user
}

/** The signed-in user's ledger, newest first. */
export function listTransactions(userId, { limit }) {
  return Transaction.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean()
}

/**
 * Upgrades an account to a host for a fixed price in credits.
 *
 * Debit and ledger entry commit together, and the debit is conditional on the
 * balance still being sufficient — so two simultaneous requests cannot both pass
 * a read-then-write check and take the user negative.
 */
export async function becomeHost(userId) {
  return withTransaction(async (session) => {
    const user = await User.findById(userId).session(session)
    if (!user) throw ApiError.notFound('User not found')
    if (user.isHost) throw ApiError.badRequest('You are already a host')
    if (user.credits < HOST_UPGRADE_COST) {
      throw ApiError.badRequest(
        `Becoming a host costs ${HOST_UPGRADE_COST} credits — you have ${user.credits}`
      )
    }

    const updated = await User.findOneAndUpdate(
      { _id: userId, isHost: false, credits: { $gte: HOST_UPGRADE_COST } },
      { $inc: { credits: -HOST_UPGRADE_COST }, $set: { isHost: true } },
      { new: true, session }
    )
    if (!updated) throw ApiError.conflict('Your account changed while we were processing this')

    await Transaction.create(
      [
        {
          userId,
          type: 'host_upgrade',
          amount: -HOST_UPGRADE_COST,
          description: 'Host account upgrade',
        },
      ],
      { session }
    )

    return updated
  })
}
