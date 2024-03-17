import '../signin/App.css'
import Signup from './Signup'
import  { AuthContextProvider }  from './authContext'
function App() {
  return (
    <AuthContextProvider>
    <Signup />
    </AuthContextProvider>
  )
}

export default App
