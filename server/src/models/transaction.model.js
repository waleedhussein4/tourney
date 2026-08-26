import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { TRANSACTION_TYPES } from '../config/constants.js'

const { Schema } = mongoose

/**
 * An append-only ledger of every credit movement.
 *
 * `amount` is signed from the user's point of view: positive means credits
 * arrived, negative means they left. Summing a user's amounts therefore
 * reproduces their balance, which is what the conservation tests in Phase 3
 * assert.
 */
const transactionSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    userId: { type: String, ref: 'User', required: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true },
    tournamentId: { type: String, ref: 'Tournament' },
    description: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

transactionSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('Transaction', transactionSchema)
