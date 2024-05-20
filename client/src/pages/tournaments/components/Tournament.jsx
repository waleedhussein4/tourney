function Tournament(obj) {
  obj = obj.obj;
  let tournamentLink = `/tournament/${obj.UUID}`;
  return (
    <div className="tournament">
      <div className="title">
        <a href={tournamentLink}>{obj.title}</a>
      </div>
      <div className="content">
        <span className="category">{obj.category}</span>
        <span className="startDate">Starts: {new Date(obj.startDate).toDateString()}</span>
        <span className="type">Type: {obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}</span>
        <span className="entryFee">Entry fee: {obj.entryFee === 0 ? 'None' : obj.entryFee === 1 ? obj.entryFee + ' credit' : obj.entryFee + ' credits'}</span>
        <span className="accessibility">{obj.accessibility.charAt(0).toUpperCase() + obj.accessibility.slice(1)}</span>
        <span className="capacity">{obj.enrolledUsers.length}/{obj.maxCapacity} players</span>
        <a className="view" href={tournamentLink}>View</a>
      </div>
    </div>
  );
}

export default Tournament;
