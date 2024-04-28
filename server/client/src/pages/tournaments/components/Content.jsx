/* eslint-disable react/prop-types */
import Tournament from './Tournament';

function Content({ filteredTourneys }) {
  return (
    <div id="content">
      <h1>Tournaments</h1>
      <div id="tournaments">{filteredTourneys.map((tourney) => <Tournament key={tourney.UUID} obj={tourney} />)}</div>
    </div>
  )
}

export default Content