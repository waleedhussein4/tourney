import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '/src/features/auth/useAuth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { LoadingState } from '/src/components/ui/index.js'

/**
 * Route guards.
 *
 * These replace a `useEffect` in every page that redirected on `!loggedIn`.
 * Doing it per page meant each one rendered its signed-in content for a frame
 * first, each one had to remember to check `undefined` before `false`, and
 * several forgot — so the fix belongs at the router, once.
 */

function Checking() {
  return (
    <PageShell>
      <LoadingState label="Checking your session" rows={2} />
    </PageShell>
  )
}

/** Requires a signed-in user. Sends everyone else to sign in. */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <Checking />

  // `state.from` is what SignIn reads to return the visitor to the page they
  // actually asked for, instead of dumping them on the home page.
  if (!isAuthenticated) return <Navigate to="/signin" state={{ from: location }} replace />

  return <Outlet />
}

/** Requires a host account. A signed-in non-host is offered the upgrade. */
export function HostRoute() {
  const { isAuthenticated, isHost, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <Checking />
  if (!isAuthenticated) return <Navigate to="/signin" state={{ from: location }} replace />
  if (!isHost) return <Navigate to="/become-host" replace />

  return <Outlet />
}

/**
 * Requires an administrator.
 *
 * A non-admin gets the 404 rather than a "forbidden" page: the admin area is
 * unlisted, and confirming it exists to everyone who guesses the URL is not
 * useful to them.
 */
export function AdminRoute() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) return <Checking />
  if (!isAdmin) return <Navigate to="/page-not-found" replace />

  return <Outlet />
}

/** Keeps a signed-in visitor away from the sign-in and sign-up pages. */
export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Checking />
  if (isAuthenticated) return <Navigate to="/" replace />

  return <Outlet />
}
