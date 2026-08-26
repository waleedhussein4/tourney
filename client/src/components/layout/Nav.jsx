import { NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '/src/features/auth/useAuth.js'
import { Button } from '/src/components/ui/index.js'
import './Nav.css'

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
    <header className="nav">
      <div className="nav__inner">
        <NavLink to="/" className="nav__brand">
          Tourney
        </NavLink>

        <nav className="nav__links" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav__link">
              {link.label}
            </NavLink>
          ))}
          {isHost && (
            <NavLink to="/host" className="nav__link">
              Host
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className="nav__link">
              Admin
            </NavLink>
          )}
        </nav>

        <div className="nav__account">
          {/* Nothing is rendered until the identity is known, so the bar never
              flashes "Sign in" at someone who is already signed in. */}
          {isLoading ? null : user ? (
            <>
              <NavLink to="/credits" className="nav__credits">
                <span className="nav__credits-value">{user.credits}</span>
                <span className="nav__credits-label">credits</span>
              </NavLink>
              <NavLink to="/profile" className="nav__link">
                {user.username}
              </NavLink>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/signin" className="nav__link">
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
