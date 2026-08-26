import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMyTransactions } from '/src/api/users.js'
import { listMyTournaments, tournamentKeys } from '/src/api/tournaments.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { TournamentCard } from '/src/features/tournaments/TournamentCard.jsx'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
} from '/src/components/ui/index.js'
import { formatDateTime } from '/src/lib/format.js'
import './profile.css'

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

      <div className="profile__grid">
        <Card>
          <p className="profile__stat-label">Credits</p>
          <p className="profile__stat-value">{user.credits}</p>
          <Link to="/credits" className="profile__link">
            Buy more
          </Link>
        </Card>

        <Card>
          <p className="profile__stat-label">Account</p>
          <div className="profile__badges">
            <Badge tone={user.isHost ? 'accent' : 'neutral'}>
              {user.isHost ? 'Host' : 'Player'}
            </Badge>
            {user.isAdmin && <Badge tone="warning">Administrator</Badge>}
          </div>
          {!user.isHost && (
            <Link to="/become-host" className="profile__link">
              Become a host
            </Link>
          )}
        </Card>
      </div>

      <Card className="profile__section">
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
              <Link className="btn btn--primary btn--md" to="/tournaments">
                Browse tournaments
              </Link>
            }
          />
        ) : (
          <div className="tournament-grid">
            {tournaments.data.tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </Card>

      <Card className="profile__section">
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
              <Link className="btn btn--primary btn--md" to="/credits">
                Buy credits
              </Link>
            }
          />
        ) : (
          <table className="profile__ledger">
            <caption className="visually-hidden">Your credit history, newest first</caption>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">What</th>
                <th scope="col" className="profile__amount">
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
                    <span className="profile__ledger-kind">
                      {TRANSACTION_LABELS[entry.type] ?? entry.type}
                    </span>
                    {entry.description && (
                      <span className="profile__ledger-detail">{entry.description}</span>
                    )}
                  </td>
                  {/* The sign is the whole point of the row, so it is never dropped. */}
                  <td
                    className={`profile__amount ${entry.amount >= 0 ? 'profile__amount--in' : 'profile__amount--out'}`}
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
