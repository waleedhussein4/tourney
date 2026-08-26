import { Link } from 'react-router-dom'
import { useAuth } from '/src/features/auth/useAuth.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Badge, Card } from '/src/components/ui/index.js'
import './profile.css'

/**
 * The signed-in user's own page.
 *
 * The identity half; the transaction history and hosted tournaments arrive with
 * the rest of the account features.
 */
export function ProfilePage() {
  // The guard guarantees a user here, so there is no loading branch to write.
  const { user } = useAuth()

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
    </PageShell>
  )
}
