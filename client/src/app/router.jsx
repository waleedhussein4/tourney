import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute, GuestRoute, HostRoute, ProtectedRoute } from '/src/routes/guards.jsx'
import { SignInPage } from '/src/features/auth/SignInPage.jsx'
import { SignUpPage } from '/src/features/auth/SignUpPage.jsx'
import { HomePage } from '/src/features/home/HomePage.jsx'
import { BrowsePage } from '/src/features/tournaments/BrowsePage.jsx'
import { TournamentPage } from '/src/features/tournaments/TournamentPage.jsx'
import { CreateTournamentPage } from '/src/features/host/CreateTournamentPage.jsx'
import { BecomeHostPage } from '/src/features/host/BecomeHostPage.jsx'
import { ManagePage } from '/src/features/manage/ManagePage.jsx'
import { TeamsPage } from '/src/features/teams/TeamsPage.jsx'
import { TeamPage } from '/src/features/teams/TeamPage.jsx'
import { JoinTeamPage } from '/src/features/teams/JoinTeamPage.jsx'
import { CreditsPage } from '/src/features/credits/CreditsPage.jsx'
import { CheckoutPage } from '/src/features/credits/CheckoutPage.jsx'
import { ProfilePage } from '/src/features/profile/ProfilePage.jsx'
import { AdminPage } from '/src/features/admin/AdminPage.jsx'
import { NotFoundPage } from '/src/features/misc/NotFoundPage.jsx'

/**
 * Every route in the app, and who is allowed to see it.
 *
 * Access is declared here rather than checked inside each page, so a page cannot
 * forget — and cannot render its signed-in content for a frame before deciding
 * it should not have.
 */
export function Router() {
  return (
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
  )
}
