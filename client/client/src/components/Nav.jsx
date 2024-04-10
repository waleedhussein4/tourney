import { useContext } from 'react';
import { Link } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext';

import '/src/styles/Nav.css'
import LOGO1 from "../assets/LOGO1.jpg";
import profilePic from "../assets/profilePic.png";
import LogOutButton from './LogOutButton';

function Nav() {
  const { loggedIn } = useContext(AuthContext)

  return (
    <div id="nav">
      <Link to="/">
        <img id="logo-nav" src={LOGO1} alt="Logo" />
      </Link>
      <div id="options">
        <a href="/host/">Host</a>
        <a href="/tournaments/">Compete</a>
        <a href="/team/">Teams</a>
      </div>
      <div id="account">
        { loggedIn === true && 
          <>
          <Link to="/profile">
            <img src={profilePic} alt="Profile Icon" className="profilePic" />
          </Link>
          <LogOutButton />
          </>
        }
        { loggedIn === false && 
          <>
          <span>
            <Link to="/signin">Sign In</Link>
          </span>
          <span> | </span>
          <span>
            <Link to="/signup">Sign Up</Link>
          </span>
          </>
        }
      </div>
    </div>
  );
}

export default Nav;
