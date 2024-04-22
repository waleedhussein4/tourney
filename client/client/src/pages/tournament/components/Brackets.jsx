import { useState } from "react";
import { Bracket } from "react-brackets";
import "../styles/Brackets.css";

const TeamUserListPopup = ({ teamName, players, onClose }) => {
  const safePlayers = players || [];
  console.log(teamName, safePlayers, "popup test");

  return (
    <div className="team-user-list-popup">
      <h2>{teamName || "Unknown Team"} Users</h2>
      <ul>
        {safePlayers.map((player) => (
          <li
            key={player.username || `unknown-${Math.random()}`}
            onClick={() =>
              (window.location.href = `/profile/${player.username}`)
            }
          >
            {player.username || "Unknown User"}
          </li>
        ))}
      </ul>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

const staticParticipants = [
  {
    teamName: "Alpha Eagles",
    players: [
      { username: "EagleOne", score: 10, eliminated: false },
      { username: "EagleTwo", score: 8, eliminated: false },
    ],
  },
  {
    teamName: "Beta Wolves",
    players: [
      { username: "WolfLeader", score: 9, eliminated: false },
      { username: "LoneWolf", score: 7, eliminated: false },
    ],
  },
  {
    teamName: "Gamma Sharks",
    players: [
      { username: "SharkFin", score: 5, eliminated: false },
      { username: "GreatWhite", score: 6, eliminated: false },
    ],
  },
  {
    teamName: "Delta Tigers",
    players: [
      { username: "TigerClaw", score: 8, eliminated: false },
      { username: "JungleKing", score: 7, eliminated: false },
    ],
  },
  {
    teamName: "Epsilon Raptors",
    players: [
      { username: "RaptorEye", score: 10, eliminated: false },
      { username: "DinoDash", score: 6, eliminated: false },
    ],
  },
  {
    teamName: "Zeta Bulls",
    players: [
      { username: "BullCharge", score: 9, eliminated: false },
      { username: "RedHorn", score: 7, eliminated: false },
    ],
  },
  {
    teamName: "Eta Lions",
    players: [
      { username: "LionRoar", score: 8, eliminated: false },
      { username: "ManeMan", score: 5, eliminated: false },
    ],
  },
  {
    teamName: "Theta Knights",
    players: [
      { username: "KnightShade", score: 6, eliminated: false },
      { username: "CastleGuard", score: 7, eliminated: false },
    ],
  },
];

const Brackets = () => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleTeamClick = (teamName) => {
    const team = staticParticipants.find((t) => t.teamName === teamName);
    setSelectedTeam(team);
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedTeam(null);
  };

  // Define the rounds and matches
  const rounds = [
    {
      title: "Quarter Finals",
      seeds: [
        {
          id: 1,
          teams: [{ name: "Alpha Eagles" }, { name: "Beta Wolves" }],
          onClick: (match) => setSelectedTeam(match),
        },
        {
          id: 2,
          teams: [{ name: "Gamma Sharks" }, { name: "Delta Tigers" }],
          onClick: (match) => setSelectedTeam(match),
        },
        {
          id: 3,
          teams: [{ name: "Epsilon Raptors" }, { name: "Zeta Bulls" }],
          onClick: (match) => setSelectedTeam(match),
        },
        {
          id: 4,
          teams: [{ name: "Eta Lions" }, { name: "Theta Knights" }],
          onClick: (match) => setSelectedTeam(match),
        },
      ],
    },
    {
      title: "Semi Finals",
      seeds: [
        {
          id: 1,
          teams: [{ name: "TBA" }, { name: "TBA" }],
          onClick: (match) => setSelectedTeam(match),
        },
        {
          id: 2,
          teams: [{ name: "TBA" }, { name: "TBA" }],
          onClick: (match) => setSelectedTeam(match),
        },
      ],
    },
    {
      title: "Final",
      seeds: [
        {
          id: 1,
          teams: [{ name: "TBA" }, { name: "TBA" }],
          onClick: (match) => setSelectedTeam(match),
        },
      ],
    },
  ];

  return (
    <div className="brackets-container">
      <Bracket rounds={rounds} />
      {isPopupOpen && selectedTeam && (
        <TeamUserListPopup
          teamName={selectedTeam.teamName}
          players={selectedTeam.players}
          onClose={handlePopupClose}
        />
      )}
      <h1>Competing Teams</h1>
      <div className="team-table">
        <table>
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Number of Players</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {staticParticipants.map((team) => (
              <tr key={team.teamName}>
                <td>{team.teamName}</td>
                <td>{team.players.length}</td>
                <td>
                  <button onClick={() => handleTeamClick(team.teamName)}>
                    View Players
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Brackets;
