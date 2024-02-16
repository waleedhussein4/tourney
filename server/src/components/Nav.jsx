import logo from '../assets/logo.png'
import menu from '../assets/menu.png'

function Nav() {
  return (
    <div id="nav">
      <img id='menu' src={menu} alt="" />
      <img id='logo-nav' src={logo} alt="" />
      <div id='options'>
        <a href="./host/">Host</a>
        <a href="./tournaments/">Compete</a>
        <a href="./team/">Team</a>
      </div>
      <div id="account">
        <span><a href="./signin/">Sign In</a></span>
        <span> | </span>
        <span><a href="./signup/">Sign Up</a></span>
      </div>
    </div>
  )
}

export default Nav