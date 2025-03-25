/* eslint-disable react/prop-types */

import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

function Main({ teams, loadingTeams }) {
  return (
    <>
      <div id="main">
        { (loadingTeams) ? <h1>LOADING ...</h1>
        :
        Array.from(teams).length > 0 ? <MyTeams teams={teams} /> : <Suggest teams={teams} /> }
      </div>
    </>
  )
}


function MyTeams({ teams }) {

  const [createError, setCreateError] = useState('')

  const navigate = useNavigate()

  function joinTeam() {

    const teamCode = document.getElementById('teamCode').value.match(/[a-zA-Z0-9]{6}$/)
    navigate('/team/join/' + teamCode)
  
  }

  async function createTeam() {
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/team/create`
    let teamName = document.getElementById('teamName').value
    console.log("Creating team: ", teamName)
  
    await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: teamName }),
      credentials: 'include'
    })
    .then(res => {
      if(res.ok) {
        navigate(0)
      }
      return res.json()
    })
    .then(data => {
      setCreateError(data.message)
    })
  }
  
  return (
    <div id="display">
      <h1>My Teams</h1>
      <div className="teams">
        {teams.map((team) => <Team key={team.UUID} team={team} />)}
      </div>
      <div className="create-join">
        <div className="create">
          <h2>Create a team</h2>
          <div id="createTeam" className="form">
            <label htmlFor="teamName">Team name </label>
            <input type="text" id="teamName" />
            <button onClick={createTeam}>Create</button>
          </div>
        </div>
        <div className="join">
          <h2>Join a team</h2>
          <div id="joinTeam" className="form">
            <label htmlFor="teamName">Team link or code </label>
            <input type="text" id="teamCode" />
            <button onClick={joinTeam}>Join</button>
          </div>
        </div>
      </div>
      <span className='createError'>{createError}</span>
    </div>
  )
}

function Team({ team }) {
  let teamLink = `/team/view/?UUID=${team.UUID}`
  return (
    <div className="team">
      <h3 className="name"><a href={teamLink}>{team.name}</a></h3>
      <button className="view" onClick={() => {location.href = teamLink}}>View</button>
    </div>
  )
}

function Suggest() {

  const [createError, setCreateError] = useState('')

  const navigate = useNavigate()

  function joinTeam() {

    const teamCode = document.getElementById('teamLink').value.match(/[a-zA-Z0-9]{6}$/)
    navigate('/team/join/' + teamCode)
  
  }

  async function createTeam() {
    const URL = `${import.meta.env.VITE_BACKEND_URL}/api/team/create`
    let teamName = document.getElementById('teamName').value
    console.log("Creating team: ", teamName)
  
    await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: teamName }),
      credentials: 'include'
    })
    .then(res => {
      if(res.ok) {
        navigate(0)
      }
      return res.json()
    })
    .then(data => {
      setCreateError(data.message)
    })
  }

  return (
    <div id="suggest">
      <h1>You are not part of any teams ... yet.</h1>
      <div className="join">
        <h2>Join a team</h2>
        <div id="joinTeam" className="form">
          <label htmlFor="teamLink">Enter team code </label>
          <input type="text" id="teamLink" />
          <button onClick={joinTeam}>Join</button>
        </div>
      </div>
      <div className="create">
        <h2>Create a team</h2>
        <div id="createTeam" className="form">
          <label htmlFor="teamName">Team name </label>
          <input type="text" id="teamName" />
          <button onClick={createTeam}>Create</button>
        </div>
      </div>
      <span className='createError'>{createError}</span>
    </div>
  )
}

export default Main