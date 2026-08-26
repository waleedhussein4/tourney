import { Nav } from '/src/components/layout/Nav.jsx'
import "./styles/App.css";
import crown from "./assets/crown.webp";
import { ConfirmationPopup } from "../../../components/ConfirmationPopup";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ViewTeam() {
  const navigate = useNavigate();
  const teamId = new URLSearchParams(window.location.search).get("UUID");

  const [team, setTeam] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  // The one pending destructive action, or null. Holds a label and the callback
  // to run on confirm, so a single popup serves delete, leave, kick and promote.
  const [pending, setPending] = useState(null);

  const fetchTeam = useCallback(async () => {
    const response = await fetch(`/api/teams/${teamId}`, { credentials: "include" });
    if (!response.ok) {
      navigate("/page-not-found");
      return;
    }
    const data = await response.json();
    setTeam(data.team);
    setLoadingTeam(false);
  }, [teamId, navigate]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  async function send(path, options) {
    setError(null);
    const response = await fetch(path, { credentials: "include", ...options });
    if (response.ok) return true;
    const data = await response.json().catch(() => null);
    setError(data?.error?.message ?? "Something went wrong");
    return false;
  }

  const deleteTeam = () =>
    setPending({
      message: "Delete this team? This cannot be undone.",
      run: async () => {
        if (await send(`/api/teams/${teamId}`, { method: "DELETE" })) navigate("/team");
      },
    });

  const leaveTeam = () =>
    setPending({
      message: "Leave this team?",
      run: async () => {
        if (await send(`/api/teams/${teamId}/leave`, { method: "POST" })) navigate("/team");
      },
    });

  const kickMember = (username) =>
    setPending({
      message: `Remove ${username} from the team?`,
      run: async () => {
        if (await send(`/api/teams/${teamId}/members/${encodeURIComponent(username)}`, { method: "DELETE" })) {
          await fetchTeam();
        }
      },
    });

  const promoteMember = (username) =>
    setPending({
      message: `Make ${username} the team leader?`,
      run: async () => {
        const ok = await send(`/api/teams/${teamId}/leader`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        if (ok) await fetchTeam();
      },
    });

  const inviteLink = team
    ? `${import.meta.env.VITE_FRONTEND_URL ?? window.location.origin}/team/join/${team.joinCode}`
    : "";

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
  }

  if (loadingTeam || !team) {
    return (
      <div id="ViewTeam">
        <Nav />
        <div id="main">
          <h1>LOADING ...</h1>
        </div>
      </div>
    );
  }

  return (
    <div id="ViewTeam">
      <Nav />
      <div id="main">
        <div id="team">
          <h1>{team.name}</h1>
          <div className="members">
            <span>Members</span>
            {team.members.map((member) => (
              <Member
                key={member.id}
                member={member}
                viewerIsLeader={team.isLeader}
                onKick={() => kickMember(member.username)}
                onPromote={() => promoteMember(member.username)}
              />
            ))}
          </div>
          <div className="invite">
            <span className="invite-title">Share this link to invite others to your team</span>
            <div className="invite-link">
              <span>{inviteLink}</span>
              <button className="copyBtn" onClick={copyLink}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          {team.isLeader ? (
            <button onClick={deleteTeam} className="deleteTeam">
              Delete Team
            </button>
          ) : (
            <button onClick={leaveTeam} className="leaveTeam">
              Leave Team
            </button>
          )}
        </div>
      </div>
      {pending && (
        <ConfirmationPopup
          message={pending.message}
          onConfirm={() => {
            pending.run();
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

function Member({ member, viewerIsLeader, onKick, onPromote }) {
  return (
    <div className="member">
      <div className="nameWrapper">
        <span className="name">{member.username}</span>
        {member.isLeader && <img className="crown" src={crown} alt="Team leader" />}
      </div>
      <div className="buttonsWrapper">
        {viewerIsLeader && !member.isLeader && (
          <>
            <button onClick={onKick} className="kickButton">
              Kick
            </button>
            <button onClick={onPromote} className="promoteButton">
              Transfer Leadership
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ViewTeam;
