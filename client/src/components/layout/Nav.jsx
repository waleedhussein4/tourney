import { NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '/src/features/auth/useAuth.js'
import { Logo } from '/src/components/brand/index.js'
import { Button } from '/src/components/ui/index.js'
import styles from './Nav.module.css'

const LINKS = [
  { to: '/tournaments', label: 'Browse' },
  { to: '/teams', label: 'Teams' },
]

export function Nav() {
  const { user, isLoading, isHost, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await logout()
      toast.success('Signed out')
      navigate('/')
    } catch {
      toast.error('Could not sign out. Please try again.')
    }
  }

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} aria-label="Tourney — home">
          <Logo size="sm" />
        </NavLink>

        <nav className={styles.links} aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={styles.link}>
              {link.label}
            </NavLink>
          ))}
          {isHost && (
            <NavLink to="/host" className={styles.link}>
              Host
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={styles.link}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className={styles.account}>
          {/* Nothing is rendered until the identity is known, so the bar never
              flashes "Sign in" at someone who is already signed in. */}
          {isLoading ? null : user ? (
            <>
              <NavLink to="/credits" className={styles.credits}>
                <span className={styles.creditsValue}>{user.credits}</span>
                <span className={styles.creditsLabel}>credits</span>
              </NavLink>
              <NavLink to="/profile" className={styles.link}>
                {user.username}
              </NavLink>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/signin" className={styles.link}>
                Sign in
              </NavLink>
              <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
