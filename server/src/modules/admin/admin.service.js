import User from '../../models/user.model.js'
import Tournament from '../../models/tournament.model.js'
import { ApiError } from '../../utils/ApiError.js'
import { recordModeration } from './moderation.service.js'

/** Suspends an account: it can no longer sign in, host, or join. */
export async function suspendUser(adminId, userId, reason) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')
  if (user.role === 'admin') throw ApiError.badRequest('An administrator cannot be suspended')

  user.suspended = true
  user.suspendedReason = reason
  await user.save()

  await recordModeration({
    actor: adminId,
    action: 'user_suspended',
    targetType: 'user',
    targetId: userId,
    reason,
  })

  return user
}

/** Lifts a suspension. */
export async function unsuspendUser(adminId, userId, reason) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')

  user.suspended = false
  user.suspendedReason = null
  await user.save()

  await recordModeration({
    actor: adminId,
    action: 'user_unsuspended',
    targetType: 'user',
    targetId: userId,
    reason,
  })

  return user
}

/** Takes any tournament back to a draft only its host can see — a site-wide power, not just the host's. */
export async function unpublishAnyTournament(adminId, tournamentId, reason) {
  const tournament = await Tournament.findById(tournamentId)
  if (!tournament) throw ApiError.notFound('Tournament not found')

  tournament.publishState = 'draft'
  await tournament.save()

  await recordModeration({
    actor: adminId,
    action: 'tournament_unpublished',
    targetType: 'tournament',
    targetId: tournamentId,
    reason,
  })

  return tournament
}

/** Deletes any tournament outright. */
export async function deleteAnyTournament(adminId, tournamentId, reason) {
  const tournament = await Tournament.findById(tournamentId)
  if (!tournament) throw ApiError.notFound('Tournament not found')

  await Tournament.deleteOne({ _id: tournament._id })

  await recordModeration({
    actor: adminId,
    action: 'tournament_deleted',
    targetType: 'tournament',
    targetId: tournamentId,
    reason,
  })

  return { deleted: true }
}
