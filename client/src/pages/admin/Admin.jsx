import { useAuth } from '/src/features/auth/useAuth.js'
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

function Main() {
  const { isAuthenticated, isAdmin } = useAuth()

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated === undefined) return
    if (!isAuthenticated) {
      navigate('/page-not-found')
    }

    if(isAdmin === undefined) return
    if(!isAdmin) {
      navigate('/page-not-found')
    }
  }, [isAuthenticated, isAdmin]);

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
