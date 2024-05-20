/* eslint-disable react/prop-types */
import Tournament from './Tournament';

function Content({ tournaments }) {
  return (
    <div id="content">
      <h1>Tournaments</h1>
      <div id="tournaments">{tournaments.map((tourney) => <Tournament key={tourney.UUID} obj={tourney} />)}</div>
    </div>
  )
}

export default Content