/* eslint-disable react/prop-types */

import { useState } from 'react';

const BattleRoyale = ({ tournament }) => {
  let members;

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleUserClick = (e) => {
    console.log(`/profile/${e.target.dataset.username}`);
    window.location.href = `/profile/${e.target.dataset.username}`;
  };

  const handleTeamClick = (e) => {
    const teamName = e.target.dataset.teamname;
    console.log('Team Clicked: ' + teamName);
    const team = tournament.enrolledTeams.find((t) => t.teamName === teamName);
    console.log('Team: ' + JSON.stringify(team));
    setSelectedTeam(team);
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedTeam(null);
  };

  const TeamUserListPopup = ({ teamName, players, onClose }) => {
    console.log(players);
    return (
      <div className="team-user-list-popup">
        <h2>{teamName || 'Unknown Team'}</h2>
        <div className='header'>
          <span>Username</span>
          <span>Score</span>
        </div>
        <div className='players'>
          {players.map((player) => (
            <div key={player.username} className='player' onClick={() => (window.location.href = `/profile/${player.username}`)}>
              <span className='username'>
                <span className={player.eliminated ? 'eliminated' : ''}>
                  {player.username}
                </span>
                <span className='user-eliminated'>
                  {player.eliminated ? 'Eliminated' : ''}
                </span>
              </span>
              <span className='score'>
                {player.score || 0}
              </span>
            </div>
          ))}
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };

  const sortParticipants = (participants) => {
    return participants.sort((a, b) => {
      if (a.eliminated && !b.eliminated) return 1;
      if (!a.eliminated && b.eliminated) return -1;
      return b.score - a.score;
    });
  };

  if (tournament.enrolledUsers && tournament.enrolledTeams.length === 0) {
    const sortedUsers = sortParticipants(tournament.enrolledUsers);
    members = sortedUsers.map((competitor, index) => (
      <li key={index}>
        <span data-username={competitor.username} className="user" onClick={handleUserClick}>
          {index + 1}. {competitor.username}{' '}
          <span className="user-eliminated">{competitor.eliminated ? 'Eliminated' : ''}</span>
        </span>
        <span>{competitor.score}</span>
      </li>
    ));
  }

  if (tournament.enrolledTeams && tournament.enrolledUsers.length === 0) {
    const sortedTeams = sortParticipants(tournament.enrolledTeams);
    members = sortedTeams.map((competitor, index) => (
      <li key={competitor.teamName}>
        <span data-teamname={competitor.teamName} className="team" onClick={handleTeamClick}>
          {index + 1}. {competitor.teamName}{' '}
          <span className="user-eliminated">{competitor.eliminated ? 'Eliminated' : ''}</span>
        </span>
        <span>{competitor.score}</span>
      </li>
    ));
  }

  console.log(members);

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
      {(tournament.enrolledUsers?.length || tournament.enrolledTeams?.length) > 0 ? (
        <>
          <div className="table-header">
            <span>Username</span>
            <span>Score</span>
          </div>
          <ul className="user-list">{members}</ul>
        </>
      ) : (
        <div className="table-header">No users currently enrolled</div>
      )}
    </div>
  );
};

export default BattleRoyale;
