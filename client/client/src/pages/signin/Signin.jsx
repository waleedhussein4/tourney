import './App.css'
import '/src/styles/index.css'
import { AuthContextProvider } from './authContext'
import { useRef, useState, useEffect } from "react";
import {useLogin} from './useLogin'

function Signin() {
  return (
    <AuthContextProvider>
      <Login />
    </AuthContextProvider>
  )
}

function Login(props) {
  const myDiv = useRef(null);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const[login , error , isLoading]= useLogin();

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
    console.log(rememberPassword)
    await login(email , pass)
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
    <div id="Signin">
      <div className='container'>
        <div className='container-center'>
          <form onSubmit={handleSubmit}>
            <h2>Login</h2>
            <p>Username or email</p>
            <input type="text" id="username" placeholder='Enter a username or an email' onChange={(e) => setEmail(e.target.value)}></input>
            <p>Password</p>
            <input type="password" id="password" placeholder='Enter a password' value={pass} onChange={(e) => setPass(e.target.value)}></input>
            <div id="rememberPassword"><input type="checkbox" checked={rememberPassword} onChange={handleRememberPasswordChange}></input> Remember password</div>
            <input type="submit" value="Login" disabled={isLoading} id='submit'></input>
            {error && <div>{error}</div>}
            </form>
          <div id="error" ref={myDiv}></div>
          <span id="account">Don't have an account? <a href="/signup/">Sign up</a></span>
        </div>
      </div>
    </div>
  )
}


export default Signin
