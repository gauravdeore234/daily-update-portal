"use client";

import { useState } from "react";
import type { Member, Team } from "../types";

type Props = {
  teams: Team[];
  members: Member[];
  onChanged: () => void;
};

export default function ManageTeam({ teams, members, onChanged }: Props) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newTeam, setNewTeam] = useState("");
  const [newMemberName, setNewMemberName] = useState<Record<string, string>>({});
  // Inline error shown right at the add-member row of a specific team, so a
  // scrolled-down user sees why the button "did nothing".
  const [memberError, setMemberError] = useState<Record<string, string>>({});

  async function call(action: string, payload: Record<string, string>) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Request failed.";
        setError(msg);
        if (res.status === 401) setUnlocked(false);
        return { ok: false, error: msg };
      }
      onChanged();
      return { ok: true };
    } catch {
      const msg = "Network error.";
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setBusy(false);
    }
  }

  async function unlock() {
    // Verify by attempting a harmless authorized read via a no-op action.
    // We use rename on nothing? Instead, just try add flow gating: simplest is to
    // mark unlocked and let the first real write validate. But give immediate
    // feedback by pinging with an invalid action (still auth-checked first).
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ action: "__ping__" }),
      });
      // 401 = wrong password; 400 = password OK but unknown action (expected).
      if (res.status === 401) {
        setError("Incorrect admin password.");
        setUnlocked(false);
      } else {
        setUnlocked(true);
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="panel">
        <label className="field-label">Admin password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
          placeholder="Enter admin password to manage the team"
        />
        {error && <div className="banner error" style={{ marginTop: 12 }}>{error}</div>}
        <button className="btn" style={{ marginTop: 12 }} onClick={unlock} disabled={busy}>
          Unlock
        </button>
      </div>
    );
  }

  const sortedTeams = [...teams].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      {error && <div className="banner error">{error}</div>}

      <div className="panel">
        <label className="field-label">Add a new team</label>
        <div className="row">
          <input
            type="text"
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value)}
            placeholder="e.g. Design"
            style={{ flex: 1 }}
          />
          <button
            className="btn small"
            disabled={busy || !newTeam.trim()}
            onClick={async () => {
              if ((await call("add_team", { name: newTeam.trim() })).ok)
                setNewTeam("");
            }}
          >
            Add team
          </button>
        </div>
      </div>

      {sortedTeams.map((team) => {
        const teamMembers = members.filter((m) => m.team_id === team.id);
        return (
          <div className="panel" key={team.id}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <input
                type="text"
                defaultValue={team.name}
                style={{ flex: 1, fontWeight: 700 }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== team.name) call("rename_team", { id: team.id, name: v });
                }}
              />
              <button
                className="btn danger small"
                disabled={busy}
                onClick={() => {
                  if (confirm(`Delete team "${team.name}" and all its members?`))
                    call("delete_team", { id: team.id });
                }}
              >
                Delete team
              </button>
            </div>

            {teamMembers.map((m) => (
              <div className="member-row" key={m.id}>
                <input
                  type="text"
                  defaultValue={m.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== m.name) call("rename_member", { id: m.id, name: v });
                  }}
                />
                <button
                  className="btn danger small"
                  disabled={busy}
                  onClick={() => {
                    if (confirm(`Remove ${m.name}?`))
                      call("delete_member", { id: m.id });
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="row" style={{ marginTop: 12 }}>
              <input
                type="text"
                placeholder="New member name"
                value={newMemberName[team.id] ?? ""}
                onChange={(e) => {
                  setNewMemberName((s) => ({ ...s, [team.id]: e.target.value }));
                  setMemberError((s) => ({ ...s, [team.id]: "" }));
                }}
                style={{ flex: 1 }}
              />
              <button
                className="btn small"
                disabled={busy || !(newMemberName[team.id] ?? "").trim()}
                onClick={async () => {
                  const name = (newMemberName[team.id] ?? "").trim();
                  const r = await call("add_member", { teamId: team.id, name });
                  if (r.ok) {
                    setNewMemberName((s) => ({ ...s, [team.id]: "" }));
                    setMemberError((s) => ({ ...s, [team.id]: "" }));
                  } else {
                    setMemberError((s) => ({ ...s, [team.id]: r.error ?? "" }));
                  }
                }}
              >
                Add member
              </button>
            </div>
            {memberError[team.id] && (
              <div className="banner error" style={{ marginTop: 10, marginBottom: 0 }}>
                {memberError[team.id]}
              </div>
            )}
          </div>
        );
      })}
      <p className="note">
        Renames save when you tap outside the field. Changes appear immediately in
        the Submit tab.
      </p>
    </div>
  );
}
