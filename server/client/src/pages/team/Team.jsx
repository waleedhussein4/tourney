import Nav from '/src/components/Nav.jsx'
import Main from './components/Main.jsx'

import './styles/App.css'

import { useEffect, useState } from 'react'

const URL = 'http://localhost:2000/api/team'

function Team() {

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
      console.log(data)
    })
  }

  useEffect(() => {
    fetchTeams()
  }, [])

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