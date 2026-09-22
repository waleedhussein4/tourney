import crypto from 'node:crypto'
import Notification from '../../models/notification.model.js'
import Team from '../../models/team.model.js'
import User from '../../models/user.model.js'
import Tournament from '../../models/tournament.model.js'
import { UNPUBLISHED } from '../../config/publishStates.js'
import { sendMail } from '../../lib/mailer.js'
import { ApiError } from '../../utils/ApiError.js'
import config from '../../config/env.js'

const DEFAULT_PAGE_SIZE = 20

/** Every toggleable email category, and the notification `type`(s) that fall under it. */
export const EMAIL_CATEGORIES = [
  'matchScheduled',
  'matchStartingSoon',
  'resultDisputed',
  'applicationDecided',
]

// The subset that matters when the reader is not looking at the site, mapped to
// the preference category that gates it. A reminder they'll see the moment they
// open the app (a tournament they're already watching starting soon) is
// deliberately left off — it would just be noise on top of the in-app list.
const TYPE_CATEGORY = {
  match_scheduled: 'matchScheduled',
  match_starting_soon: 'matchStartingSoon',
  result_disputed: 'resultDisputed',
  application_accepted: 'applicationDecided',
  application_rejected: 'applicationDecided',
}
const EMAIL_TYPES = new Set(Object.keys(TYPE_CATEGORY))

// --- unsubscribe tokens --------------------------------------------------------
//
// An HMAC of (userId, category) keyed on JWT_SECRET — the same secret that
// signs auth tokens, not a new one, and nothing is stored per-email. Anyone
// holding a valid link can turn that one category off for that one user; they
// cannot forge a link for a category or user they weren't sent, and they
// cannot turn anything back on with it.

function signUnsubscribeToken(userId, category) {
  return crypto.createHmac('sha256', config.jwtSecret).update(`${userId}:${category}`).digest('hex')
}

function verifyUnsubscribeToken(userId, category, token) {
  const expected = Buffer.from(signUnsubscribeToken(userId, category))
  const given = Buffer.from(String(token ?? ''))
  return expected.length === given.length && crypto.timingSafeEqual(expected, given)
}

/** The one-click unsubscribe link for this user/category, appended to every category email. */
function unsubscribeUrl(userId, category) {
  const base = config.clientUrl || ''
  const params = new URLSearchParams({
    userId: String(userId),
    category,
    token: signUnsubscribeToken(userId, category),
  })
  return `${base}/unsubscribe?${params.toString()}`
}

/** Turns a category off for a user via a signed unsubscribe link. Never logged, never trusted unverified. */
export async function unsubscribeByToken(userId, category, token) {
  if (!EMAIL_CATEGORIES.includes(category) || !verifyUnsubscribeToken(userId, category, token)) {
    throw ApiError.badRequest('That unsubscribe link is invalid', { code: 'UNSUBSCRIBE_INVALID' })
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { [`emailPreferences.${category}`]: false } },
    { new: true }
  ).select('emailPreferences')
  if (!user) throw ApiError.notFound('User not found')
  return user.emailPreferences
}

export async function getEmailPreferences(userId) {
  const user = await User.findById(userId).select('emailPreferences').lean()
  if (!user) throw ApiError.notFound('User not found')
  return user.emailPreferences
}

export async function updateEmailPreferences(userId, updates) {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: Object.fromEntries(
        Object.entries(updates).map(([key, value]) => [`emailPreferences.${key}`, value])
      ),
    },
    { new: true }
  ).select('emailPreferences')
  if (!user) throw ApiError.notFound('User not found')
  return user.emailPreferences
}

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
      const category = TYPE_CATEGORY[type]
      const recipient = await User.findById(userId).select('email emailPreferences').lean()
      const enabled = recipient?.emailPreferences?.[category] ?? true
      if (recipient && enabled) {
        const text = `${body}\n\nTurn off these emails: ${unsubscribeUrl(userId, category)}`
        // `critical: false` means sendMail itself should swallow a failure
        // rather than reject — but this still can't trust an implementation
        // it doesn't own. Nothing here may propagate a rejection either way.
        await sendMail({ to: recipient.email, subject: title, text, critical: false })
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

export async function notifyResultResolved(tournament, match) {
  const recipients = match.participants
    .filter(Boolean)
    .flatMap((id) => participantUserIds(tournament, id))
  await notifyAll(recipients, {
    type: 'result_resolved',
    subjectId: match._id,
    title: 'Dispute resolved',
    body: `The host resolved the disputed round ${match.round} match in "${tournament.title}".`,
    tournamentId: tournament._id,
  })
}

/** A waitlist entry was promoted into an open slot after someone withdrew. */
export async function notifyWaitlistPromoted(tournament, entry) {
  const recipients = entry.isTeam
    ? entry.members.map((member) => String(member.userId))
    : [String(entry.userId)]
  await notifyAll(recipients, {
    type: 'waitlist_promoted',
    subjectId: entry._id,
    title: "You're in!",
    body: `A slot opened up in "${tournament.title}" and you were next on the waitlist.`,
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
