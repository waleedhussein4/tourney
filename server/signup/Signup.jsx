import React, { useRef, useState } from "react";
import axios from "axios"; 

export default function Signup(props) {
  const myDiv = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailTester = /^(\w{4,16})@(\w{2,10}(\.\w{2,10})*)\.((com)|(net)|(org)|(edu)|(lb))$/.test(email);
    const userNameTester = /^[a-zA-Z]+ [a-zA-Z]+$/.test(userName); 
    const passwordCheck = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(.{8,})$/.test(password);
    
    if (!emailTester) {
      myDiv.current.textContent = "Invalid email!";
      return false;
    } else if (!userNameTester) {
      myDiv.current.textContent = "Username must exist";
      return false;
    } else if (!passwordCheck) {
      myDiv.current.textContent = "Invalid password!";
      return false;
    } else if (confirmPassword !== password) {
      myDiv.current.textContent = "confirmPassword must match the password";
      return false;
    } else {
      try {
        myDiv.current.textContent = ""; 

        
        const response = await axios.post("Localhost2000:/api/user/signup", {
          email,
          userName,
          password,
          confirmPassword
        });

        
        console.log(response.data); 
      } catch (error) {
        console.error("Error sending form data:", error);
        myDiv.current.textContent = "An error occurred while processing your request. Please try again later.";
      }
    }
  };

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
          <input type="submit" value="Signup" id='submit'></input>
        </form>
       
        <div id="error" ref={myDiv}></div>
        <button onClick={()=>props.onFormSwitch('Login')}>Already have an account? Login</button>
      </div>
    </div>
  )
}
