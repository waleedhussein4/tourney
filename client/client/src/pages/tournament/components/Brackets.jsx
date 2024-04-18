/* eslint-disable react/prop-types */
import "../styles/Brackets.css";
import { useState } from "react";

const TeamUserListPopup = ({ teamName, players, onClose }) => {
  const safePlayers = players || [];
  console.log(teamName, safePlayers, "popup test");

  return (
    <div className="team-user-list-popup">
      <h2>{teamName || "Unknown Team"} Users</h2>
      <ul>
        {safePlayers.map((player) => (
          <li
            key={player._id || `unknown-${Math.random()}`}
            onClick={() => (window.location.href = `/profile/${player._id}`)}
          >
            {player.username || player.email || "Unknown User"}
          </li>
        ))}
      </ul>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

const Brackets = ({ tournament }) => {
  const [isTeamPopupOpen, setIsTeamPopupOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const participants = tournament?.data?.enrolledParticipants || [];

  const totalRounds = Math.ceil(Math.log2(Math.max(participants.length, 1)));

  // Placeholder for non-existent participants to even out the brackets
  while (Math.pow(2, totalRounds) !== participants.length) {
    participants.push({ username: "TBA" });
  }

  // Handling team check and popup logic
  const isTeam = (participant) => participant && "teamName" in participant;

  const handleCompetitorClick = (competitor) => {
    if (competitor && isTeam(competitor)) {
      setSelectedTeam({ ...competitor, players: competitor.players || [] });
      setIsTeamPopupOpen(true);
    } else {
      console.log("Redirect to user profile:", competitor.username);
    }
  };

  const handlePopupClose = () => {
    setIsTeamPopupOpen(false);
    setSelectedTeam(null);
  };

  return (
    <div
      className="brackets"
      onWheel={(e) => (e.currentTarget.scrollLeft += e.deltaY * 1.5)}
    >
      {participants.length ? (
        Array.from({ length: totalRounds }).map((_, roundIndex) => (
          <div key={roundIndex} className={`round round-${roundIndex}`}>
            {Array.from({
              length: Math.pow(2, totalRounds - roundIndex - 1),
            }).map((_, matchIndex) => (
              <div key={matchIndex} className="match">
                <div
                  className="competitor"
                  onClick={() =>
                    handleCompetitorClick(participants[matchIndex * 2])
                  }
                >
                  {participants[matchIndex * 2].teamName || "Unknown"}
                </div>
                <div
                  className="competitor"
                  onClick={() =>
                    handleCompetitorClick(participants[matchIndex * 2 + 1])
                  }
                >
                  {participants[matchIndex * 2 + 1].teamName || "Unknown"}
                </div>
                {roundIndex !== totalRounds - 1 && (
                  <div
                    className="connector"
                    style={{ "--round": roundIndex + 1 }}
                  ></div>
                )}
              </div>
            ))}
          </div>
        ))
      ) : (
        <div>No Matches / No Enrolled Users yet</div>
      )}
      {isTeamPopupOpen && (
        <TeamUserListPopup
          teamName={selectedTeam.teamName || "Unknown Team"}
          players={selectedTeam.players}
          onClose={handlePopupClose}
        />
      )}
    </div>
  );
};

export default Brackets;
