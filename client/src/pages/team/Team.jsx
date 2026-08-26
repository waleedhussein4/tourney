import { useAuth } from '/src/features/auth/useAuth.js'
import { Nav } from '/src/components/layout/Nav.jsx'
import Main from './components/Main.jsx'

import './styles/App.css'

import { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'

function Team() {

  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [teams, setTeams] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)

  const fetchTeams = async () => {
    const response = await fetch('/api/teams/mine', { credentials: 'include' })
    const data = response.ok ? await response.json() : { teams: [] }
    setTeams(data.teams)
    setLoadingTeams(false)
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (isAuthenticated === undefined) return
    if (!isAuthenticated) {
      navigate('/signin')
    }
  }, [isAuthenticated])

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