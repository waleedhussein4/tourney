import logo from '../assets/logo.png'
import menu from '../assets/menu.png'

function Nav() {
  return (
    <div id="nav">
      <img id='menu' src={menu} alt="" />
      <img id='logo-nav' src={logo} alt="" />
      <div id='options'>
        <a href="./src/pages/host/host.html">Host</a>
        <a href="./src/pages/tournaments/tournaments.html">Compete</a>
        <a href="">Triumph</a>
      </div>
      <div id="account">
        <span><a href="./src/pages/signin/signin.html">Sign In</a></span>
        <span> | </span>
        <span><a href="./src/pages/signup/signup.html">Sign Up</a></span>
      </div>
    </div>
  )
}

export default Nav