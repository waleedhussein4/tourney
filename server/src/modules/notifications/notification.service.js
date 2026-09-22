import Notification from '../../models/notification.model.js'
import Team from '../../models/team.model.js'
import User from '../../models/user.model.js'
import Tournament from '../../models/tournament.model.js'
import { UNPUBLISHED } from '../../config/publishStates.js'
import { sendMail } from '../../lib/mailer.js'
import { ApiError } from '../../utils/ApiError.js'

const DEFAULT_PAGE_SIZE = 20

// The subset that matters when the reader is not looking at the site. A
// reminder they'll see the moment they open the app (a tournament they're
// already watching starting soon) is deliberately left off — it would just be
// noise on top of the in-app list.
const EMAIL_TYPES = new Set([
  'application_accepted',
  'application_rejected',
  'match_scheduled',
  'match_starting_soon',
  'result_disputed',
])

/**
 * Creates one notification, and emails it when the event is one of the ones
 * that matters when you are not looking at the site.
 *
 * Never throws. A duplicate-key collision (the reminder sweep re-running, or
 * two requests racing) means this exact notification already exists — that is
 * success, not failure. Anything else is logged and swallowed: notifying is
 * never allowed to break the action that triggered it.
 */
export async function notify({ userId, type, subjectId, title, body, tournamentId = null }) {
  let notification
  try {
    notification = await Notification.create({
      user: String(userId),
      type,
      subjectId: String(subjectId),
      title,
      body,
      tournamentId: tournamentId ? String(tournamentId) : null,
    })
  } catch (error) {
    if (error?.code !== 11000) {
      // eslint-disable-next-line no-console -- the one place a notification failure surfaces.
      console.error(`[notifications] failed to create ${type} for ${userId}:`, error.message)
    }
    return null
  }

  if (EMAIL_TYPES.has(type)) {
    try {
      const recipient = await User.findById(userId).select('email').lean()
      if (recipient) {
        // `critical: false` means sendMail itself should swallow a failure
        // rather than reject — but this still can't trust an implementation
        // it doesn't own. Nothing here may propagate a rejection either way.
        await sendMail({ to: recipient.email, subject: title, text: body, critical: false })
      }
    } catch (error) {
      // eslint-disable-next-line no-console -- the one place a notification failure surfaces.
      console.error(`[notifications] failed to email ${type} for ${userId}:`, error.message)
    }
  }

  return notification
}

/** Notifies every id in `userIds` of the same event. Duplicates are skipped. */
async function notifyAll(userIds, event) {
  const unique = [...new Set(userIds.map(String))]
  await Promise.all(unique.map((userId) => notify({ userId, ...event })))
}

// --- recipient resolution ----------------------------------------------------

/** The user ids competing under `participantId` in this tournament — one for a solo entrant, a team's roster for a team. */
export function participantUserIds(tournament, participantId) {
  if (!tournament.isTeamBased) return [String(participantId)]
  const team = tournament.enrolledTeams.find(
    (entry) => String(entry.teamId) === String(participantId)
  )
  return team ? team.members.map((member) => String(member.userId)) : []
}

/** Every user id currently competing in the tournament, teams expanded to members. */
export function allParticipantUserIds(tournament) {
  if (!tournament.isTeamBased) return tournament.enrolledUsers.map((entry) => String(entry.userId))
  return tournament.enrolledTeams.flatMap((team) =>
    team.members.map((member) => String(member.userId))
  )
}

/** The user id(s) behind an application — the applicant, or a team's whole roster. */
async function applicantUserIds(application) {
  if (!application.isTeam) return [String(application.applicantId)]
  const team = await Team.findById(application.applicantId).select('members').lean()
  return team ? team.members.map(String) : []
}

// --- triggers, called from the tournament service ----------------------------

export async function notifyApplicationDecided(tournament, application, accepted) {
  const recipients = await applicantUserIds(application)
  const verb = accepted ? 'accepted' : 'declined'
  await notifyAll(recipients, {
    type: accepted ? 'application_accepted' : 'application_rejected',
    subjectId: application._id,
    title: `Application ${verb}`,
    body: `Your application to "${tournament.title}" was ${verb}.`,
    tournamentId: tournament._id,
  })
}

export async function notifyTournamentPublished(tournament) {
  await notifyAll(allParticipantUserIds(tournament), {
    type: 'tournament_published',
    subjectId: tournament._id,
    title: 'Tournament published',
    body: `"${tournament.title}" is now live.`,
    tournamentId: tournament._id,
  })
}

export async function notifyMatchScheduled(tournament, match) {
  const recipients = match.participants
    .filter(Boolean)
    .flatMap((id) => participantUserIds(tournament, id))
  await notifyAll(recipients, {
    type: 'match_scheduled',
    subjectId: match._id,
    title: 'Match scheduled',
    body: `Your round ${match.round} match in "${tournament.title}" has been scheduled for ${match.scheduledAt.toLocaleString()}.`,
    tournamentId: tournament._id,
  })
}

export async function notifyResultConfirmed(tournament, match) {
  await notify({
    userId: match.reportedBy,
    type: 'result_confirmed',
    subjectId: match._id,
    title: 'Result confirmed',
    body: `The result you reported for your round ${match.round} match in "${tournament.title}" was confirmed.`,
    tournamentId: tournament._id,
  })
}

export async function notifyResultDisputed(tournament, match) {
  await notify({
    userId: match.reportedBy,
    type: 'result_disputed',
    subjectId: match._id,
    title: 'Result disputed',
    body: `The result you reported for your round ${match.round} match in "${tournament.title}" was disputed.`,
    tournamentId: tournament._id,
  })
}

export async function notifyTournamentEnded(tournament) {
  await notifyAll(allParticipantUserIds(tournament), {
    type: 'tournament_ended',
    subjectId: tournament._id,
    title: 'Tournament ended',
    body: `"${tournament.title}" has ended.`,
    tournamentId: tournament._id,
  })
}

// --- the reminder sweep -------------------------------------------------------

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/**
 * The scheduled reminder sweep: tournaments starting within a day, and
 * matches starting within an hour. Driven by cron — see
 * `server/src/modules/cron/cron.routes.js` — and safe to run repeatedly or
 * concurrently, because every notification it writes goes through `notify`,
 * which is keyed on (user, type, subject) and never double-sends.
 */
export async function runReminderSweep(now = new Date()) {
  const in24h = new Date(now.getTime() + DAY_MS)
  const in1h = new Date(now.getTime() + HOUR_MS)

  const startingSoon = await Tournament.find({
    publishState: { $nin: UNPUBLISHED },
    hasStarted: false,
    hasEnded: false,
    startDate: { $gte: now, $lte: in24h },
  })

  for (const tournament of startingSoon) {
    await notifyAll(allParticipantUserIds(tournament), {
      type: 'tournament_starting_soon',
      subjectId: tournament._id,
      title: 'Tournament starting soon',
      body: `"${tournament.title}" starts within 24 hours.`,
      tournamentId: tournament._id,
    })
  }

  const inProgress = await Tournament.find({
    hasStarted: true,
    hasEnded: false,
    'matches.state': 'scheduled',
    'matches.scheduledAt': { $gte: now, $lte: in1h },
  })

  let matchesNotified = 0
  for (const tournament of inProgress) {
    for (const match of tournament.matches) {
      if (match.state !== 'scheduled' || !match.scheduledAt) continue
      if (match.scheduledAt < now || match.scheduledAt > in1h) continue

      matchesNotified++
      const recipients = match.participants
        .filter(Boolean)
        .flatMap((id) => participantUserIds(tournament, id))
      await notifyAll(recipients, {
        type: 'match_starting_soon',
        subjectId: match._id,
        title: 'Match starting soon',
        body: `Your round ${match.round} match in "${tournament.title}" starts within the hour.`,
        tournamentId: tournament._id,
      })
    }
  }

  return { tournamentsNotified: startingSoon.length, matchesNotified }
}

// --- reading -------------------------------------------------------------------

export async function listForUser(userId, { page = 1, limit = DEFAULT_PAGE_SIZE } = {}) {
  const skip = (page - 1) * limit

  const [notifications, total, unread] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, read: false }),
  ])

  return {
    notifications,
    unreadCount: unread,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  }
}

export async function unreadCount(userId) {
  return Notification.countDocuments({ user: userId, read: false })
}

export async function markRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { read: true } },
    { new: true }
  )
  if (!notification) throw ApiError.notFound('Notification not found')
  return notification
}

export async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } })
}
