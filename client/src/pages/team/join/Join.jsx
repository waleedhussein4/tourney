import Nav from '/src/components/Nav.jsx';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import './Join.css'

function Join() {

  const [team, setTeam] = useState({})
  const [loadingTeam, setLoadingTeam] = useState(true)

  let { teamCode } = useParams();

  const navigate = useNavigate()

  const fetchTeam = async () => {
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/team/view/code/` + teamCode
    await fetch(URL,
      {
        method: 'GET',
        credentials: 'include'
      }
    )
    .then(res => res.json())
    .then(data => {
      setTeam(data)
      setLoadingTeam(false)
      if(data.isLeader || data.isMember) {
        navigate('/team/view/?UUID=' + data.UUID)
        navigate(0)
      }
    })
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  async function joinTeam() {
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/team/join/` + teamCode

    await fetch(URL,
      {
        method: 'POST',
        credentials: 'include'
      }
    )
    .then(res => {
      if(res.ok) {
        navigate('/team/view/?UUID=' + team.UUID)
        navigate(0)
      }
    })
  }

  return (
    <div id='JoinTeam'>
      <Nav />
      { loadingTeam
      ? <div id="main">
          <h1>LOADING ...</h1>
        </div>
      : <div id="main">
        { team.message
        ? <h1>Team not found</h1>
        : <>
            <h1>{team.name}</h1>
            <div className="prompt">
              <span>Do you want to join this team?</span>
              <button className='joinBtn' onClick={joinTeam}>Join</button>
            </div>
          </>}
      </div>
      } 
    </div>
  );
}

export default Join