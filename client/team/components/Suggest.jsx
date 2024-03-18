function Suggest() {
  return (
    <div id="suggest">
      <h1>You are not part of any teams ... yet.</h1>
      <div className="join">
        <h2>Join a team</h2>
        <form id="joinTeam" action="" method="POST">
          <label htmlFor="teamLink">Enter team ID </label>
          <input type="text" id="teamLink" />
          <button>Join</button>
        </form>
      </div>
      <div className="create">
        <h2>Create a team</h2>
        <form id="createTeam" action="" method="POST">
          <label htmlFor="teamName">Team name </label>
          <input type="text" id="teamName" />
          <button>Create</button>
        </form>
      </div>
    </div>
  )
}

export default Suggest