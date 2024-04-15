/* eslint-disable react/prop-types */
import "../styles/Brackets.css";

import { useState } from "react";

const TeamUserListPopup = ({ teamName, players, onClose }) => {
  return (
    <div className="team-user-list-popup">
      <h2>{teamName} Users</h2>
      <ul>
        {players.map((player) => (
          <li key={player._id}>
            {/* Access user data and display name (replace with your logic) */}
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

  const participants = tournament.data.enrolledParticipants;

  const isTeam = (participant) => participant?.teamName !== null; // Check if participant has a team name

  const totalRounds = Math.log2(participants.length);
  console.log('totalRounds:', totalRounds)
  let matches = [...participants];

  const createPlaceholderForRound = (round) => {
    return Array.from({ length: Math.pow(2, totalRounds - round) }, (_, i) => ({
      id: `placeholder-${round}-${i}`,
      competitors: [
        {
          username: "TBA",
          eliminated: false,
          score: 0,
        },
        {
          username: "TBA",
          eliminated: false,
          score: 0,
        },
      ],
    }));
  };

  // Initialize placeholders for all rounds.
  let rounds = Array.from({ length: totalRounds }, (_, i) =>
    createPlaceholderForRound(i + 1)
  );

  // Add initial competitors to the first round.
  rounds[0] = rounds[0].map((match, i) => {
    const participant = participants[i * 2] || participants[i * 2 + 1];
    return {
      ...match,
      competitors: [
        isTeam(participant)
          ? participant.teamName
          : getUserDisplayName(participant),
        isTeam(participants[i * 2 + 1])
          ? participants[i * 2 + 1].teamName
          : participants[i * 2 + 1]
          ? getUserDisplayName(participants[i * 2 + 1])
          : "TBD",
      ],
    };
  });

  const getUserDisplayName = (participant) => {
    // Implement logic to retrieve user display name based on participant data (e.g., username)
    return participant?._id || "Unknown User"; // Replace with actual user display name logic
  };

  const handleCompetitorClick = (competitor) => {
    if (isTeam(competitor)) {
      setSelectedTeam(competitor);
      setIsTeamPopupOpen(true);
    } else {
      // Redirect to user profile page (implement redirection logic)
      console.log("Redirect to user profile:", competitor);
    }
  };

  const handlePopupClose = () => {
    setIsTeamPopupOpen(false);
    setSelectedTeam(null);
  };

  return (
    <div className="brackets">
      {matches.length > 0 ? (
        <div className="brackets">
          {rounds.map((round, roundIndex) => (
            <div key={roundIndex} className={`round round-${roundIndex}`}>
              {round.map((match) => (
                <div key={match.id} className="match">
                  <div
                    className="competitor"
                    onClick={() => handleCompetitorClick(match.competitors[0])}
                  >
                    {match.competitors[0]}
                  </div>
                  <div
                    className="competitor"
                    onClick={() => handleCompetitorClick(match.competitors[1])}
                  >
                    {match.competitors[1]}
                  </div>
                  {roundIndex !== rounds.length - 1 && (
                    <div
                      className="connector"
                      style={{ "--round": roundIndex + 1 }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {isTeamPopupOpen && selectedTeam && (
            <TeamUserListPopup
              teamName={selectedTeam.teamName}
              players={selectedTeam.players}
              onClose={handlePopupClose}
            />
          )}
        </div>
      ) : (
        <div>No Matches / No Enrolled Users yet</div>
      )}
    </div>
  );
};

export default Brackets;
