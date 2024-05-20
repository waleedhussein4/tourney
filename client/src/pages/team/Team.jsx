import Nav from '/src/components/Nav.jsx'
import Main from './components/Main.jsx'

import './styles/App.css'

import { useEffect, useState, useContext } from 'react'
import AuthContext from '../../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

const URL = `${import.meta.env.VITE_BACKEND_URL}/api/team/user`

function Team() {

  const { loggedIn } = useContext(AuthContext)
  const navigate = useNavigate()

  const [teams, setTeams] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)

  const fetchTeams = async () => {
    await fetch(URL, {
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      setTeams(data)
      setLoadingTeams(false)
    })
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (loggedIn === undefined) return
    if (!loggedIn) {
      navigate('/signin')
    }
  }, [loggedIn])

  return (
    <div id='Team'>
      <Nav />
      <Main
        teams={teams}
        loadingTeams={loadingTeams}
      />
    </div>
  )
}

export default Team