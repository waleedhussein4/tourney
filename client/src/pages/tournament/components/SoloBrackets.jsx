/* eslint-disable react/prop-types */
import { Bracket, Seed, SeedItem, SeedTeam } from 'react-brackets';
import '../styles/Brackets.css';
import Leaderboard from './Leaderboard';

const handlePlayerClick = (e) => {
  if(e.target.classList.contains('tba')) {
    return;
  }
  window.location.href = `/profile/${e.target.innerText}`;
};

const CustomSeed = ({ seed, breakpoint, roundIndex, seedIndex }) => {
  // breakpoint passed to Bracket component
  // to check if mobile view is triggered or not

  // mobileBreakpoint is required to be passed down to a seed
  console.log('Seed: ' + JSON.stringify(seed))
  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
      <SeedItem>
        <div>
          <SeedTeam onClick={handlePlayerClick} className={['player', seed.users[0].eliminated && 'eliminated', !seed.users[0]?.username && 'tba']}>{seed.users[0]?.username || 'TBA '}</SeedTeam>
          <SeedTeam onClick={handlePlayerClick} className={['player', seed.users[1].eliminated && 'eliminated', !seed.users[1]?.username && 'tba']}>{seed.users[1]?.username || 'TBA '}</SeedTeam>
        </div>
      </SeedItem>
    </Seed>
  );
};

const BracketsComponent = ({ tournament }) => {

  const getUserScore = (username) => {
    const user = tournament.enrolledUsers.find(user => user.username === username);
    return user ? user.score : null; // Return team score if found, otherwise null
  };

  const generateRoundsFromUsers = (users) => {
    console.log('Users: ' + JSON.stringify(users))
    let matches = 0;
    let rounds = [];
    let currentRoundUsers = [...users];
    while (currentRoundUsers.length > 1) {
      const roundMatches = [];
      const nextRoundUsers = [];
      for (let i = 0; i < currentRoundUsers.length; i += 2) {
        if (i + 1 < currentRoundUsers.length) {
          const user1 = currentRoundUsers[i];
          const user2 = currentRoundUsers[i + 1];
          roundMatches.push({
            users: [
              { username: user1?.username || '', eliminated: (tournament.matches[matches] === user2?.username && tournament.matches[matches]) },
              { username: user2?.username || '', eliminated: (tournament.matches[matches] === user1?.username && tournament.matches[matches]) }
            ],
            onClick: () => { }
          });
          // Assuming the first team always wins for demonstration; replace this logic with actual match results
          const nextRoundWinner = tournament.matches[matches]
          const findWinner = currentRoundUsers.find(user => user?.username === nextRoundWinner);
          nextRoundUsers.push(findWinner);
          matches++;
        }
      }
      rounds.push({ title: `Round ${rounds.length + 1}`, seeds: roundMatches });
      currentRoundUsers = nextRoundUsers;
    }

    rounds.forEach(round => {
      round.seeds.forEach(seed => {
        seed.users.forEach(user => {
          const score = getUserScore(user.username);
          user.score = score; // Add score attribute with initial value
        });
      });
    });


    return rounds;
  };

  const usersWithPlaceholders = [...tournament.enrolledUsers]
  for (let i = 0; i < tournament.maxCapacity / tournament.teamSize; i++) {
    if (!tournament.enrolledUsers[i]) {
      usersWithPlaceholders.push({ username: undefined });
    }
  }

  const rounds = generateRoundsFromUsers(usersWithPlaceholders);

  return (
    <div className="brackets-container">
      <Bracket renderSeedComponent={CustomSeed} rounds={rounds} />
      <Leaderboard tournament={tournament} />
    </div>
  );
};

export default BracketsComponent;
