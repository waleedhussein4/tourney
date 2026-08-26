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

  const seedDemoData = () => run('Seed demo data', '/api/admin/seed', 'POST')
  const clearDemoData = () => run('Clear demo data', '/api/admin/seed', 'DELETE')

  return (
    <div id="main">
      <button id="btn_seedDemoData" onClick={() => seedDemoData()}>Seed Demo Data</button>
      <button id="btn_clearDemoData" onClick={() => clearDemoData()}>Clear Demo Data</button>
      <p className="status">{status}</p>
    </div>
  );
}

export default Main;
