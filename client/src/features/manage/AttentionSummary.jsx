import { Card, CardHeader } from '/src/components/ui/index.js'
import styles from './ManagePage.module.css'

/**
 * What this tournament needs from its host, right now: pending applications,
 * disputed matches, matches with no scheduled time, results waiting on the
 * other competitor's confirmation, and rounds that just finished so the next
 * one can be scheduled. Each count is a plain in-page link to the section
 * that fixes it.
 *
 * A tournament with nothing to show here is not an empty page — it is one
 * running itself, and says so.
 */
export function AttentionSummary({ tournament }) {
  const attention = tournament.attention
  if (!attention) return null

  const items = [
    {
      key: 'applications',
      count: attention.pendingApplications,
      href: '#applications',
      label: (count) => `${count} ${count === 1 ? 'application' : 'applications'} waiting on you`,
    },
    {
      key: 'disputes',
      count: attention.disputedMatches.length,
      href: '#disputes',
      label: (count) => `${count} disputed ${count === 1 ? 'match' : 'matches'} to settle`,
    },
    {
      key: 'unscheduled',
      count: attention.unscheduledMatches.length,
      href: '#matches',
      label: (count) => `${count} ${count === 1 ? 'match has' : 'matches have'} no scheduled time`,
    },
    {
      key: 'awaiting-confirmation',
      count: attention.awaitingConfirmation.length,
      href: '#matches',
      label: (count) =>
        `${count} reported ${count === 1 ? 'result' : 'results'} awaiting confirmation`,
    },
    {
      key: 'rounds-ready',
      count: attention.roundsReady.length,
      href: '#matches',
      label: (count) =>
        `Round${count === 1 ? '' : 's'} ${attention.roundsReady.join(', ')} finished — the next round can be scheduled`,
    },
  ].filter((item) => item.count > 0)

  return (
    <Card>
      <CardHeader title="Needs your attention" />
      {items.length === 0 ? (
        <p className={styles.hint}>
          Nothing needs you right now — this tournament is running itself.
        </p>
      ) : (
        <ul className={styles.attentionList}>
          {items.map((item) => (
            <li key={item.key}>
              <a href={item.href} className={styles.attentionRow}>
                {item.label(item.count)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
