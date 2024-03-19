import Nav from '/src/components/Nav.jsx'
import Main from './components/Main.jsx'

import './styles/App.css'
import { useEffect, useState } from 'react'

const URL = 'https://api.npoint.io/068f428eae9b782655fe'

function App() {

  const [teams, setTeams] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)

  const fetchTeams = async () => {
    await fetch(URL)
    .then(res => res.json())
    .then(data => {
      setTeams(data)
      setLoadingTeams(false)
    })
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  return (
    <>
      <Nav />
      <Main
        teams={[]}
        loadingTeams={loadingTeams}
      />
    </>
  )
}

export default App