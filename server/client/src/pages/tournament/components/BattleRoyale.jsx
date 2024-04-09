/* eslint-disable react/prop-types */
const BattleRoyale = ({ tournament }) => {

  const data = tournament.data  
  
  return (
    <div className="battle-royale">
      <h1>Status: {tournament.hasStarted ? 'Ongoing' : 'Offline'}</h1>
      { data.users.length > 0 ?
      <>
        <div className="table-header">
          <span>Username</span>
          <span>Score</span>
        </div>
        <ul className="user-list">
          {data.users.map((competitor, index) => (
            <li key={competitor.userName}>
              <span>{index + 1}. {competitor.userName} <span className="user-eliminated">{competitor.eliminated ? 'Eliminated' : ''}</span></span>
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
