import { useContext } from "react"
import { useNavigate } from 'react-router-dom'
import AuthContext from "../context/AuthContext"

function LogOutButton() {

  const { getLoggedIn } = useContext(AuthContext)

  const navigate = useNavigate()

  async function logOut() {
    await fetch("${import.meta.env.VITE_BACKEND_URL}/api/user/logout", {
      method: "POST",
      credentials: "include"
    })
    getLoggedIn()
    navigate('/')
  }

  return (
    <div id="btn-logout" onClick={logOut}>Log Out</div>
  )
}

export default LogOutButton