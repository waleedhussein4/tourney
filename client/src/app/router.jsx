import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute, GuestRoute, HostRoute, ProtectedRoute } from '/src/routes/guards.jsx'
import { SignInPage } from '/src/features/auth/SignInPage.jsx'
import { SignUpPage } from '/src/features/auth/SignUpPage.jsx'
import { ProfilePage } from '/src/features/profile/ProfilePage.jsx'
import { NotFoundPage } from '/src/features/misc/NotFoundPage.jsx'
import { HomePage } from '/src/features/home/HomePage.jsx'
import { BrowsePage } from '/src/features/tournaments/BrowsePage.jsx'
import { TournamentPage } from '/src/features/tournaments/TournamentPage.jsx'

// Legacy pages, replaced one feature at a time. Each import disappears with the
// PR that rewrites the page behind it.
import Host from '/src/pages/host/host.jsx'
import Manage from '/src/pages/manage/Manage.jsx'
import Team from '/src/pages/team/Team.jsx'
import ViewTeam from '/src/pages/team/view/View.jsx'
import JoinTeam from '/src/pages/team/join/Join.jsx'
import Credits from '/src/pages/credits/Credits.jsx'
import Purchase from '/src/pages/purchase/Purchase.jsx'
import BecomeHost from '/src/pages/BecomeHost/BecomeHost.jsx'
import Admin from '/src/pages/admin/Admin.jsx'

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
      <Route path="/credits" element={<Credits />} />

      {/* Signed out only. */}
      <Route element={<GuestRoute />}>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      {/* Signed in. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/teams" element={<Team />} />
        <Route path="/team/view" element={<ViewTeam />} />
        <Route path="/team/join/:teamCode" element={<JoinTeam />} />
        <Route path="/purchase/:product?" element={<Purchase />} />
        <Route path="/become-host" element={<BecomeHost />} />
      </Route>

      {/* Hosts. */}
      <Route element={<HostRoute />}>
        <Route path="/host" element={<Host />} />
        <Route path="/tournament/:UUID/manage" element={<Manage />} />
      </Route>

      {/* Administrators. */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<Admin />} />
      </Route>

      {/* The team list used to live at /team; keep old links working. */}
      <Route path="/team" element={<Navigate to="/teams" replace />} />

      <Route path="/page-not-found" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/page-not-found" replace />} />
    </Routes>
  )
}
