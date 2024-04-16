import Nav from '/src/components/Nav.jsx'
import './styles/App.css'
import crown from './assets/crown.webp'

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
      {loadingTeam
      ? <div id="main">
          <h1>LOADING ...</h1>
        </div>
      : <div id="main">
          <div id="team">
            <h1>{team.name}</h1>
            <div className="members">
              <span>Members</span>
              { team.members.map((member) => <Member key={member.username} member={member} team={team} />) }
            </div>
            { team.isLeader ? <button onClick={deleteTeam} className="deleteTeam">Delete Team</button> : <button onClick={leaveTeam} className="leaveTeam">Leave Team</button> }
          </div>
        </div>
      }
    </div>
  )
}

function Member({ member, team }) {
  const isLeader = team.leader == member.username
  return (
    <div className="member" onMouseEnter={showButton} onMouseLeave={hideButton}>
      <div className="nameWrapper">
        <span className="name">{member.username}</span>
        { isLeader ? <img className='crown' src={crown} alt="" /> : <></> }
      </div>
      <div className="buttonsWrapper">
        { team.isLeader && !isLeader ? (
          <>
            <button onClick={kickMember} className='kickButton'>Kick</button>
            <button onClick={promoteMember} className="promoteButton">Transfer Leadership</button>
          </>
        ) : <></>}
        
      </div>
    </div>
  )
}

function showButton(event) {
  let buttons = event.target.querySelectorAll('.buttonsWrapper button')
  Array.from(buttons).forEach(btn => btn.style.display = 'inline-block')
}

function hideButton(event) {
  let buttons = event.target.querySelectorAll('.buttonsWrapper button')
  Array.from(buttons).forEach(btn => btn.style.display = 'none')
}

async function deleteTeam() {
  const paramUUID = new URLSearchParams(window.location.search).get("UUID");
  const URL = 'http://localhost:2000/api/team/delete/' + paramUUID

  await fetch(URL, {
    method: 'DELETE',
    credentials: 'include'
  })
  window.location.href = '/team'
}

function leaveTeam() {
  const paramUUID = new URLSearchParams(window.location.search).get("UUID");
  const URL = 'http://localhost:2000/api/team/leave/' + paramUUID

  fetch(URL, {
    method: 'POST',
    credentials: 'include'
  })
  .then(res => {
    if(res.ok) {
      window.location.href = '/team'
    }
  })
}

function kickMember() {

}

function promoteMember() {

}

export default App