import { useState } from "react";
import "./styles/App.css";
import Nav from "/src/components/Nav.jsx";

const url = "";

const tournament = {
  UUID: "89b72cfe-0b87-4395-8230-8e8e1f571cb7",
  host: "9410f264-0bef-4516-b3ea-661c575490f2",
  title: "Fortnite Solo Cup",
  type: "battle royale",
  category: "fortnite",
  startDate: "2024-02-29T10:01:31.474Z",
  endDate: "2024-02-29T10:02:10.959Z",
  enrolledUsers: [
    "f61bc24d-bebc-4391-acbb-2928b6ad74a4",
    "f976aa28-133d-4a9c-a295-cc55a2198435",
    "141002f8-f9da-4ad4-a86d-eef1bf4b9c3a",
  ],
  entryFee: 5.5,
  earnings: {
    1: 200,
    2: 100,
    3: 75,
  },
  maxCapacity: 100,
  accessibility: "open",
  desc: "Join the ultimate Fortnite Solo Cup and battle against other solo players for the top spot.",
  specs: "Solo players, Battle Royale format, No team support",
  isTeamBased: false,
};

function Tournament() {
  const [isHost, setIsHost] = useState(true); // Replace with logic to check actual host
  const [applicationAccepted, setApplicationAccepted] = useState(false);

  const handleJoin = () => {
    console.log("Joining tournament");
    // Implement joining logic here, e.g., update backend, redirect to 'join tournament' page
  };

  const handleApply = () => {
    console.log("Applying for tournament");
    // Implement apply logic here, e.g., display form, send data to backend
  };

  const fetchTournamentData = async () => {
    await fetch(
      "https://example.com?" +
        new URLSearchParams({
          foo: "value",
          bar: 2,
        })
    )
      .then((res) => res.json())
      .then((data) => console.log(data));
  };

  fetchTournamentData();

  return (
    <div id="Tournament">
      <Nav />
      <div className="tournament-container">
        <div className="tournament-header">
          <h1 className="tournament-title">{tournament.title}</h1>
          <p className="tournament-description">{tournament.desc}</p>
          <p className="tournament-specs">{tournament.specs}</p>
        </div>

        {isHost && (
          <button
            className="btn btn-manage"
            onClick={() => console.log("Manage tournament")}
          >
            Manage
          </button>
        )}

        <div className="tournament-content">
          {/* Display brackets or battle royale list based on the type */}
          {tournament.type === "brackets" ? (
            <div className="brackets">Brackets Display</div>
          ) : (
            <div className="battle-royale">Battle Royale List</div>
          )}

          {/* Join or Apply button based on accessibility and application status */}
          <div className="tournament-actions">
            {tournament.accessibility === "open" ? (
              <button className="btn btn-primary" onClick={handleJoin}>
                Join
              </button>
            ) : !applicationAccepted ? (
              <button className="btn btn-secondary" onClick={handleApply}>
                Apply
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleJoin}>
                Join
              </button>
            )}
          </div>

          {/* Team-based or Solo prompt based on tournament type */}
          <p className="tournament-join-as">
            {tournament.isTeamBased
              ? "Join as a team"
              : "Join as a solo player"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Tournament;
