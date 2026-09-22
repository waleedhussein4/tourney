import Report from '../../models/report.model.js'
import User from '../../models/user.model.js'
import Tournament from '../../models/tournament.model.js'
import { ApiError } from '../../utils/ApiError.js'

/**
 * Files a report against a tournament or a user, for the admin queue.
 *
 * The target must actually exist — reporting a made-up id is a 404, not a
 * silent write nobody can act on.
 */
export async function createReport({ reporterId, targetType, targetId, reason }) {
  const exists =
    targetType === 'user'
      ? await User.exists({ _id: targetId })
      : await Tournament.exists({ _id: targetId })
  if (!exists) throw ApiError.notFound(`${targetType === 'user' ? 'User' : 'Tournament'} not found`)

  return Report.create({
    reporter: String(reporterId),
    targetType,
    targetId: String(targetId),
    reason,
  })
}

/** The admin queue: every report, reporter and target resolved to a readable name, newest first. */
export async function listReports() {
  const reports = await Report.find().sort({ createdAt: -1 }).lean()
  if (reports.length === 0) return []

  const userIds = new Set(reports.map((report) => report.reporter))
  const tournamentIds = new Set()
  const reportedUserIds = new Set()
  for (const report of reports) {
    if (report.targetType === 'tournament') tournamentIds.add(report.targetId)
    else reportedUserIds.add(report.targetId)
  }
  for (const id of reportedUserIds) userIds.add(id)

  const [users, tournaments] = await Promise.all([
    User.find({ _id: { $in: [...userIds] } })
      .select('username')
      .lean(),
    Tournament.find({ _id: { $in: [...tournamentIds] } })
      .select('title')
      .lean(),
  ])
  const usernames = new Map(users.map((user) => [String(user._id), user.username]))
  const titles = new Map(
    tournaments.map((tournament) => [String(tournament._id), tournament.title])
  )

  return reports.map((report) => ({
    id: report._id,
    reporter: { id: report.reporter, name: usernames.get(report.reporter) ?? null },
    targetType: report.targetType,
    targetId: report.targetId,
    targetName:
      report.targetType === 'tournament'
        ? (titles.get(report.targetId) ?? null)
        : (usernames.get(report.targetId) ?? null),
    reason: report.reason,
    createdAt: report.createdAt,
  }))
}
