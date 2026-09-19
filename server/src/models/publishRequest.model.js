import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { PUBLISH_TIERS } from '../config/publishing.js'

/**
 * One host's claim to have paid a publishing fee.
 *
 * Append-only in spirit: a row is written when a paid tournament asks to be
 * published and is only ever resolved once, to `confirmed` or `rejected`. A host
 * who is rejected and tries again gets a new row, so this collection is both the
 * admin queue and the audit trail of every fee that was ever claimed.
 */
const publishRequestSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    tournamentId: { type: String, ref: 'Tournament', required: true, index: true },
    hostId: { type: String, ref: 'User', required: true },
    // Denormalised so the audit trail still reads after a tournament is renamed
    // or deleted.
    tournamentTitle: { type: String, required: true },

    tier: { type: String, enum: PUBLISH_TIERS.map((entry) => entry.tier), required: true },
    amountCents: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
      index: true,
    },

    /**
     * Who took the money. `manual` is an admin saying so by hand; anything else
     * is a payment provider that told us over a webhook.
     */
    provider: { type: String, default: 'manual' },
    /**
     * The provider's own id for the payment. Unique when present, which is what
     * makes a replayed webhook a no-op rather than a second confirmation.
     */
    providerRef: { type: String, index: true, sparse: true, unique: true },
    requestedAt: { type: Date, required: true },

    confirmedAt: Date,
    confirmedBy: { type: String, ref: 'User' },
    paymentRef: String,

    rejectedAt: Date,
    rejectedBy: { type: String, ref: 'User' },
    reason: String,
  },
  { timestamps: true }
)

export default mongoose.model('PublishRequest', publishRequestSchema)
