import { useRef, useState, useEffect } from "react";
import axios from "axios";

export default function Login(props) {
  const myDiv = useRef(null);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);

  
  useEffect(() => {
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    if (rememberedPassword) {
      setPass(rememberedPassword);
      setRememberPassword(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(email);
    console.log(pass);
    try {
      myDiv.current.textContent = "";

      const response = await axios.post("http://localhost:2000/api/user/login", {
        email,
        pass,
      });

      console.log(response.data);
    } catch (error) {
      console.error("Error sending form data:", error);
      myDiv.current.textContent = "An error occurred while processing your request. Please try again later.";
    }
  }


  const handleRememberPasswordChange = () => {
    setRememberPassword(!rememberPassword);
    if (!rememberPassword) {
     
      localStorage.setItem('rememberedPassword', pass);
    } else {
     
      localStorage.removeItem('rememberedPassword');
    }
  }

  return (
    <div className='container'>
      <div className='container-center'>
        <form onSubmit={handleSubmit}>
          <h2>Login</h2>
          <p>Username or email</p>
          <input type="text" id="username" placeholder='Enter a username or an email' onChange={(e) => setEmail(e.target.value)}></input>
          <p>Password</p>
          <input type="password" id="password" placeholder='Enter a password' value={pass} onChange={(e) => setPass(e.target.value)}></input>
          <div><input type="checkbox" checked={rememberPassword} onChange={handleRememberPasswordChange}></input> Remember password</div>
          <input type="submit" value="Login" id='submit'></input></form>
        <div id="error" ref={myDiv}></div>
        <span>Don't have an account? <a href="/signup/">Sign up</a></span>
      </div>
    </div>
  )
}
