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

  const [status, setStatus] = useState('')

  async function run(label, path, method) {
    setStatus(`${label}…`)
    const response = await fetch(path, { method, credentials: 'include' })
    const data = await response.json().catch(() => null)
    setStatus(
      response.ok
        ? `${label}: ${JSON.stringify(data)}`
        : `${label} failed — ${data?.error?.message ?? response.status}`
    )
  }

  const createTestUsers = () => run('Create users', '/api/admin/users', 'POST')
  const deleteUsers = () => run('Delete users', '/api/admin/users', 'DELETE')
  const createTournaments = () => run('Create tournaments', '/api/admin/tournaments', 'POST')
  const deleteAllTournaments = () => run('Delete tournaments', '/api/admin/tournaments', 'DELETE')

  return (
    <div id="main">
      <button id="btn_createTestUsers" onClick={() => createTestUsers()}>Create Test Users</button>
      <button id="btn_deleteUsers" onClick={() => deleteUsers()}>Delete Users</button>
      <button id="btn_createTournaments" onClick={() => createTournaments()}>Create Tournaments</button>
      <button id="btn_deleteAllTournaments" onClick={() => deleteAllTournaments()}>Delete All Tournaments</button>
      <p className="status">{status}</p>
    </div>
  );
}

export default Main;
