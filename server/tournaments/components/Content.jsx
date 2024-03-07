import Tournament from './Tournament';

function Content(props) {

  const arrayDataItems = props.data.map((tourney) => <Tournament key={tourney.UUID} obj={tourney} />)

  return (
    <div id="content">
      <h1>Tournaments</h1>
      <div id="tournaments">
        {arrayDataItems}
      </div>
    </div>
  )
}

export default Content