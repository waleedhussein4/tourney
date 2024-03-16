import LOGO1 from "../assets/LOGO1.jpg";
import profilePic from "../assets/profilePic.png";

function Nav() {
  return (
    <div id="nav">
      {/* <img id="menu" src={menu} alt="" /> */}
      <a href="/">
        <img id="logo-nav" src={LOGO1} alt="Logo" />
      </a>
      <div id="options">
        <a href="/host/">Host</a>
        <a href="/tournaments/">Compete</a>
        <a href="/team/">Team</a>
      </div>
      <div id="account">
        {/* <a href="index.html">
          <img src={profilePic} alt="Profile Icon" className="profilePic" />
        </a> */}
        <span>
          <a href="/signin/">Sign In</a>
        </span>
        <span> | </span>
        <span>
          <a href=" /signup/">Sign Up</a>
        </span>
      </div>
    </div>
  );
}

export default Nav;
