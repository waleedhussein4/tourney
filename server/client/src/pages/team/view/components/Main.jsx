/* eslint-disable react/prop-types */
import crown from '../assets/crown.webp'

const userIsLeader = true

function Main({team, loadingTeam }) {

  if(loadingTeam) {
    return (
      <div id="main">
        <h1>LOADING ...</h1>
      </div>
    )
  }

  else {
    return (
      <div id="main">
        <div id="team">
          <h1>{team.name}</h1>
          <div className="members">
            <span>Members</span>
            { team.members.map((member) => <Member key={member.username} member={member} team={team} />) }
          </div>
          { userIsLeader ? <button onClick={deleteTeam} className="deleteTeam">Delete Team</button> : <button onClick={leaveTeam} className="leaveTeam">Leave Team</button> }
        </div>
      </div>
    )
  }
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
        { userIsLeader && !isLeader ? (
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

export default Main