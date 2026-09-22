import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const { Schema } = mongoose

export const NOTIFICATION_TYPES = [
  'application_accepted',
  'application_rejected',
  'tournament_published',
  'tournament_starting_soon',
  'match_scheduled',
  'match_starting_soon',
  'result_confirmed',
  'result_disputed',
  'result_resolved',
  'tournament_ended',
]

/**
 * One notification for one user about one event.
 *
 * Denormalised on purpose: `title`/`body` are rendered once, at creation time,
 * from whatever the tournament/match looked like then. A notification about a
 * since-deleted tournament still reads correctly, because it never joins back
 * to it.
 *
 * `subjectId` is what the event happened to — an application id, a match id,
 * or a tournament id. Together with `user` and `type` it is the idempotency
 * key: the reminder sweep can run twice, or overlap its own retry, and the
 * unique index below — not application code — stops the second write.
 */
const notificationSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    user: { type: String, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    subjectId: { type: String, required: true },
    tournamentId: { type: String, default: null },
    title: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// The idempotency guard. A unique index, not an application-level check —
// the check-then-write race is exactly what a concurrent sweep would hit.
notificationSchema.index({ user: 1, type: 1, subjectId: 1 }, { unique: true })
// The in-app list and unread count both filter by user first.
notificationSchema.index({ user: 1, read: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
