import Team from "./Team"

function Display(props) {
  return (
    <div id="display">
      <h1>Your teams</h1>
      <div className="teams">
        {props.teams.map((team) => <Team key={team.UUID} team={team} />)}
      </div>
    </div>
  )
}

export default Display