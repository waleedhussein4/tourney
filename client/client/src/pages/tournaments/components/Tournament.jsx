function Tournament(obj) {
  obj = obj.obj;
  let tournamentLink = `/tournament/${obj.UUID}`;
  return (
    <div className="tournament">
      <div className="title">
        <a href={tournamentLink}>{obj.title}</a>
      </div>
      <div className="content">
        <span className="startDate">Date: {new Date(obj.startDate).toDateString()}</span>
        <span className="capacity">Capacity: {obj.enrolledUsers.length}/{obj.maxCapacity}</span>
        <span className="entryFee">Entry fee: ${obj.entryFee}</span>
        <span className="type">Type: {obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}</span>
        <span className="accessibility">Accessibility: {obj.accessibility.charAt(0).toUpperCase() + obj.accessibility.slice(1)}</span>
        <a className="view" href={tournamentLink}>View</a>
      </div>
    </div>
  );
}

export default Tournament;
