/* eslint-disable react/prop-types */
import './App.css';
import '/src/styles/index.css';
import { AuthContextProvider } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useLogin } from './useLogin';
import { useLocation } from 'react-router-dom';

function Signin() {
  let location = useLocation();
  
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [login, isLoading, error] = useLogin(location.state);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, pass, rememberPassword);
  };

  const handleRememberPasswordChange = () => {
    setRememberPassword(!rememberPassword);
    if (!rememberPassword) {
      localStorage.setItem('rememberedPassword', pass);
    } else {
      localStorage.removeItem('rememberedPassword');
    }
  };

  useEffect(() => {
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    if (rememberedPassword) {
      setPass(rememberedPassword);
      setRememberPassword(true);
    }
  }, []);

  return (
    <AuthContextProvider>
      <div id="Signin">
        <div className="container">
          <div className="container-center">
            <form onSubmit={handleSubmit}>

              <h2>Sign in</h2>
              <label htmlFor="username">Email</label>
              <input type="text" id="username" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="Enter your password" value={pass} onChange={(e) => setPass(e.target.value)} />
              <div id="rememberPassword">
                <input type="checkbox" checked={rememberPassword} onChange={handleRememberPasswordChange} />
                <label htmlFor="rememberPassword">Remember password</label>
              </div>
              <input type="submit" value="Sign In" disabled={isLoading} className="submit" />
              {error && <div className="error">{error}</div>}
              <div id="account">Don't have an account? <a href="/signup/" style={{ color: '#800080' }}>Sign up</a></div>
            </form>
          </div>
        </div>
      </div>
    </AuthContextProvider>
);

}

export default Signin;