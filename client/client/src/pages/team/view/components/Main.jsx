import crown from '../assets/crown.webp'

const userIsLeader = true

function Main(props) {

  if(props.loadingTeam) {
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
          <h1>{props.team.name}</h1>
          <div className="members">
            <span>Members</span>
            { props.loadingMembers ? <h1>Loding team members ...</h1> : props.members.map((member) => <Member key={member.UUID} member={member} team={props.team} />) }
          </div>
          { userIsLeader ? <button className="deleteTeam">Delete Team</button> : <button className="leaveTeam">Leave Team</button> }
        </div>
      </div>
    )
  }

}

function Member(props) {
  const isLeader = props.team.leader == props.member.UUID
  return (
    <div className="member" onMouseEnter={showButton} onMouseLeave={hideButton}>
      <div className="nameWrapper">
        { isLeader ? <img className='crown' src={crown} alt="" /> : <></> }
        <span className="name">{props.member.name}</span>
      </div>
      <div className="buttonsWrapper">
        { userIsLeader && !isLeader ? (
          <>
            <button className='kickButton'>Kick</button>
            <button className="promoteButton">Transfer Leadership</button>
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

export default Main