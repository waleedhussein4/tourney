import React from "react";
import "../styles/Brackets.css"; // Ensure this CSS file is created and linked

const Brackets = ({ tournament }) => {
  const enrolledUsers = [
    "user 1",
    "user 2",
    "user 3",
    "user 4",
    "user 5",
    "user 6",
    "user 7",
    "user 8",
  ];

  // Generate the bracket structure based on the number of enrolled users.
  // This assumes the number of users is a power of two for simplicity.
  const totalRounds = Math.log2(enrolledUsers.length);
  let matches = [...enrolledUsers];

  // Function to create a placeholder for each round.
  const createPlaceholderForRound = (round) => {
    return Array.from({ length: Math.pow(2, totalRounds - round) }, (_, i) => ({
      id: `placeholder-${round}-${i}`,
      competitors: ["TBA", "TBA"],
    }));
  };

  // Initialize placeholders for all rounds.
  let rounds = Array.from({ length: totalRounds }, (_, i) =>
    createPlaceholderForRound(i + 1)
  );
  // Add initial competitors to the first round.
  rounds[0] = rounds[0].map((match, i) => ({
    ...match,
    competitors: [matches[i * 2] || "TBD", matches[i * 2 + 1] || "TBD"],
  }));

  return (
    <div className="brackets">
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex} className={`round round-${roundIndex}`}>
          {round.map((match) => (
            <div key={match.id} className="match">
              <div className="competitor">{match.competitors[0]}</div>
              <div className="competitor">{match.competitors[1]}</div>
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
    </div>
  );
};

export default Brackets;
