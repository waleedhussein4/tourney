import Nav from '/src/components/Nav.jsx'
import Main from './components/Main.jsx'

import './styles/App.css'

import { useState, useEffect } from 'react'

const paramUUID = new URLSearchParams(window.location.search).get("UUID");
const teamURL = 'http://localhost:2000/api/team/view/' + paramUUID

function App() {

  const [team, setTeam] = useState({})
  const [loadingTeam, setLoadingTeam] = useState(true)

  const fetchTeam = async () => {
    await fetch(teamURL,
      {
        method: 'GET',
        credentials: 'include'
      }
    )
    .then(res => res.json())
    .then(data => {
      setTeam(data)
      setLoadingTeam(false)
      console.log(data)
    })
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  return (
    <div id='ViewTeam'>
      <Nav />
      <Main
        team={team}
        loadingTeam={loadingTeam}
      />
    </div>
  )
}

export default App