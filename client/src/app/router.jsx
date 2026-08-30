import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute, GuestRoute, HostRoute, ProtectedRoute } from '/src/routes/guards.jsx'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { LoadingState } from '/src/components/ui/index.js'
import { SignInPage } from '/src/features/auth/SignInPage.jsx'
import { SignUpPage } from '/src/features/auth/SignUpPage.jsx'
import { HomePage } from '/src/features/home/HomePage.jsx'
import { BrowsePage } from '/src/features/tournaments/BrowsePage.jsx'
import { TournamentPage } from '/src/features/tournaments/TournamentPage.jsx'
import { BecomeHostPage } from '/src/features/host/BecomeHostPage.jsx'
import { TeamsPage } from '/src/features/teams/TeamsPage.jsx'
import { TeamPage } from '/src/features/teams/TeamPage.jsx'
import { JoinTeamPage } from '/src/features/teams/JoinTeamPage.jsx'
import { CreditsPage } from '/src/features/credits/CreditsPage.jsx'
import { CheckoutPage } from '/src/features/credits/CheckoutPage.jsx'
import { ProfilePage } from '/src/features/profile/ProfilePage.jsx'
import { AdminPage } from '/src/features/admin/AdminPage.jsx'
import { NotFoundPage } from '/src/features/misc/NotFoundPage.jsx'

/**
 * The two host-only pages are split out of the main bundle.
 *
 * Both render the rich text editor, and Quill is 216 kB on its own — a quarter
 * of what the client used to ship to every visitor, to serve the two screens
 * only a host ever opens. Nothing else in the app imports it, so a dynamic
 * import here is enough to move the whole thing behind these routes.
 *
 * The rest of the routes stay eager on purpose. They are small application
 * code, already parsed by the time anyone navigates, and splitting them would
 * buy a few kilobytes at the cost of a network round trip in the middle of
 * every first navigation.
 */
const CreateTournamentPage = lazy(() =>
  import('/src/features/host/CreateTournamentPage.jsx').then((module) => ({
    default: module.CreateTournamentPage,
  }))
)
const ManagePage = lazy(() =>
  import('/src/features/manage/ManagePage.jsx').then((module) => ({ default: module.ManagePage }))
)

/**
 * Shown while a split route's chunk is in flight. It is the page shell the
 * route would have rendered anyway, so the nav does not disappear and the
 * layout does not jump when the real page arrives.
 */
function RouteFallback() {
  return (
    <PageShell>
      <LoadingState label="Loading" rows={3} />
    </PageShell>
  )
}

/**
 * Every route in the app, and who is allowed to see it.
 *
 * Access is declared here rather than checked inside each page, so a page cannot
 * forget — and cannot render its signed-in content for a frame before deciding
 * it should not have.
 */
export function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public — a guest can browse the whole catalogue. */}
        <Route path="/" element={<HomePage />} />
        <Route path="/tournaments" element={<BrowsePage />} />
        <Route path="/tournament/:UUID" element={<TournamentPage />} />
        <Route path="/credits" element={<CreditsPage />} />

        {/* Signed out only. */}
        <Route element={<GuestRoute />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Route>

        {/* Signed in. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/team/view" element={<TeamPage />} />
          <Route path="/team/join/:teamCode" element={<JoinTeamPage />} />
          <Route path="/purchase/:product" element={<CheckoutPage />} />
          <Route path="/become-host" element={<BecomeHostPage />} />
        </Route>

        {/* Hosts. */}
        <Route element={<HostRoute />}>
          <Route path="/host" element={<CreateTournamentPage />} />
          <Route path="/tournament/:UUID/manage" element={<ManagePage />} />
        </Route>

        {/* Administrators. */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* The team list used to live at /team; keep old links working. */}
        <Route path="/team" element={<Navigate to="/teams" replace />} />

        <Route path="/page-not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/page-not-found" replace />} />
      </Routes>
    </Suspense>
  )
}
