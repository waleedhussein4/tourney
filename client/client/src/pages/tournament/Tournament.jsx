import { useEffect, useState } from "react";
import "./styles/App.css";
import Nav from "/src/components/Nav.jsx";
import alpha_x from '/src/assets/alpha-x.svg';

const paramUUID = new URLSearchParams(window.location.search).get('UUID')
const tournamentURL = `http://localhost:2000/api/tournement/tournament`;
// const tournamentURL = 'https://api.npoint.io/c9523c0ef25065fec8c2';
const teamsURL = 'https://api.npoint.io/06c398320417bddefa14'
const token = 'testToken'

function Tournament() {

  const [tournament, setTournament] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isHost, setIsHost] = useState(false);
  const [applicationAccepted, setApplicationAccepted] = useState(false);
  const [teams, setTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [chosenTeam, setChosenTeam] = useState({uuid:''})
  const [application, setApplication] = useState({})

  const handleJoin = () => {
    console.log("Joining tournament");
    if(tournament.teamSize > 1) {
      displayJoinPopup()
    }
    else {
      joinTournamentAsSolo()
    }
  };

  const handleApply = () => {
    console.log("Applying for tournament");
    displayApplicationPopup()
  };

  const fetchTournamentData = async () => {
    await fetch(tournamentURL + "?" + new URLSearchParams({
      UUID: paramUUID,
      test: "hello"
    }), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setTournament(data)
      setIsLoading(false)
      setIsHost(data.isHost)
      setApplicationAccepted(data.isAccepted)
      setApplication(data.application)
    })
  };

  const fetchTeams = async () => {
    await fetch(teamsURL)
    .then(res => res.json())
    .then(data => {
      setTeams(data)
      setIsLoadingTeams(false)
    })
  }

  useEffect(() => {
    fetchTournamentData()
    fetchTeams()
  }, [])

  function displayJoinPopup() {
    document.querySelector('.joinPopup').style.display = 'flex'
  }

  function hideJoinPopup() {
    document.querySelector('.joinPopup').style.display = 'none'
  }

  function displayApplicationPopup() {
    document.querySelector('.applicationPopup').style.display = 'flex'
  }

  function hideApplicationPopup() {
    document.querySelector('.applicationPopup').style.display = 'none'
  }

  let button

  if(!isHost) {
    if(!tournament.hasStarted && tournament.accessibility === "open") {
      button = <button className="btn btn-primary" onClick={handleJoin}>Join</button>
    }
    else if(!tournament.hasStarted && !applicationAccepted) {
      button = <button className="btn btn-secondary" onClick={handleApply}>Apply</button>
    }
    else if(!tournament.hasStarted && applicationAccepted) {
      button = <button className="btn btn-primary" onClick={handleJoin}>Join</button>
    }
    else {
      button = <></>
    }
  }
  else {
    button = <button className="btn btn-manage" onClick={() => console.log("Manage tournament")}>Manage</button>
  }

  function SoloPopup() {
    return (
      <div className="joinPopup">
        <img onClick={hideJoinPopup} src={alpha_x} alt="" />
        <h1>Join Tournament</h1>
        <div className="joinPopup-details">
          Are you sure you want to join this tournament?
        </div>
        <button className="btn btn-primary joinPopup-confirm">Confirm</button>
      </div>
    )
  }

  function TeamPopup() {
    return (
      <div className="joinPopup">
        <img onClick={hideJoinPopup} src={alpha_x} alt="" />
        <h1>Choose Team</h1>
        <div className="joinPopup-teams">
          { isLoadingTeams ? <div>Loading teams ...</div> : teams.map(team => <div onClick={chooseTeam} key={team.UUID} data-uuid={(team.UUID)}>{team.name}</div>) }
        </div>
        <button className="btn btn-primary joinPopup-confirm" onClick={joinTournamentAsTeam}>Confirm</button>
      </div>
    )
  }

  function ApplicationPopup() {
    return (
      <div className="applicationPopup">
        <img onClick={hideApplicationPopup} src={alpha_x} alt="" />
        <h1>Apply</h1>
        <div className="applicationPopup-application">
          {
            application.map(field => <div key={field.name}>
              <label htmlFor={`application-${field.name}`}>{field.name}</label>
              <input type="text" id={`application-${field.name}`} />
            </div>)
          }
        </div>
        <button className="btn btn-primary joinPopup-confirm" onClick={submitApplication}>Submit Application</button>
      </div>
    )
  }

  function chooseTeam(e) {
    let div = e.target
    let uuid = div.dataset.uuid
    chosenTeam.uuid = uuid

    try {
      document.querySelector('.selectedTeam').classList.remove('selectedTeam')
    }catch(e){console.log()}

    div.classList.add('selectedTeam')
  }

  function joinTournamentAsTeam() {
    hideJoinPopup()
    // axios
    // send post request to server with tournament ID and team ID and token
  }

  function joinTournamentAsSolo() {
    // axios
    // send post request to server with tournament ID and token
  }

  function submitApplication() {
    console.log('Submitting application...')
  }

  return (
    <div id="Tournament">
      <Nav />
      <div className="tournament-container">
      { isLoading ? <h1 className="loadingText">Loading tournament ...</h1> : 
      <>
        <div className="tournament-info">
          <div className="tournament-specs">
            <h1 className="tournament-title">{tournament.title}</h1>
            <p className="tournament-description">{tournament.description}</p>
            <p className="tournament-category">Category: {tournament.category.replace(/(^\w|\s\w)/g, m => m.toUpperCase())}</p>
            <p className="tournament-type">Format: {tournament.type.replace(/(^\w|\s\w)/g, m => m.toUpperCase())}</p>
            <p className="tournament-teamSize">{tournament.teamSize != 1 ? (`Team size: ${tournament.teamSize} players`) : "Team size: Solo"}</p>
            <p className="tournament-capacity">Capacity: {tournament.enrolledUsers.length}/{tournament.maxCapacity}</p>
            <p className="tournament-entryFee">Entry Fee: ${tournament.entryFee}</p>
            <div className="tournament-earnings">Earnings:
              <p>1st: ${tournament.earnings[1]}</p>
              <p>2nd: ${tournament.earnings[2]}</p>
              <p>3rd: ${tournament.earnings[3]}</p>
            </div>
            <p className="tournament-accessibility">{tournament.accessibility != 'open' ? tournament.accessibility.replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : ""}</p>
          </div>

          {button}
        </div>

        <div className="tournament-content">

          {tournament.type === "brackets" ? (
            <div className="brackets">Brackets Display</div>
          ) : (
            <div className="battle-royale">Battle Royale List</div>
          )}

          <div className="tournament-updates">
            <h3>Updates</h3>
            {tournament.updates.map((update) => <p key={update.date}>[{(new Date(update.date)).toDateString()}] {update.content}</p>)}
          </div>
        </div>
      </>
      }
      </div>
      { tournament.teamSize == 1 ? <SoloPopup /> : <TeamPopup /> }
      { tournament.accessibility == "application required" ? <ApplicationPopup /> : <></> }
    </div>
  );
}

export default Tournament;
