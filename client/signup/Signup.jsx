import { useRef, useState } from "react";
import { useSignup } from "./useSignup";

export default function Signup(props) {
  const myDiv = useRef(null);
  const[signup , error , isLoading]= useSignup()

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailTester = /^(\w{4,16})@(\w{2,10}(\.\w{2,10})*)\.((com)|(net)|(org)|(edu)|(lb))$/.test(email);
    const userNameTester = /^[a-zA-Z0-9]{3,12}$/.test(userName);  
    const passwordCheck = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(.{8,})$/.test(password);
    
    if (!emailTester) {
      myDiv.current.textContent = "Invalid email!";
      return false;
    } else if (!userNameTester) {
      myDiv.current.textContent = "Username must be between 3 and 12 alphanumeric characters long.";
      return false;
    } else if (!passwordCheck) {
      myDiv.current.textContent = "Invalid password!";
      return false;
    } else if (confirmPassword !== password) {
      myDiv.current.textContent = "confirmPassword must match the password";
      return false;
    } else {
      myDiv.current.textContent = "";
      await signup(userName ,email , password)
    }

  const [userName, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="container">
      <div className="container-center">
        <form onSubmit={handleSubmit}>
          <h2>Signup</h2>
          <p>Email</p>
          <input type="text" id="email" placeholder='Enter an email' onChange={(e)=>setEmail(e.target.value)}></input>
          <p>Username</p>
          <input type="text" placeholder='Enter a username' id="username" onChange={(e)=>setUsername(e.target.value)}></input>
          <p>Password</p>
          <input type="password" placeholder='Enter a password' id="password" onChange={(e)=>setPassword(e.target.value)}></input>
          <p>Confirm Password</p>
          <input type="password" id="confirmPassword" placeholder='Confirm your password'onChange={(e)=>setConfirmPassword(e.target.value)} ></input>
          <input type="submit" disabled={isLoading} value="Signup" id='submit'></input>
          {error && <div>{error}</div>}
        </form>
       
        <div id="error" ref={myDiv}></div>
        <span id="account">Already have an account? <a href="/signin/">Login</a></span>
      </div>
    </div>
  )
}
}
