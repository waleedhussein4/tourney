/* eslint-disable react/prop-types */
const BattleRoyale = ({ tournament }) => {

  let members

  if(tournament.enrolledUsers && tournament.enrolledTeams.length === 0) {
    console.log('enrolledUsers')
    members = tournament.enrolledUsers.map((competitor, index) => (
      <li key={index}>
        <span>{index + 1}. {competitor.username} <span className="user-eliminated">{competitor.eliminated ? 'Eliminated' : ''}</span></span>
        <span>{competitor.score}</span>
      </li>
    ));
  }

  if(tournament.enrolledTeams && tournament.enrolledUsers.length === 0) {
    console.log('enrolledTeams')
    members = tournament.enrolledTeams.map((competitor, index) => (
      <li key={competitor.teamName}>
        <span>{index + 1}. {competitor.teamName} <span className="user-eliminated">{competitor.eliminated ? 'Eliminated' : ''}</span></span>
        <span>{competitor.score}</span>
      </li>
    ));
  }

  console.log(members)
  
  return (
    <div className="battle-royale">
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
