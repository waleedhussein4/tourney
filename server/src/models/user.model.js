import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import validator from 'validator'
import { PLAN_STATES, planIsActive } from '../config/plans.js'

const { Schema } = mongoose

const userSchema = new Schema(
  {
    // String UUIDs, not ObjectIds, throughout — the ids in the original
    // database are UUIDs and every document in this app uses the same strategy.
    _id: { type: String, default: uuidv4 },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      // Stored lowercase so "A@b.com" and "a@b.com" cannot become two accounts.
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Invalid email format'],
    },

    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },

    // Never returned unless a query asks for it explicitly, so no handler can
    // leak the hash by forgetting to project it away.
    password: { type: String, required: true, select: false },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    isHost: { type: Boolean, default: false },

    /**
     * The subscription that lets this account publish without limit.
     *
     * Embedded rather than a collection of its own: an account has exactly one,
     * it is read on every publish, and there is no history worth keeping that
     * the gateway does not already hold.
     */
    hostingPlan: {
      _id: false,
      status: { type: String, enum: PLAN_STATES, default: 'none' },
      /** The gateway's id for the subscription, so its events can find us. */
      subscriptionId: { type: String, index: true, sparse: true },
      provider: String,
      /** When the current paid period ends — what a cancelled plan runs until. */
      renewsAt: Date,
      updatedAt: Date,
      /** The last webhook event id applied, so a redelivered event is a no-op. */
      lastEventId: String,
    },

    /** Set by the seed script and nothing else. The demo reset deletes only these. */
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
)

/** True while this account may publish without limit. */
userSchema.virtual('hasActivePlan').get(function hasActivePlan() {
  return planIsActive(this.hostingPlan?.status)
})

/** The public shape of a user, as `GET /api/users/me` returns it. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    isHost: this.isHost,
    isAdmin: this.role === 'admin',
    plan: {
      status: this.hostingPlan?.status ?? 'none',
      active: this.hasActivePlan,
      renewsAt: this.hostingPlan?.renewsAt ?? null,
    },
  }
}

export default mongoose.model('User', userSchema)
