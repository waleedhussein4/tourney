/* eslint-disable react/prop-types */
const BattleRoyale = ({ tournament }) => {
  
  return (
    <div className="battle-royale">
      <h1>Status: {tournament.hasStarted ? 'Ongoing' : 'Offline'}</h1>
      { tournament.data.enrolledParticipants.length > 0 ?
      <>
        <div className="table-header">
          <span>Username</span>
          <span>Score</span>
        </div>
        <ul className="user-list">
          {tournament.data.enrolledParticipants.map((competitor, index) => (
            <li key={competitor.teamName || competitor.players[0]}>
              <span>{index + 1}. {competitor.teamName || competitor.players[0].username} <span className="user-eliminated">{competitor.eliminated ? 'Eliminated' : ''}</span></span>
              <span>{competitor.score}</span>
            </li>
          ))}
        </ul>
      </>
      :
      <div className="table-header">No users currently enrolled</div>
      }
    </div>
  );
};

export default BattleRoyale;
