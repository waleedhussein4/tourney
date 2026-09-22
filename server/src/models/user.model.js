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

    // Set only while a password-reset link is outstanding; cleared the moment
    // it is used or replaced. Hashed the same way a login password never is
    // stored raw — a leaked database must not hand out working reset links.
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    // True once the address behind this account has been proven reachable.
    // Seeded and demo accounts are created pre-verified — see seed-data.js.
    emailVerified: { type: Boolean, default: false },
    // Hashed the same way the reset token is. Left in place (not cleared) once
    // verification succeeds, so a replayed link can be told apart from a
    // tampered one — `emailVerified` is what actually gates re-use.
    verifyEmailToken: { type: String, select: false },
    verifyEmailExpires: { type: Date, select: false },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    isHost: { type: Boolean, default: false },

    /**
     * Set by an admin. A suspended account cannot sign in, host, or join — see
     * `requireAuth` and `authenticateUser`, the two places that turn this into
     * a rejection instead of silently letting the account act.
     */
    suspended: { type: Boolean, default: false },
    suspendedReason: { type: String, default: null },

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

    /**
     * Per-category opt-outs for notification email. The in-app notification is
     * always created regardless of these — they only gate the email leg. Every
     * category defaults to on; a category not in this set (e.g. tournament
     * published) is in-app only and has no toggle at all. Security mail
     * (password reset, email verification) is not a notification and never
     * reads this.
     */
    emailPreferences: {
      _id: false,
      matchScheduled: { type: Boolean, default: true },
      matchStartingSoon: { type: Boolean, default: true },
      resultDisputed: { type: Boolean, default: true },
      applicationDecided: { type: Boolean, default: true },
    },
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
    emailVerified: this.emailVerified,
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
