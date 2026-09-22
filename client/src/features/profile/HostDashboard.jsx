import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getHostDashboard } from '/src/api/users.js'
import { Badge, Card, CardHeader, ErrorState, LoadingState } from '/src/components/ui/index.js'
import styles from './profile.module.css'

const hostDashboardKey = ['users', 'me', 'host-dashboard']

/**
 * Across every tournament this user hosts: which ones need them right now, so
 * they don't have to open each one to find out. A tournament only appears
 * here once something is actually waiting on it — everything quiet is the
 * normal state, not a sign the page is broken.
 */
export function HostDashboard() {
  const dashboard = useQuery({ queryKey: hostDashboardKey, queryFn: getHostDashboard })

  return (
    <Card className={styles.section}>
      <CardHeader title="Needs your attention" subtitle="Across every tournament you host." />
      {dashboard.isPending ? (
        <LoadingState label="Loading what needs you" rows={2} />
      ) : dashboard.isError ? (
        <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : (
        <HostDashboardContent tournaments={dashboard.data.tournaments} />
      )}
    </Card>
  )
}

function HostDashboardContent({ tournaments }) {
  const needingAttention = tournaments.filter((tournament) => tournament.total > 0)

  if (needingAttention.length === 0) {
    return (
      <p className={styles.dashboardEmpty}>
        Nothing needs you right now — every tournament you host is running itself.
      </p>
    )
  }

  return (
    <div className={styles.dashboardSections}>
      {needingAttention.map((tournament) => (
        <Link
          key={tournament.tournamentId}
          to={`/tournament/${tournament.tournamentId}/manage`}
          className={styles.dashboardRow}
        >
          <span>{tournament.tournamentTitle}</span>
          <Badge tone="warning">
            {tournament.total} {tournament.total === 1 ? 'thing needs' : 'things need'} you
          </Badge>
        </Link>
      ))}
    </div>
  )
}
