/* eslint-disable react/prop-types */
import Nav from "/src/components/Nav.jsx";
import "./styles/App.css";
import crown from "./assets/crown.webp";
import { ConfirmationPopup } from "../../../components/ConfirmationPopup";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const paramUUID = new URLSearchParams(window.location.search).get("UUID");

function App() {

  const navigate = useNavigate();

  const [team, setTeam] = useState({});
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);

  const fetchTeam = async () => {
    const URL = "http://localhost:2000/api/team/view/" + paramUUID;
    await fetch(URL, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          navigate("/page-not-found");
        }
        return res.json();
      })
      .then((data) => {
        setTeam(data);
        setLoadingTeam(false);
        console.log(data);
      });
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  return (
    <div id="ViewTeam">
      <Nav />
      {loadingTeam ? (
        <div id="main">
          <h1>LOADING ...</h1>
        </div>
      ) :
        <>
          <div id="main">
            <div id="team">
              <h1>{team.name}</h1>
              <div className="members">
                <span>Members</span>
                {team.members.map((member) => (
                  <Member key={member.username} member={member} team={team} />
                ))}
              </div>
              <div className="invite">
                <span className="invite-title">
                  Share this link to invite others to your team
                </span>
                <div className="invite-link">
                  <span>http://localhost:5173/team/join/{team.teamId}</span>
                  <button className="copyBtn" onClick={copyLink}>
                    Copy
                  </button>
                </div>
              </div>
              {team.isLeader ? (
                <button onClick={deleteTeam} className="deleteTeam">
                  Delete Team
                </button>
              ) : (
                <button onClick={leaveTeam} className="leaveTeam">
                  Leave Team
                </button>
              )}
            </div>
          </div>
          {showConfirmation && (
            <ConfirmationPopup
              message="Are you sure?"
              onConfirm={() => {
                confirmationAction && confirmationAction();
                setShowConfirmation(false);
              }}
              onCancel={() => setShowConfirmation(false)}
            />
          )}
        </>
      }
    </div>
  );
}

function Member({ member, team }) {
  const [showKickConfirmation, setShowKickConfirmation] = useState(false);
  const [showPromoteConfirmation, setShowPromoteConfirmation] = useState(false);

  async function kickMember() {
    setShowKickConfirmation(() => {
      const username = member.username;
      const URL = "http://localhost:2000/api/team/kick/" + paramUUID;
      return async () => {
        await fetch(URL, {
          headers: { "Content-Type": "application/json" },
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            username: username,
          }),
        }).then((res) => {
          if (res.ok) {
            const kickedMemberDiv = document.querySelector(
              ".member." + username
            );
            kickedMemberDiv.remove();
          }
        });
      };
    });
    setShowKickConfirmation(true);
  }

  async function promoteMember() {
    setShowPromoteConfirmation(() => {
      const username = member.username;
      const URL = "http://localhost:2000/api/team/changeLeader/" + paramUUID;
      return async () => {
        await fetch(URL, {
          headers: { "Content-Type": "application/json" },
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            username: username,
          }),
        }).then((res) => {
          if (res.ok) {
            window.location.reload();
          }
        });
      };
    });
    setShowPromoteConfirmation(true);
  }

  const isLeader = team.leader == member.username;
  return (
    <div>
      <div
        className={"member " + member.username}
        onMouseEnter={showButton}
        onMouseLeave={hideButton}
      >
        <div className="nameWrapper">
          <span className="name">{member.username}</span>
          {isLeader ? <img className="crown" src={crown} alt="" /> : <></>}
        </div>
        <div className="buttonsWrapper">
          {team.isLeader && !isLeader && (
            <>
              <button onClick={kickMember} className="kickButton">
                Kick
              </button>
              <button onClick={promoteMember} className="promoteButton">
                Transfer Leadership
              </button>
            </>
          )}
        </div>
      </div>
      {showKickConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to kick this member?"
          onConfirm={() => {
            kickMember();
            setShowKickConfirmation(false);
          }}
          onCancel={() => setShowKickConfirmation(false)}
        />
      )}
      {showPromoteConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to promote this member?"
          onConfirm={() => {
            promoteMember();
            setShowPromoteConfirmation(false);
          }}
          onCancel={() => setShowPromoteConfirmation(false)}
        />
      )}
    </div>
  );
}

function showButton(event) {
  let buttons = event.target.querySelectorAll(".buttonsWrapper button");
  Array.from(buttons).forEach((btn) => (btn.style.display = "inline-block"));
}

function hideButton(event) {
  let buttons = event.target.querySelectorAll(".buttonsWrapper button");
  Array.from(buttons).forEach((btn) => (btn.style.display = "none"));
}

async function deleteTeam() {
  const paramUUID = new URLSearchParams(window.location.search).get("UUID");
  const URL = "http://localhost:2000/api/team/delete/" + paramUUID;

  await fetch(URL, {
    method: "DELETE",
    credentials: "include",
  });
  window.location.href = "/team";
}

async function leaveTeam() {
  console.log("leaving team");
  const URL = "http://localhost:2000/api/team/leave/" + paramUUID;
  console.log(URL);

  await fetch(URL, {
    method: "POST",
    credentials: "include",
  }).then((res) => {
    if (res.ok) {
      window.location.href = "/team";
    }
  });
}

function copyLink() {
  const element = document.querySelector(".invite-link");
  navigator.clipboard.writeText(element.querySelector("span").innerText);
  element.querySelector(".copyBtn").innerHTML = "Copied";
}

export default App;
