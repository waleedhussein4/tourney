/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Bracket, Seed, SeedItem, SeedTeam } from 'react-brackets';
import '../styles/Brackets.css';
import Leaderboard from './Leaderboard';

const TeamUserListPopup = ({ teamName, players, onClose }) => {
  console.log(players)
  return (
    <div className="team-user-list-popup">
      <h2>{teamName || "Unknown Team"}</h2>
      <ul>
        {players.map(player => (
          <li className='player' key={player.username} onClick={() => (window.location.href = `/profile/${player.username}`)}>
            {player.username}
          </li>
        ))}
      </ul>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

const BracketsComponent = ({ tournament }) => {

  const CustomSeed = ({ seed, breakpoint, roundIndex, seedIndex }) => {
    // breakpoint passed to Bracket component
    // to check if mobile view is triggered or not
  
    // mobileBreakpoint is required to be passed down to a seed
    console.log('Seed: ' + JSON.stringify(seed))
    return (
      <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
        <SeedItem>
          <div>
            <SeedTeam onClick={handleTeamClick} className={['team', seed.teams[0].eliminated && 'eliminated', !seed.teams[0]?.name && 'tba']}>{seed.teams[0]?.name || 'TBA '}</SeedTeam>
            <SeedTeam onClick={handleTeamClick} className={['team', seed.teams[1].eliminated && 'eliminated', !seed.teams[1]?.name && 'tba']}>{seed.teams[1]?.name || 'TBA '}</SeedTeam>
          </div>
        </SeedItem>
      </Seed>
    );
  };

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleTeamClick = (e) => {
    if (e.target.classList.contains('tba')) {
      return;
    }
    const teamName = e.target.innerText;
    console.log('Team Clicked: ' + teamName)
    const team = tournament.enrolledTeams.find(t => t.teamName === teamName);
    console.log('Team: ' + JSON.stringify(team))
    setSelectedTeam(team);
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedTeam(null);
  };

  const getTeamScore = (teamName) => {
    const team = tournament.enrolledTeams.find(team => team.teamName === teamName);
    return team ? team.score : null; // Return team score if found, otherwise null
  };

  const generateRoundsFromTeams = (teams) => {
    let matches = 0;
    let rounds = [];
    let currentRoundTeams = [...teams];
    while (currentRoundTeams.length > 1) {
      const roundMatches = [];
      const nextRoundTeams = [];
      for (let i = 0; i < currentRoundTeams.length; i += 2) {
        if (i + 1 < currentRoundTeams.length) {
          const team1 = currentRoundTeams[i];
          const team2 = currentRoundTeams[i + 1];
          roundMatches.push({
            teams: [
              { name: team1?.teamName || '', eliminated: (tournament.matches[matches] === team2?.teamName && tournament.matches[matches]) },
              { name: team2?.teamName || '', eliminated: (tournament.matches[matches] === team1?.teamName && tournament.matches[matches]) }
            ],
            onClick: () => { }
          });
          // Assuming the first team always wins for demonstration; replace this logic with actual match results
          const nextRoundWinner = tournament.matches[matches]
          const findWinner = currentRoundTeams.find(team => team?.teamName === nextRoundWinner);
          nextRoundTeams.push(findWinner);
          matches++;
        }
      }
      rounds.push({ title: `Round ${rounds.length + 1}`, seeds: roundMatches });
      currentRoundTeams = nextRoundTeams;
    }

    rounds.forEach(round => {
      round.seeds.forEach(seed => {
        seed.teams.forEach(team => {
          const score = getTeamScore(team.name);
          team.score = score; // Add score attribute with initial value
        });
      });
    });


    return rounds;
  };


  const teamsWithPlaceholders = [...tournament.enrolledTeams]
  for (let i = 0; i < tournament.maxCapacity / tournament.teamSize; i++) {
    if (!tournament.enrolledTeams[i]) {
      teamsWithPlaceholders.push({ teamName: undefined, players: [] });
    }
  }


  const rounds = generateRoundsFromTeams(teamsWithPlaceholders);

  return (
    <div className="brackets-container">
      <Bracket renderSeedComponent={CustomSeed} rounds={rounds} />
      <Leaderboard tournament={tournament} setPopup={setIsPopupOpen} />
      {isPopupOpen && selectedTeam && (
        <TeamUserListPopup
          teamName={selectedTeam.teamName}
          players={selectedTeam.players}
          onClose={handlePopupClose}
        />
      )}
    </div>
  );
};

export default BracketsComponent;
