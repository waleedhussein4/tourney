<<<<<<< HEAD
import { Route, Router, Routes } from "react-router-dom";
=======
import { useContext } from "react";
import { Route, Routes } from "react-router-dom";

import AuthContext from "./context/AuthContext.jsx";

>>>>>>> bad2fedd7b36171cb8a6c100e4e4ed5bf2401d55
import Home from './pages/home/Home';
import Tournaments from './pages/tournaments/Tournaments'
import Team from './pages/team/Team'
import ViewTeam from './pages/team/view/View'
import Signin from "./pages/signin/Signin";
import Signup from "./pages/signup/Signup";
import Tournament from './pages/tournament/Tournament'
<<<<<<< HEAD
import Host from './pages/host/host';

=======
import Profile from './pages/profile/Profile.jsx'
>>>>>>> bad2fedd7b36171cb8a6c100e4e4ed5bf2401d55

import '/src/styles/index.css'

function App() {

  const { loggedIn } = useContext(AuthContext)

  return (
    <Routes>
      { loggedIn === false &&
        <>
        <Route path='/signin' element={<Signin />} />
        <Route path='/signup' element={<Signup />} />
        </>
      }
      { loggedIn === true &&
        <>
        <Route path='/profile' element={<Profile />} />
        </>
      }
      <Route path='/' element={<Home />} />
      <Route path='/tournaments' element={<Tournaments />} />
      <Route path='/team' element={<Team />} />
      <Route path='/team/view' element={<ViewTeam />} />
      <Route path='/tournament' element={<Tournament />} />
      <Route path='/host' element={<Host/>} />
    </Routes>
  );
}

export default App;
