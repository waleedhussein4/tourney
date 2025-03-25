import { useEffect, useState, useContext } from "react";
import { AuthContext } from "/src/context/AuthContext";
import { useNavigate } from "react-router-dom";

function Main() {
  const { loggedIn, isAdmin } = useContext(AuthContext)

  const navigate = useNavigate();

  useEffect(() => {
    if (loggedIn === undefined) return
    if (!loggedIn) {
      navigate('/page-not-found')
    }

    if(isAdmin === undefined) return
    if(!isAdmin) {
      navigate('/page-not-found')
    }
  }, [loggedIn, isAdmin]);

  async function createTestUsers() {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/createUsers`, {
      method: 'POST',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        console.log(data)
      })
  }

  async function deleteUsers() {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/deleteUsers`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        console.log(data)
      })
  }

  async function createTournaments() {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/createTournaments`, {
      method: 'POST',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        console.log(data)
      })
  }

  async function deleteAllTournaments() {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/deleteAllTournaments`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        console.log(data)
      })
  }

  return (
    <div id="main">
      <button id="btn_createTestUsers" onClick={() => createTestUsers()}>Create Test Users</button>
      <button id="btn_deleteUsers" onClick={() => deleteUsers()}>Delete Users</button>
      <button id="btn_createTournaments" onClick={() => createTournaments()}>Create Tournaments</button>
      <button id="btn_deleteAllTournaments" onClick={() => deleteAllTournaments()}>Delete All Tournaments</button>
    </div>
  );
}

export default Main;
