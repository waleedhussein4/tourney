import './App.css';
import { AuthContext } from '../../context/AuthContext';
import { useRef, useState, useContext, useEffect } from "react";
import { useSignup } from "./useSignup";
import { useLocation, useNavigate } from "react-router-dom";
import Nav from '../../components/Nav';
import validator from 'validator';

function Signup() {
  const { loggedIn } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signup, isLoading, error] = useSignup(location.state);

  const errorDiv = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validator.isEmail(email)) {
      errorDiv.current.textContent = "Invalid email!";
      return;
    }
    if (!validator.isAlphanumeric(username) || username.length < 3 || username.length > 12) {
      errorDiv.current.textContent = "Username must be between 3 and 12 alphanumeric characters long.";
      return;
    }
    if (password !== confirmPassword) {
      errorDiv.current.textContent = "Passwords must match.";
      return;
    }
    if (password.length < 8) {
      errorDiv.current.textContent = "Password must be at least 8 characters long.";
      return;
    }

    errorDiv.current.textContent = "";

    try {
      await signup(email, username, password);
    } catch (err) {
      errorDiv.current.textContent = err.message;
    }
  };

  useEffect(() => {
    if (loggedIn) {
      navigate('/');
    }
  }, [loggedIn, navigate]);

  return (
    <div id="Signup">
      <Nav />
      <div className="container">
        <div className="container-center">
          <form onSubmit={handleSubmit}>
            <h2>Sign up</h2>
            <p>Email</p>
            <input
              type="email"
              id="email"
              placeholder="Enter an email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p>Username</p>
            <input
              type="text"
              placeholder="Enter a username"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <p>Password</p>
            <input
              type="password"
              placeholder="Enter a password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p>Confirm Password</p>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <input type="submit" disabled={isLoading} value="Create Account" id="submit" />
            {error && <div className="error">{error}</div>}
          </form>
          <div className="error" ref={errorDiv}></div>
          <span id="account">Already have an account? <a href="/signin/">Sign In</a></span>
        </div>
      </div>
    </div>
  );
}

export default Signup;
