import { Nav } from '/src/components/layout/Nav.jsx'
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./Join.css";

function Join() {
  const [team, setTeam] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [error, setError] = useState(null);

  const { teamCode } = useParams();
  const navigate = useNavigate();

  const fetchTeam = useCallback(async () => {
    const response = await fetch(`/api/teams/code/${teamCode}`, { credentials: "include" });
    if (!response.ok) {
      setLoadingTeam(false);
      return;
    }
    const { team: found } = await response.json();
    setLoadingTeam(false);
    // Already on it — nothing to accept, so go straight to the team.
    if (found.isMember) {
      navigate(`/team/view/?UUID=${found.id}`);
      return;
    }
    setTeam(found);
  }, [teamCode, navigate]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  async function joinTeam() {
    setError(null);
    const response = await fetch(`/api/teams/join/${teamCode}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error?.message ?? "Could not join this team");
      return;
    }
    navigate(`/team/view/?UUID=${data.team.id}`);
  }

  return (
    <div id="JoinTeam">
      <Nav />
      {loadingTeam ? (
        <div id="main">
          <h1>LOADING ...</h1>
        </div>
      ) : (
        <div id="main">
          {!team ? (
            <h1>Team not found</h1>
          ) : (
            <>
              <h1>{team.name}</h1>
              <div className="prompt">
                <span>Do you want to join this team?</span>
                <button className="joinBtn" onClick={joinTeam}>
                  Join
                </button>
              </div>
              {error && <p className="error">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Join;
