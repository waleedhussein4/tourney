import { useEffect, useState } from "react";
import "./styles/App.css";
import Nav from "/src/components/Nav.jsx";

const url = 'https://api.npoint.io/c9523c0ef25065fec8c2';
const paramUUID = new URLSearchParams(window.location.search).get('UUID')

function Tournament() {

  const [tournament, setTournament] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isHost, setIsHost] = useState(false);
  const [applicationAccepted, setApplicationAccepted] = useState(false);

  const handleJoin = () => {
    console.log("Joining tournament");
    // Implement joining logic here, e.g., update backend, redirect to 'join tournament' page
  };

  const handleApply = () => {
    console.log("Applying for tournament");
    // Implement apply logic here, e.g., display form, send data to backend
  };

  // const fetchTournamentData = async () => {
  //   await fetch(url + new URLSearchParams({
  //     UUID: paramUUID
  //   }))
  //   .then(res => res.json())
  //   .then(data => {tournament = JSON.parse(data)})
  // };

  const fetchTournamentData = async () => {
    await fetch(url)
    .then(res => res.json())
    .then(data => {
      setTournament(data)
      setIsLoading(false)
      // setIsHost(data.host == user.UUID)
      // setApplicationAccepted(tournament.isAccepted)
    })
  }

  useEffect(() => {
    fetchTournamentData()
  }, [])

  let button

  if(!isHost) {
    if(!tournament.hasStarted && tournament.accessibility === "open") {
      button = <button className="btn btn-primary" onClick={handleJoin}>Join</button>
    }
    else if(!tournament.hasStarted && !applicationAccepted) {
      button = <button className="btn btn-secondary" onClick={handleApply}>Apply</button>
    }
    else if(!tournament.hasStarted) {
      button = <button className="btn btn-primary" onClick={handleJoin}>Join</button>
    }
    else {
      button = <></>
    }
  }
  else {
    button = <button className="btn btn-manage" onClick={() => console.log("Manage tournament")}>Manage</button>
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
    </div>
  );
}

export default Tournament;
