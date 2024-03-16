import './App.css'
import Login from './Login'
import '/src/styles/index.css'
import  authContext  from './authContext'

function App() {
  return (
    <authContext>
    <Login />
    </authContext>
  )
}

export default App
