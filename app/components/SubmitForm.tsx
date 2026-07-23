"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Member, Status, Team } from "../types";
import NameCombobox from "./NameCombobox";
import UpdateEditor, { UpdateEditorHandle } from "./UpdateEditor";
import { formatDateKey } from "@/lib/time";

type Props = {
  teams: Team[];
  members: Member[];
  status: Status | null;
  onSubmitted: () => void;
};

export default function SubmitForm({ teams, members, status, onSubmitted }: Props) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [previous, setPrevious] = useState<
    { body: string; date_key: string } | null
  >(null);
  const editorRef = useRef<UpdateEditorHandle>(null);

  const closed = status ? !status.isOpen : false;

  // Fetch the selected person's most recent past update to help them recall.
  useEffect(() => {
    setPrevious(null);
    if (!memberId) return;
    let cancelled = false;
    fetch(`/api/updates/previous?memberId=${encodeURIComponent(memberId)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setPrevious(d.previous ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  function addPreviousToUpdate() {
    if (!previous) return;
    const lines = previous.body.split("\n").filter((l) => l.trim().length > 0);
    editorRef.current?.appendItems(lines, { keepVerbatimWhenEmpty: true });
  }

  // Role is auto-detected from the picked name via member.team_id → team.name.
  const roleName = useMemo(() => {
    if (!memberId) return "";
    const m = members.find((x) => x.id === memberId);
    if (!m) return "";
    return teams.find((t) => t.id === m.team_id)?.name ?? "";
  }, [memberId, members, teams]);

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
        <label className="field-label">Name</label>
        <NameCombobox
          members={members}
          teams={teams}
          value={memberId}
          onChange={setMemberId}
          disabled={closed}
        />
      </div>

      <div className="field">
        <label className="field-label">Role</label>
        <div className="readonly-box" style={{ color: roleName ? undefined : "var(--muted)" }}>
          {roleName || "Auto-detected once you select your name"}
        </div>
      </div>

      {previous && (
        <div className="field">
          <div className="prev-panel">
            <div className="row between" style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: "0.9rem" }}>
                Your last update — {formatDateKey(previous.date_key)}
              </strong>
              <button
                type="button"
                className="btn small"
                onClick={addPreviousToUpdate}
                disabled={closed}
              >
                ＋ Add to my update
              </button>
            </div>
            <div className="prev-body">{previous.body}</div>
            <p className="note" style={{ marginTop: 6 }}>
              Adds this below whatever you&apos;ve already written — then edit freely.
            </p>
          </div>
        </div>
      )}

      <div className="field">
        <label className="field-label">Daily Update</label>
        <UpdateEditor
          ref={editorRef}
          value={body}
          onChange={setBody}
          disabled={closed}
        />
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
