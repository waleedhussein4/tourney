import ModerationAction from '../../models/moderationAction.model.js'

/**
 * Writes one line of the audit trail: who did it, what, to what, and why.
 *
 * Called by every action that removes someone or something — a host removing
 * a participant, an admin suspending an account or taking down a tournament.
 * Never throws into its caller's success path failing silently would be worse
 * than a missing record surfacing as a 500, so unlike `notify` this one is
 * allowed to propagate.
 */
export async function recordModeration({ actor, action, targetType, targetId, reason }) {
  return ModerationAction.create({
    actor: String(actor),
    action,
    targetType,
    targetId: String(targetId),
    reason,
  })
}

/** The audit trail for one target, newest first — what an admin reviews a call against. */
export async function listModerationLog(targetType, targetId) {
  return ModerationAction.find({ targetType, targetId: String(targetId) })
    .sort({ createdAt: -1 })
    .lean()
}
