import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import validator from 'validator'

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

    credits: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

/** The public shape of a user, as `GET /api/users/me` returns it. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    credits: this.credits,
    isHost: this.isHost,
    isAdmin: this.role === 'admin',
  }
}

export default mongoose.model('User', userSchema)
