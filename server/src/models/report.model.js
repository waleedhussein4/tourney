import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const { Schema } = mongoose

export const REPORT_TARGET_TYPES = ['user', 'tournament']

/**
 * A flag from one member for the admin queue: who reported, what they reported,
 * and why. Read-only from the reporter's side once filed — resolving it is an
 * admin's job, tracked on the moderation action it leads to, not on the report
 * itself.
 */
const reportSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    reporter: { type: String, ref: 'User', required: true },
    targetType: { type: String, enum: REPORT_TARGET_TYPES, required: true },
    targetId: { type: String, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

reportSchema.index({ createdAt: -1 })

export default mongoose.model('Report', reportSchema)
