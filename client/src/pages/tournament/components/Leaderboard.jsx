import React from 'react';

const Leaderboard = ({ tournament }) => {
  const filteredUsers = tournament.enrolledUsers ? tournament.enrolledUsers.filter(user => user !== null) : [];
  const filteredTeams = tournament.enrolledTeams ? tournament.enrolledTeams.filter(team => team !== null) : [];

  const sortedUsers = filteredUsers.sort((a, b) => b.score - a.score);
  const sortedTeams = filteredTeams.sort((a, b) => b.score - a.score);

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <div className="leaderboard-entries">
        {sortedUsers.map((user, index) => (
          <div key={index} className="leaderboard-entry">
            <div className="leaderboard-entry-username">{user.username || 'TBD'}</div>
            <div className="leaderboard-entry-score">{user.score || 0}</div>
          </div>
        ))}

        {sortedTeams.map((team, index) => (
          <div key={index} className="leaderboard-entry">
            <div className="leaderboard-entry-username">{team.teamName || 'TBD'}</div>
            <div className="leaderboard-entry-score">{team.score || 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
