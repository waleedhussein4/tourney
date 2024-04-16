/* eslint-disable react/prop-types */
function Main({ teams, loadingTeams }) {
  return (
    <>
      <div id="main">
        { (loadingTeams) ? <h1>LOADING ...</h1>
        :
        Array.from(teams).length > 0 ? <MyTeams teams={teams} /> : <Suggest teams={teams} /> }
      </div>
    </>
  )
}


function MyTeams({ teams }) {
  return (
    <div id="display">
      <h1>My Teams</h1>
      <div className="teams">
        {teams.map((team) => <Team key={team.UUID} team={team} />)}
      </div>
      <div className="create">
        <h2>Create a team</h2>
        <div id="createTeam" className="form">
          <label htmlFor="teamName">Team name </label>
          <input type="text" id="teamName" />
          <button onClick={createTeam}>Create</button>
        </div>
      </div>
    </div>
  )
}

function Team({ team }) {
  let teamLink = `/team/view/?UUID=${team.UUID}`
  return (
    <div className="team">
      <h3 className="name"><a href={teamLink}>{team.name}</a></h3>
      <button className="view" onClick={() => {location.href = teamLink}}>View</button>
    </div>
  )
}

function Suggest() {
  return (
    <div id="suggest">
      <h1>You are not part of any teams ... yet.</h1>
      <div className="join">
        <h2>Join a team</h2>
        <div id="joinTeam" className="form">
          <label htmlFor="teamLink">Enter team ID </label>
          <input type="text" id="teamLink" />
          <button>Join</button>
        </div>
      </div>
      <div className="create">
        <h2>Create a team</h2>
        <div id="createTeam" className="form">
          <label htmlFor="teamName">Team name </label>
          <input type="text" id="teamName" />
          <button onClick={createTeam}>Create</button>
        </div>
      </div>
    </div>
  )
}

async function createTeam() {
  const URL = 'http://localhost:2000/api/team/create'
  let teamName = document.getElementById('teamName').value
  console.log("Creating team: ", teamName)

  await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: teamName }),
    credentials: 'include'
  })
  .then(res => {
    if(res.ok) {
      window.location.reload()
    }
  })
}

export default Main