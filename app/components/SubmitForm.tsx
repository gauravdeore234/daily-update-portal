"use client";

import { useMemo, useState } from "react";
import type { Member, Status, Team } from "../types";
import NameCombobox from "./NameCombobox";
import UpdateEditor from "./UpdateEditor";

type Props = {
  teams: Team[];
  members: Member[];
  status: Status | null;
  onSubmitted: () => void;
};

export default function SubmitForm({ teams, members, status, onSubmitted }: Props) {
  const [teamId, setTeamId] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  const closed = status ? !status.isOpen : false;

  const teamMembers = useMemo(
    () => members.filter((m) => m.team_id === teamId),
    [members, teamId]
  );

  async function submit() {
    setResult(null);
    if (!memberId) {
      setResult({ type: "error", text: "Please select your name." });
      return;
    }
    if (!body.trim()) {
      setResult({ type: "error", text: "Please enter your update." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: "error", text: data.error ?? "Submission failed." });
      } else {
        setResult({
          type: "success",
          text: data.overwritten
            ? "Submitted. Your previous update for today was overwritten. It's now visible on the Today tab."
            : "Submitted! Your update is now visible on the Today tab.",
        });
        setBody("");
        setMemberId(null);
        onSubmitted();
      }
    } catch {
      setResult({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel">
      {closed && (
        <div className="banner warn">
          Submissions are closed for today (after 10:00 PM IST). They reopen after
          midnight IST for the new day.
        </div>
      )}

      <div className="field">
        <label className="field-label">Date &amp; Day</label>
        <div className="readonly-box">{status?.dateLabel ?? "…"}</div>
      </div>

      <div className="field">
        <label className="field-label">Role</label>
        <select
          value={teamId}
          disabled={closed}
          onChange={(e) => {
            setTeamId(e.target.value);
            setMemberId(null);
          }}
        >
          <option value="">Select a role…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label">Name</label>
        <NameCombobox
          members={teamMembers}
          value={memberId}
          onChange={setMemberId}
          disabled={closed || !teamId}
        />
      </div>

      <div className="field">
        <label className="field-label">Daily Update</label>
        <UpdateEditor value={body} onChange={setBody} disabled={closed} />
      </div>

      {result && (
        <div className={`banner ${result.type}`}>{result.text}</div>
      )}

      <button
        className="btn"
        onClick={submit}
        disabled={submitting || closed}
      >
        {submitting ? "Submitting…" : "Submit update"}
      </button>
      <p className="note">
        Re-submitting under your name overwrites your earlier update for today.
      </p>
    </div>
  );
}
