import '../signin/App.css'
import Signup from './Signup'
import  authContext  from './authContext'
function App() {
  return (
    <authContext>
    <Signup /></authContext>
  )
}

export default App
