import Nav from '/src/components/Nav.jsx'
import Main from './components/Main.jsx'

import './styles/App.css'

import { useState, useEffect } from 'react'

const teamURL = 'https://api.npoint.io/210cd82412e3a35bc6e2'
const membersURL = 'https://api.npoint.io/f04f5eb3c2a4f955edcc'

function App() {

  const [team, setTeam] = useState({})
  const [loadingTeam, setLoadingTeam] = useState(true)
  
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  const fetchTeam = async () => {
    await fetch(teamURL)
    .then(res => res.json())
    .then(data => {
      setTeam(data)
      setLoadingTeam(false)
    })
  }
  
  const fetchMembers = async () => {
    await fetch(membersURL)
    .then(res => res.json())
    .then(data => {
      setMembers(data)
      setLoadingMembers(false)
    })
  }

  useEffect(() => {
    fetchTeam()
    fetchMembers()
  }, [])

  return (
    <div id='ViewTeam'>
      <Nav />
      <Main
        team={team}
        loadingTeam={loadingTeam}
        members={members}
        loadingMembers={loadingMembers}
      />
    </div>
  )
}

export default App