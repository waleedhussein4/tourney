/* eslint-disable react/prop-types */

import { useState } from 'react';

const BattleRoyale = ({ tournament }) => {

  let members

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleUserClick = (e) => {
    console.log(`/profile/${e.target.dataset.username}`)
    window.location.href = `/profile/${e.target.dataset.username}`;
  };

  const handleTeamClick = (e) => {
    // console.log(`/team/${e.target.dataset.teamname}`)
    // window.location.href = `/team/${e.target.dataset.teamname}`;

    const teamName = e.target.dataset.teamname;
    console.log('Team Clicked: ' + teamName)
    const team = tournament.enrolledTeams.find(t => t.teamName === teamName);
    console.log('Team: ' + JSON.stringify(team))
    setSelectedTeam(team);
    setIsPopupOpen(true);
  }

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedTeam(null);
  };

  const TeamUserListPopup = ({ teamName, players, onClose }) => {
    console.log(players)
    return (
      <div className="team-user-list-popup">
        <h2>{teamName || "Unknown Team"}</h2>
        <ul>
          {players.map(player => (
            <li key={player.username} onClick={() => (window.location.href = `/profile/${player.username}`)}>
              {player.username}
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };

  if(tournament.enrolledUsers && tournament.enrolledTeams.length === 0) {
    console.log('enrolledUsers')
    members = tournament.enrolledUsers.map((competitor, index) => (
      <li key={index}>
        <span data-username={competitor.username} className="user" onClick={handleUserClick}>{index + 1}. {competitor.username} <span className="user-eliminated">{competitor.eliminated ? 'Eliminated' : ''}</span></span>
        <span>{competitor.score}</span>
      </li>
    ));
  }

  if(tournament.enrolledTeams && tournament.enrolledUsers.length === 0) {
    console.log('enrolledTeams')
    members = tournament.enrolledTeams.map((competitor, index) => (
      <li key={competitor.teamName}>
        <span data-teamName={competitor.teamName} className="team" onClick={handleTeamClick}>{index + 1}. {competitor.teamName} <span className="user-eliminated">{competitor.eliminated ? 'Eliminated' : ''}</span></span>
        <span>{competitor.score}</span>
      </li>
    ));
  }

  console.log(members)
  
  return (
    <div className="battle-royale">
      {isPopupOpen && selectedTeam && (
        <TeamUserListPopup
          teamName={selectedTeam.teamName}
          players={selectedTeam.players}
          onClose={handlePopupClose}
        />
      )}
      <h1>Status: {tournament.hasStarted ? 'Ongoing' : 'Offline'}</h1>
      { (tournament.enrolledUsers?.length || tournament.enrolledTeams?.length) > 0 ?
      <>
        <div className="table-header">
          <span>Username</span>
          <span>Score</span>
        </div>
        <ul className="user-list">
          {members}
        </ul>
      </>
      :
      <div className="table-header">No users currently enrolled</div>
      }
    </div>
  );
};

export default BattleRoyale;
