import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { LIMITS } from '../config/constants.js'

const { Schema } = mongoose

const teamSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },

    /**
     * The six-character code people type or share to join. Separate from `_id`
     * because it is short enough to read aloud, and short enough to collide —
     * `generateJoinCode` retries against this unique index.
     */
    joinCode: { type: String, required: true, unique: true, uppercase: true },

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: LIMITS.teamName,
    },

    members: [{ type: String, ref: 'User' }],

    leader: { type: String, ref: 'User', required: true },

    createdBy: { type: String, ref: 'User', required: true },
  },
  { timestamps: true }
)

teamSchema.index({ members: 1 })

/** True when `userId` is on the roster. Ids are strings, so this is an equality. */
teamSchema.methods.hasMember = function hasMember(userId) {
  return this.members.some((member) => String(member) === String(userId))
}

teamSchema.methods.isLeader = function isLeader(userId) {
  return String(this.leader) === String(userId)
}

export default mongoose.model('Team', teamSchema)
