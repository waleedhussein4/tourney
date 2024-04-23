import { useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "/src/context/AuthContext";
import "./styles/App.css";
import Nav from "/src/components/Nav.jsx";
import alpha_x from "/src/assets/alpha-x.svg";
import Brackets from "./components/Brackets";
import BattleRoyale from "./components/BattleRoyale";
import { useNavigate, useParams } from "react-router-dom";

const tournamentURL = `http://localhost:2000/api/tournement/tournament`;
const teamsURL = "http://localhost:2000/api/team/user";
const submitApplicationURL = "http://localhost:2000/api/tournement/tournament/submitApplication";
const joinAsSoloURL = "http://localhost:2000/api/tournement/tournament/joinAsSolo";
const joinAsTeamURL = "http://localhost:2000/api/tournement/tournament/joinAsTeam";

function Tournament() {
  const { loggedIn } = useContext(AuthContext);

  const navigate = useNavigate();

  const { UUID } = useParams();

  const [tournament, setTournament] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [applicationAccepted, setApplicationAccepted] = useState(false);
  const [teams, setTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [chosenTeam, setChosenTeam] = useState({ uuid: "" });
  const [application, setApplication] = useState({});
  const [hasApplied, setHasApplied] = useState(false);

  const handleJoin = () => {
    console.log("Joining tournament");
    if (tournament.teamSize > 1) {
      displayJoinPopup();
    } else {
      joinTournamentAsSolo();
    }
  };

  const handleApply = () => {
    console.log("Applying for tournament");
    if (tournament.teamSize > 1) {
      displayTeamApplicationPopup();
    } else {
      displaySoloApplicationPopup();
    }
  };

  const handleManage = () => {
    console.log("Managing tournament");
    navigate(`/tournament/${UUID}/manage`);
  };

  const fetchTournamentData = async () => {
    await fetch(
      tournamentURL +
        "?" +
        new URLSearchParams({
          UUID: UUID,
        }),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((data) => {
        // data.accessibility = "open"
        // data.teamSize = 1
        setTournament(data);
        setIsLoading(false);
        setIsHost(data.isHost);
        setIsJoined(data.isJoined);
        setApplicationAccepted(data.isAccepted);
        setApplication(data.application);
        setHasApplied(data.hasApplied);
        console.log(data)
      });
  };

  const fetchTeams = async () => {
    await fetch(teamsURL,{
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setTeams(data);
        setIsLoadingTeams(false);
        console.log(data)
      });
  };

  const fetchTournamentCategories = async () => {
    await fetch('http://localhost:2000/api/tournement/getTournamentCategories')
    .then(res => res.json())
    .then(data => {
      console.log(data);
    })
  }

  useEffect(() => {
    fetchTournamentData();
    try {
      fetchTeams();
    }
    catch (e) {
      console.log(e);
    }
    fetchTournamentCategories();
  }, []);

  function displayJoinPopup() {
    document.querySelector(".joinPopup").style.display = "flex";
  }

  function hideJoinPopup() {
    document.querySelector(".joinPopup").style.display = "none";
  }

  function displaySoloApplicationPopup() {
    document.querySelector(".soloApplicationPopup").style.display = "flex";
  }

  function hideSoloApplicationPopup() {
    document.querySelector(".soloApplicationPopup").style.display = "none";
  }

  function displayTeamApplicationPopup() {
    document.querySelector(".teamApplicationPopup").style.display = "flex";
  }

  function hideTeamApplicationPopup() {
    document.querySelector(".teamApplicationPopup").style.display = "none";
  }

  let status = <></>;

  if (tournament.hasStarted) {
    status = <div className="tournament-status">Tournament has started</div>;
  } else if (!applicationAccepted && hasApplied) {
    status = (
      <div className="tournament-status">
        Your application is pending approval by the host.
      </div>
    );
  }

  if(tournament.isJoined) {
    status = <div className="tournament-status">You have joined this tournament</div>;
  }

  let button;

  if (!loggedIn) {
    button = (
      <button className="btn btn-primary" onClick={() => navigate("/signin")}>
        Sign in to join
      </button>
    );
  } else if (hasApplied && !applicationAccepted) {
    button = <></>;
  } else if (!isHost && !isJoined) {
    if (!tournament.hasStarted && tournament.accessibility === "open") {
      button = (
        <button className="btn btn-primary" onClick={handleJoin}>
          Join
        </button>
      );
    } else if (!tournament.hasStarted && !applicationAccepted) {
      button = (
        <button className="btn btn-secondary" onClick={handleApply}>
          Apply
        </button>
      );
    } else if (!tournament.hasStarted && applicationAccepted) {
      button = (
        <button className="btn btn-primary" onClick={handleJoin}>
          Join
        </button>
      );
    } else {
      button = <></>;
    }
  }
  else if (isHost){
    button = (
      <button
        className="btn btn-manage"
        onClick={handleManage}
      >
        Manage
      </button>
    );
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
    );
  }

  function TeamPopup() {
    return (
      <div className="joinPopup">
        <img onClick={hideJoinPopup} src={alpha_x} alt="" />
        <h1>Choose Team</h1>
        <div className="joinPopup-teams">
          {isLoadingTeams ? (
            <div>Loading teams ...</div>
          ) : (
            teams.map((team) => (
              <div className={`isValidTeam-${team.members.length==tournament.teamSize}`} onClick={chooseTeam} key={team.UUID} data-uuid={team.UUID}>
                {team.name}
              </div>
            ))
          )}
        </div>
        <button
          className="btn btn-primary joinPopup-confirm"
          onClick={joinTournamentAsTeam}
        >
          Confirm
        </button>
      </div>
    );
  }

  function SoloApplicationPopup() {
    return (
      <div className="soloApplicationPopup">
        <img onClick={hideSoloApplicationPopup} src={alpha_x} alt="" />
        <h1>Apply</h1>
        <div className="application">
          {application.map((field) => (
            <div className="field" key={field.name}>
              <label htmlFor={`application-${field.name}`}>{field.name}</label>
              <input type="text" id={`application-${field.name}`} />
            </div>
          ))}
        </div>
        <div className="soloApplicationPopup-error"></div>
        <button
          className="btn btn-primary joinPopup-confirm"
          onClick={submitApplication}
        >
          Submit Application
        </button>
      </div>
    );
  }

  function TeamApplicationPopup() {
    return (
      <div className="teamApplicationPopup">
        <img onClick={hideTeamApplicationPopup} src={alpha_x} alt="" />
        <h1>Apply</h1>
        <div className="application">
          <div className="info">
            <h3>Choose Team</h3>
            <p>Your chosen team must have exactly {tournament.teamSize} players.</p>
          </div>
          <div className="teams">
            {isLoadingTeams ? (
              <div>Loading teams ...</div>
            ) : (
              teams.map((team) => (
                <div className={`isValidTeam-${team.members.length==tournament.teamSize} team`} onClick={chooseTeam} key={team.UUID} data-uuid={team.UUID}>
                  {team.name}
                </div>
              ))
            )}
          </div>
          {application.map((field) => (
            <div className="field" key={field.name}>
              <label htmlFor={`application-${field.name}`}>{field.name}</label>
              <input type="text" id={`application-${field.name}`} />
            </div>
          ))}
        </div>
        <div className="applicationPopup-error"></div>
        <button
          className="btn btn-primary teamApplicationPopup-confirm"
          onClick={submitApplication}
        >
          Submit Application
        </button>
      </div>
    );
  }

  function chooseTeam(e) {
    let div = e.target;
    let uuid = div.dataset.uuid;
    chosenTeam.uuid = uuid;

    if(div.classList.contains('isValidTeam-false')) {
      // return;
    }

    try {
      document.querySelector(".selectedTeam").classList.remove("selectedTeam");
    } catch (e) {
      console.log();
    }

    div.classList.add("selectedTeam");
  }

  async function joinTournamentAsTeam() {
    console.log("Joining as team...");
    hideJoinPopup();
    await fetch(joinAsTeamURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tournament: UUID,
        team: chosenTeam,
      }),
      credentials: "include",
    }).then((res) => {
      if (res.ok) {
        navigate(0)
      } else {
        console.log(res);
      }
    });
  }

  async function joinTournamentAsSolo() {
    console.log("Joining as solo...");
    hideJoinPopup();
    await fetch(joinAsSoloURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tournament: UUID,
      }),
      credentials: "include",
    }).then((res) => {
      if (res.ok) {
        navigate(0)
      } else {
        console.log(res);
      }
    });
  }

  async function submitApplication() {
    console.log("Submitting application...");

    let form = document.querySelector(".application");
    let fields = form.querySelectorAll('.field');
    if (!validateForm(fields)) {
      document.querySelector(".applicationPopup-error").innerHTML =
        "You must fill all fields.";
      return;
    }

    let application = [];

    Array.from(fields).forEach((field) => {
      let label = field.querySelector("label").innerText;
      let input = field.querySelector("input").value;

      application.push({ label, input });
    });

    let selectedTeam
    try {
      selectedTeam = form.querySelector('.selectedTeam')
      if(!selectedTeam) {
        throw new Error();
      }
    } catch (e) {
      document.querySelector(".applicationPopup-error").innerHTML =
        "You must choose a team.";
      return;
    }

    console.log(application);

    await fetch(submitApplicationURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tournament: UUID,
        application: application,
        team: selectedTeam.innerText,
      }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          document.querySelector(".applicationPopup-error").innerHTML = data.error;
        }
        else {
          navigate(0)
        }
      });
  }

  function validateForm(fields) {
    let valid = true;
    Array.from(fields).forEach((field) => {
      let input = field.querySelector("input").value;
      if (!input) {
        valid = false;
      }
    });
    return valid;
  }

  return (
    <div id="Tournament">
      <Nav />
      <div className="tournament-container">
        {isLoading ? (
          <h1 className="loadingText">Loading tournament ...</h1>
        ) : (
          <>
            <div className="tournament-info">
              <div className="tournament-specs">
                <h1 className="tournament-title">{tournament.title}</h1>
                <p className="tournament-description">
                  {tournament.description}
                </p>
                {/* <p className="tournament-category">
                  Category:{" "}
                  {tournament.category.replace(/(^\w|\s\w)/g, (m) =>
                    m.toUpperCase()
                  )}
                </p> */}
                {/* <p className="tournament-type">
                  Format:{" "}
                  {tournament.type.replace(/(^\w|\s\w)/g, (m) =>
                    m.toUpperCase()
                  )}
                </p> */}
                <p className="tournament-teamSize">
                  {tournament.teamSize != 1
                    ? `Team size: ${tournament.teamSize} players`
                    : "Team size: Solo"}
                </p>
                <p className="tournament-capacity">
                  Capacity: {tournament.enrolledParticipants?.length || tournament.enrolledTeams?.length}/
                  {tournament.maxCapacity}
                </p>
                <p className="tournament-entryFee">
                  Entry Fee: ${tournament.entryFee}
                </p>
                <div className="tournament-earnings">
                  Earnings:
                  <p>1st: ${tournament.earnings[1]}</p>
                  <p>2nd: ${tournament.earnings[2]}</p>
                  <p>3rd: ${tournament.earnings[3]}</p>
                </div>
                <p className="tournament-accessibility">
                  {tournament.accessibility != "open"
                    ? tournament.accessibility.replace(/(^\w|\s\w)/g, (m) =>
                        m.toUpperCase()
                      )
                    : ""}
                </p>
              </div>

              {status}
              {button}
            </div>

            <div className="tournament-content">
              {tournament.type === "battle royale" ? (
                <Brackets tournament={tournament} />
              ) : (
                <BattleRoyale tournament={tournament} />
              )}

              <div className="tournament-updates">
                <h3>Updates</h3>
                {tournament.updates.map((update) => (
                  <p key={update.date}>
                    [{new Date(update.date).toDateString()}] {update.content}
                  </p>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {tournament.teamSize == 1 ? <SoloPopup /> : <TeamPopup />}
      {tournament.accessibility == "application required" ? (
        <>
        {tournament.teamSize == 1 && <SoloApplicationPopup />}
        {tournament.teamSize > 1 && <TeamApplicationPopup />}
        </>
      ) : (
        <></>
      )}
    </div>
  );
}

export default Tournament;
