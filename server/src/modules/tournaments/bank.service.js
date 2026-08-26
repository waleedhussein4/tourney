// The per-tournament escrow.
//
// Entry fees flow in, host top-ups flow in, payouts flow out, and the remainder
// goes to the host when the tournament ends. Every movement happens inside a
// transaction together with the ledger entry that records it, so the sum of all
// user balances plus all bank balances is invariant.

import User from '../../models/user.model.js'
import Transaction from '../../models/transaction.model.js'
import Tournament from '../../models/tournament.model.js'
import { ApiError } from '../../utils/ApiError.js'

/**
 * Moves credits out of a user's balance, refusing rather than going negative.
 *
 * The balance is re-checked in the update's own filter, so two concurrent
 * requests cannot both pass a read-then-write check and overdraw the account.
 */
export async function debitUser(userId, amount, session) {
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive')

  const updated = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: amount } },
    { $inc: { credits: -amount } },
    { new: true, session }
  )
  if (!updated) throw ApiError.badRequest('Not enough credits')
  return updated
}

/** Adds credits to a user's balance. */
export async function creditUser(userId, amount, session) {
  if (amount <= 0) return null
  return User.findOneAndUpdate(
    { _id: userId },
    { $inc: { credits: amount } },
    { new: true, session }
  )
}

/** Appends one ledger entry. */
export function recordTransaction(entry, session) {
  return Transaction.create([entry], { session })
}

/** Moves credits into the bank. */
export async function creditBank(tournamentId, amount, session) {
  if (amount <= 0) return
  await Tournament.updateOne({ _id: tournamentId }, { $inc: { bank: amount } }, { session })
}

/**
 * Moves credits out of the bank, refusing to overdraw it.
 *
 * A payout that would take the bank below zero means the prize table and the
 * escrow disagree; failing loudly is better than minting the difference.
 */
export async function debitBank(tournamentId, amount, session) {
  if (amount <= 0) return
  const updated = await Tournament.findOneAndUpdate(
    { _id: tournamentId, bank: { $gte: amount } },
    { $inc: { bank: -amount } },
    { new: true, session }
  )
  if (!updated) throw new ApiError(500, 'The tournament bank does not hold enough to pay this out')
}

/**
 * A host top-up.
 *
 * Validation happens before any money moves. The original version debited the
 * host first and then checked whether the amount exceeded the bank ceiling —
 * so an over-large deposit destroyed the host's credits outright.
 *
 * The amount is capped at what is still needed rather than rejected, so a host
 * who types "the whole prize pool" into a half-filled bank tops it up instead of
 * being told off.
 */
export async function depositIntoBank(tournament, hostId, amount, session) {
  const needed = tournament.totalPrize - tournament.bank
  if (needed <= 0) throw ApiError.badRequest('The bank is already full')

  const deposit = Math.min(amount, needed)

  await debitUser(hostId, deposit, session)
  await creditBank(tournament._id, deposit, session)
  await recordTransaction(
    {
      userId: hostId,
      type: 'bank_deposit',
      amount: -deposit,
      tournamentId: tournament._id,
      description: `Top-up for "${tournament.title}"`,
    },
    session
  )

  return deposit
}
