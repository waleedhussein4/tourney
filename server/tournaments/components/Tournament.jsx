function Tournament(obj) {
  obj=obj.obj
  let tournamentLink = `/tournament/?UUID=${obj.UUID}`
  return (
    <div className="tournament">
      <h3 className="title"><a href={tournamentLink}>{obj.title}</a></h3>
      <span className="startDate">{new Date(obj.startDate).toDateString()}</span>
      <span className="capacity">Capacity: {obj.enrolledUsers.length}/{obj.maxCapacity}</span>
      <button className="view" onClick={() => {location.href = tournamentLink}}>View</button>
    </div>
  )
}

export default Tournament