import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '/src/api/users.js'
import { Badge, Card, CardHeader, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { formatMatchTime } from '/src/lib/format.js'
import styles from './profile.module.css'

const dashboardKey = ['users', 'me', 'dashboard']

const STATUS_LABEL = {
  pending: 'Awaiting decision',
  accepted: 'Accepted — join to confirm your spot',
}

/**
 * What's next for this player, across every tournament they're in: their
 * next scheduled match, any result waiting on their confirmation, and
 * applications still in flight. Nothing scheduled is the normal state
 * between rounds, not an error — the empty state says so plainly.
 */
export function PlayerDashboard() {
  const dashboard = useQuery({ queryKey: dashboardKey, queryFn: getDashboard })

  return (
    <Card className={styles.section}>
      <CardHeader
        title="What's next for you"
        subtitle="Your matches and applications, in one place."
      />
      {dashboard.isPending ? (
        <LoadingState label="Loading what's next" rows={3} />
      ) : dashboard.isError ? (
        <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : (
        <DashboardContent data={dashboard.data} />
      )}
    </Card>
  )
}

function DashboardContent({ data }) {
  const { nextMatch, awaitingConfirmation, applications } = data
  const nothingToShow = !nextMatch && awaitingConfirmation.length === 0 && applications.length === 0

  if (nothingToShow) {
    return (
      <p className={styles.dashboardEmpty}>
        Nothing scheduled right now — that&rsquo;s normal between rounds. Check back once a host
        sets a time.
      </p>
    )
  }

  return (
    <div className={styles.dashboardSections}>
      <section>
        <h3 className={styles.dashboardHeading}>Next match</h3>
        {nextMatch ? (
          <Link to={`/tournaments/${nextMatch.tournamentId}`} className={styles.dashboardRow}>
            <span>
              Round {nextMatch.round} vs <strong>{nextMatch.opponentName}</strong> —{' '}
              {nextMatch.tournamentTitle}
            </span>
            <span className={styles.dashboardMeta}>{formatMatchTime(nextMatch.scheduledAt)}</span>
          </Link>
        ) : (
          <p className={styles.dashboardEmpty}>Nothing on the calendar yet.</p>
        )}
      </section>

      {awaitingConfirmation.length > 0 && (
        <section>
          <h3 className={styles.dashboardHeading}>Waiting on your confirmation</h3>
          {awaitingConfirmation.map((match) => (
            <Link
              key={match.matchId}
              to={`/tournaments/${match.tournamentId}`}
              className={styles.dashboardRow}
            >
              <span>
                Round {match.round} vs <strong>{match.opponentName}</strong> —{' '}
                {match.tournamentTitle}
              </span>
              <Badge tone="warning">Confirm result</Badge>
            </Link>
          ))}
        </section>
      )}

      {applications.length > 0 && (
        <section>
          <h3 className={styles.dashboardHeading}>Applications</h3>
          {applications.map((application) => (
            <Link
              key={application.tournamentId}
              to={`/tournaments/${application.tournamentId}`}
              className={styles.dashboardRow}
            >
              <span>{application.tournamentTitle}</span>
              <Badge tone={application.status === 'accepted' ? 'accent' : 'neutral'}>
                {STATUS_LABEL[application.status]}
              </Badge>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
