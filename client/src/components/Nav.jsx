import logo from '../assets/logo.png'
import menu from '../assets/menu.png'

function Nav() {
  return (
    <div id="nav">
      <img id='menu' src={menu} alt="" />
      <img id='logo-nav' src={logo} alt="" />
      <div id='options'>
        <a href="">Host</a>
        <a href="">Compete</a>
        <a href="">Triumph</a>
      </div>
      <div id="account">
        <span><a href="">Sign In</a></span>
        <span> | </span>
        <span><a href="">Sign Up</a></span>
      </div>
    </div>
  )
}

export default Nav