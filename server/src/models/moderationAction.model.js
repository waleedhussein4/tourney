import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const { Schema } = mongoose

export const MODERATION_ACTIONS = [
  'participant_removed',
  'user_suspended',
  'user_unsuspended',
  'tournament_unpublished',
  'tournament_deleted',
]

export const MODERATION_TARGET_TYPES = ['user', 'tournament']

/**
 * One row per moderation decision: who did it, to what, when, and why.
 *
 * Written by hosts (removing a participant from their own tournament) and by
 * admins (suspending an account, taking down a tournament) alike — anything
 * that removes someone or something from the site writes one of these. Never
 * edited or deleted once written; it is the record a bad call gets reviewed
 * against.
 */
const moderationActionSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    actor: { type: String, ref: 'User', required: true },
    action: { type: String, enum: MODERATION_ACTIONS, required: true },
    targetType: { type: String, enum: MODERATION_TARGET_TYPES, required: true },
    targetId: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

moderationActionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 })

export default mongoose.model('ModerationAction', moderationActionSchema)
