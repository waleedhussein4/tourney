import { Route, Routes } from "react-router-dom";
import Home from './pages/home/Home';
import Tournaments from './pages/tournaments/Tournaments'
import Team from './pages/team/Team'
import ViewTeam from './pages/team/view/View'
import Signin from "./pages/signin/Signin";
import Signup from "./pages/signup/Signup";
import Tournament from './pages/tournament/Tournament'

import '/src/styles/index.css'

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/tournaments' element={<Tournaments />} />
      <Route path='/team' element={<Team />} />
      <Route path='/team/view' element={<ViewTeam />} />
      <Route path='/signin' element={<Signin />} />
      <Route path='/signup' element={<Signup />} />
      <Route path='/tournament' element={<Tournament />} />
    </Routes>
  );
}

export default App;
