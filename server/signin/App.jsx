import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login from './Login'
import Signup from './Signup'
function App() {
  const[currentForm , setCurrentForm]  = useState('Login');
  const toggleform = (formName)=>{
    setCurrentForm(formName);
  }
  return (
  
    <div >{
      currentForm ==='Login'?<Login onFormSwitch={toggleform}/> : <Signup onFormSwitch={toggleform}/> 
      }
   
    </div>
  )
}

export default App
