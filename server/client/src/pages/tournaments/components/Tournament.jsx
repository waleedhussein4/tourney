function Tournament(obj) {
  obj=obj.obj
  let tournamentLink = `/tournament/${obj.UUID}`
  return (
    <div className="tournament">
      <h3 className="title"><a href={tournamentLink}>{obj.title}</a></h3>
      <span className="startDate">{new Date(obj.startDate).toDateString()}</span>
      <span className="capacity">Capacity: {obj.enrolledUsers.length}/{obj.maxCapacity}</span>
      <span className="entryFee">Entry fee: ${obj.entryFee}</span>
      <span className="type">{obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}</span>
      <span className="accessibility">{obj.accessibility.charAt(0).toUpperCase() + obj.accessibility.slice(1)}</span>
      <button className="view" onClick={() => {location.href = tournamentLink}}>View</button>
    </div>
  )
}

export default Tournament