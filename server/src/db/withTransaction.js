import mongoose from 'mongoose'
import { ApiError } from '../utils/ApiError.js'

/**
 * Runs `work` inside a MongoDB transaction and hands it the session.
 *
 * Every credit movement in this app touches at least two documents — a balance
 * and a ledger entry, usually a third — and a partial write would either mint
 * or destroy credits. So each of those runs through here: all of it commits, or
 * none of it does.
 *
 * @template T
 * @param {(session: import('mongoose').ClientSession) => Promise<T>} work
 * @returns {Promise<T>}
 */
export async function withTransaction(work) {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await work(session)
    })
    return result
  } catch (error) {
    if (isTransactionsUnsupported(error)) {
      throw new ApiError(
        500,
        'This deployment cannot move credits safely: the database does not support transactions.',
        { code: 'TRANSACTIONS_UNSUPPORTED' }
      )
    }
    throw error
  } finally {
    await session.endSession()
  }
}

/**
 * A standalone `mongod` rejects transactions outright. Atlas (any tier) and the
 * in-memory replica set the tests use are replica sets and accept them, so this
 * only ever fires against a local single-node install started without
 * `--replSet` — see docs/SETUP.md.
 */
function isTransactionsUnsupported(error) {
  const message = String(error?.message ?? '')
  return (
    error?.code === 20 ||
    message.includes('Transaction numbers are only allowed on a replica set member or mongos') ||
    message.includes('Transactions are not supported')
  )
}
