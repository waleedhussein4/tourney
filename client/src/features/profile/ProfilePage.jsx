import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listMyTournaments, tournamentKeys } from '/src/api/tournaments.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { TournamentCard } from '/src/features/tournaments/TournamentCard.jsx'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
} from '/src/components/ui/index.js'
import { useDocumentTitle } from '/src/lib/useDocumentTitle.js'
import { HostDashboard } from './HostDashboard.jsx'
import { NotificationPreferences } from './NotificationPreferences.jsx'
import { PlayerDashboard } from './PlayerDashboard.jsx'
import styles from './profile.module.css'

export function ProfilePage() {
  // The route guard has already established there is a user here.
  const { user } = useAuth()
  useDocumentTitle(user.username)

  const tournaments = useQuery({
    queryKey: tournamentKeys.mine,
    queryFn: listMyTournaments,
  })

  return (
    <PageShell>
      <PageHeader title={user.username} description={user.email} />

      <div className={styles.grid}>
        <Card>
          <p className={styles.statLabel}>Account</p>
          <div className={styles.badges}>
            <Badge tone={user.isHost ? 'accent' : 'neutral'}>
              {user.isHost ? 'Host' : 'Player'}
            </Badge>
            {user.isAdmin && <Badge tone="warning">Administrator</Badge>}
          </div>
          {!user.isHost && (
            <Link to="/become-host" className={styles.link}>
              Become a host
            </Link>
          )}
          {user.isHost && (
            <Link to="/billing" className={styles.link}>
              Manage billing
            </Link>
          )}
        </Card>
      </div>

      <PlayerDashboard />
      {user.isHost && <HostDashboard />}

      <Card className={styles.section}>
        <CardHeader title="Your tournaments" subtitle="Everything you host or compete in." />
        {tournaments.isPending ? (
          <LoadingState label="Loading your tournaments" rows={1} />
        ) : tournaments.isError ? (
          <ErrorState error={tournaments.error} onRetry={() => tournaments.refetch()} />
        ) : tournaments.data.tournaments.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            body="Enter a tournament and it shows up here."
            action={
              <ButtonLink variant="primary" to="/tournaments">
                Browse tournaments
              </ButtonLink>
            }
          />
        ) : (
          <div className={styles.tournaments}>
            {tournaments.data.tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </Card>

      <NotificationPreferences />
    </PageShell>
  )
}
