import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMyTransactions } from '/src/api/users.js'
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
import { formatDateTime } from '/src/lib/format.js'
import styles from './profile.module.css'

/** How each kind of ledger row reads to the person it happened to. */
const TRANSACTION_LABELS = {
  purchase: 'Bought credits',
  entry_fee: 'Tournament entry',
  bank_deposit: 'Added to a prize bank',
  payout: 'Prize payout',
  host_upgrade: 'Host upgrade',
  refund: 'Refund',
}

export function ProfilePage() {
  // The route guard has already established there is a user here.
  const { user } = useAuth()

  const transactions = useQuery({
    queryKey: ['transactions', 'mine'],
    queryFn: () => getMyTransactions(50),
  })

  const tournaments = useQuery({
    queryKey: tournamentKeys.mine,
    queryFn: listMyTournaments,
  })

  return (
    <PageShell>
      <PageHeader title={user.username} description={user.email} />

      <div className={styles.grid}>
        <Card>
          <p className={styles.statLabel}>Credits</p>
          <p className={styles.statValue}>{user.credits}</p>
          <Link to="/credits" className={styles.link}>
            Buy more
          </Link>
        </Card>

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
        </Card>
      </div>

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

      <Card className={styles.section}>
        <CardHeader
          title="Credit history"
          subtitle="Every credit that has moved in or out of your account."
        />
        {transactions.isPending ? (
          <LoadingState label="Loading your history" rows={2} />
        ) : transactions.isError ? (
          <ErrorState error={transactions.error} onRetry={() => transactions.refetch()} />
        ) : transactions.data.transactions.length === 0 ? (
          <EmptyState
            title="No activity yet"
            body="Buying credits or entering a tournament will show up here."
            action={
              <ButtonLink variant="primary" to="/credits">
                Buy credits
              </ButtonLink>
            }
          />
        ) : (
          <table className={styles.ledger}>
            <caption className="visually-hidden">Your credit history, newest first</caption>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">What</th>
                <th scope="col" className={styles.amount}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.data.transactions.map((entry) => (
                <tr key={entry._id}>
                  <td>
                    <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
                  </td>
                  <td>
                    <span className={styles.ledgerKind}>
                      {TRANSACTION_LABELS[entry.type] ?? entry.type}
                    </span>
                    {entry.description && (
                      <span className={styles.ledgerDetail}>{entry.description}</span>
                    )}
                  </td>
                  {/* The sign is the whole point of the row, so it is never dropped. */}
                  <td
                    className={`${styles.amount} ${entry.amount >= 0 ? styles.amountIn : styles.amountOut}`}
                  >
                    {entry.amount >= 0 ? '+' : ''}
                    {entry.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </PageShell>
  )
}
