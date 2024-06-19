import React from 'react'

const Leaderboard = ({ tournament }) => {
  const sortedUsers = tournament.enrolledUsers ? [...tournament.enrolledUsers].sort((a, b) => b.score - a.score) : [];
  const sortedTeams = tournament.enrolledTeams ? [...tournament.enrolledTeams].sort((a, b) => b.score - a.score) : [];

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
  )
}

export default Leaderboard
