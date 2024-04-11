import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext';

import '/src/styles/Nav.css'
import LOGO1 from "../assets/LOGO1.jpg";
import profilePic from "../assets/profilePic.png";
import LogOutButton from './LogOutButton';

function Nav() {
  const { loggedIn } = useContext(AuthContext)
  const [credits, setCredits] = useState(0);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (loggedIn) {
      fetch("http://localhost:2000/api/user/profile", {
        credentials: "include"
      })
      .then(res => res.json())
      .then(data => {
        setCredits(data.credits);
        setUsername(data.username);
      })
      .catch(err => console.log(err));
    }
  }, [loggedIn]);

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
          <div id='profile'>
            <Link to="/profile">
              <img src={profilePic} alt="Profile Icon" className="profilePic" />
            </Link>
            <div className="user-info">
              <span className="username">{username}</span>
              <span className='user-credits'>Credits: {credits}</span>
            </div>
            <LogOutButton />
          </div>
        }
        { loggedIn === false && 
          <>
          <span>
            <Link 
              to="/signin"
              state={{ from: location.pathname }}
            >
              Sign In
            </Link>
          </span>
          <span> | </span>
          <span>
            <Link to={{pathname:"/signup", state:{ previousLocationPathname: location.pathname }}}>Sign Up</Link>
          </span>
          </>
        }
      </div>
    </div>
  );
}

export default Nav;
