function Team(props) {
  let obj = props.team
  let teamLink = `/team/view/?UUID=${obj.UUID}`
  return (
    <div className="team">
      <h3 className="name"><a href={teamLink}>{obj.name}</a></h3>
      <button className="view" onClick={() => {location.href = teamLink}}>View</button>
    </div>
  )
}

export default Team