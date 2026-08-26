import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home/Home";
import Tournaments from "./pages/tournaments/Tournaments";
import Team from "./pages/team/Team";
import ViewTeam from "./pages/team/view/View";
import JoinTeam from "./pages/team/join/Join";
import Signin from "./pages/signin/Signin";
import Signup from "./pages/signup/Signup";
import Purchase from "./pages/purchase/Purchase.jsx";
import Tournament from "./pages/tournament/Tournament";
import Profile from "./pages/profile/Profile.jsx";
import Host from "./pages/host/host";
import Manage from "./pages/manage/Manage";
import BecomeHost from "./pages/BecomeHost/BecomeHost";
import Credits from "./pages/credits/Credits.jsx";
import Admin from "./pages/admin/Admin";
import NotFound from "./pages/notfound/notfound";

import "/src/styles/index.css";

function App() {
  return (
    <Routes>
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/" element={<Home />} />
      <Route path="/tournaments" element={<Tournaments />} />
      <Route path="/team" element={<Team />} />
      <Route path="/team/view" element={<ViewTeam />} />
      <Route path="/purchase/:product?" element={<Purchase />} />
      <Route path="/team/join/:teamCode" element={<JoinTeam />} />
      <Route path="/tournament/:UUID?" element={<Tournament />} />
      <Route path="/host" element={<Host />} />
      <Route path="/tournament/:UUID/manage" element={<Manage />} />
      <Route path="/credits" element={<Credits />} />
      <Route path="/become-host" element={<BecomeHost />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/page-not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/page-not-found" replace />} /> 
    </Routes>
  );
}

export default App;
