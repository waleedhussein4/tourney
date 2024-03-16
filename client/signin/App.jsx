import './App.css'
import Login from './Login'
import '/src/styles/index.css'
import { AuthContextProvider } from './authContext'

function App() {
  return (
    <AuthContextProvider>
    <Login />
    </AuthContextProvider>
  )
}

export default App
