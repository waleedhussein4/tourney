/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Bracket, Seed, SeedItem, SeedTeam } from 'react-brackets';
import '../styles/Brackets.css';

const TeamUserListPopup = ({ teamName, players, onClose }) => {
  return (
    <div className="team-user-list-popup">
      <h2>{teamName || "Unknown Team"} Users</h2>
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

const winners = [
  "Team 2",
  "Team 4",
  "Team 5",
  "Team 8",
  "Team 2",
  "Team 5",
  "Team 5"
]

const CustomSeed = ({seed, breakpoint, roundIndex, seedIndex}) => {
  // breakpoint passed to Bracket component
  // to check if mobile view is triggered or not

  // mobileBreakpoint is required to be passed down to a seed
  console.log(seed, "seed")
  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
      <SeedItem>
        <div>
          <SeedTeam className={seed.teams[0].eliminated && 'eliminated' }>{seed.teams[0]?.name || 'TBA '}</SeedTeam>
          <SeedTeam className={seed.teams[1].eliminated && 'eliminated' }>{seed.teams[1]?.name || 'TBA '}</SeedTeam>
          {/* <SeedTeam>{seed.teams[0]?.name || 'NO TEAM '}</SeedTeam>
          <SeedTeam>{seed.teams[1]?.name || 'NO TEAM '}</SeedTeam> */}
        </div>
      </SeedItem>
    </Seed>
  );
};

const BracketsComponent = ({ tournament }) => {

  // tournament.enrolledTeams = [
  //   {
  //     teamName: "Team 1",
  //     players: [
  //       {
  //         UUID: "9410f264-0bef-4516-b3ea-661c575490f2",
  //       },
  //       {
  //         UUID: "9410f264-0bef-4516-b3ea-661c575492f2",
  //       }
  //     ],
  //     score: 0,
  //     eliminated: true
  //   },
  //   {
  //     teamName: "Team 2",
  //     players: [
  //       {
  //         UUID: "9410f264-0bef-4516-b3e4-661c575690f2",
  //       },
  //       {
  //         UUID: "9410f264-0bef-4516-b3e2-661c575692f2",
  //       }
  //     ],
  //     score: 0,
  //     eliminated: false
  //   },
  //   {
  //     teamName: "Team 3",
  //     players: [
  //       {
  //         UUID: "9410f264-0bef-4516-b3e4-661c575690f2",
  //       },
  //       {
  //         UUID: "9410f264-0bef-4516-b3e2-661c575692f2",
  //       }
  //     ],
  //     score: 0,
  //     eliminated: false
  //   },
  //   {
  //     teamName: "Team 4",
  //     players: [
  //       {
  //         UUID: "9410f264-0bef-4516-b3e4-661c575690f2",
  //       },
  //       {
  //         UUID: "9410f264-0bef-4516-b3e2-661c575692f2",
  //       }
  //     ],
  //     score: 0,
  //     eliminated: false
  //   },
  //   {
  //     teamName: "Team 5",
  //     players: [
  //       {
  //         UUID: "9410f264-0bef-4516-b3e4-661c575690f2",
  //       },
  //       {
  //         UUID: "9410f264-0bef-4516-b3e2-661c575692f2",
  //       }
  //     ],
  //     score: 0,
  //     eliminated: false
  //   },
  //   {
  //     teamName: "Team 6",
  //     players: [
  //       {
  //         UUID: "9410f264-0bef-4516-b3e4-661c575690f2",
  //       },
  //       {
  //         UUID: "9410f264-0bef-4516-b3e2-661c575692f2",
  //       }
  //     ],
  //     score: 0,
  //     eliminated: false
  //   },
  //   {
  //     teamName: "Team 7",
  //     players: [
  //       {
  //         UUID: "9410f264-0bef-4516-b3e4-661c575690f2",
  //       },
  //       {
  //         UUID: "9410f264-0bef-4516-b3e2-661c575692f2",
  //       }
  //     ],
  //     score: 0,
  //     eliminated: false
  //   },
  //   {
  //     teamName: "Team 8",
  //     players: [
  //       {
  //         UUID: "9410f264-0bef-4516-b3e4-661c575690f2",
  //       },
  //       {
  //         UUID: "9410f264-0bef-4516-b3e2-661c575692f2",
  //       }
  //     ],
  //     score: 0,
  //     eliminated: false
  //   }
  // ]

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleTeamClick = (teamName) => {
    const team = tournament.enrolledTeams.find(t => t.teamName === teamName);
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
    console.log(currentRoundTeams, "currentRoundTeams")
    while (currentRoundTeams.length > 1) {
      const roundMatches = [];
      const nextRoundTeams = [];
      for (let i = 0; i < currentRoundTeams.length; i += 2) {
        if (i + 1 < currentRoundTeams.length) {
          const team1 = currentRoundTeams[i];
          const team2 = currentRoundTeams[i + 1];
          console.log(team1, team2, "team1, team2")
          roundMatches.push({
            teams: [
              { name: team1?.teamName || '', eliminated: (tournament.matches[matches] === team2?.teamName) },
              { name: team2?.teamName || '', eliminated: (tournament.matches[matches] === team1?.teamName) }
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
    console.log('rounds', rounds)

    rounds.forEach(round => {
      round.seeds.forEach(seed => {
        seed.teams.forEach(team => {
          const score = getTeamScore(team.name);
          team.score = score; // Add score attribute with initial value
        });
      });
    });

    console.log('rounds', rounds)

    return rounds;
  };

  console.log(tournament.enrolledTeams, "tournament.enrolledTeams")
  const rounds = generateRoundsFromTeams(tournament.enrolledTeams);

  return (
    <div className="brackets-container">
      <Bracket renderSeedComponent={CustomSeed} rounds={rounds} />
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
