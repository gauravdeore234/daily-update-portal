"use client";

import { useCallback, useEffect, useState } from "react";
import type { Member, Status, Team, UpdateRow } from "./types";
import StatusPill from "./components/StatusPill";
import SubmitForm from "./components/SubmitForm";
import TodayBoard from "./components/TodayBoard";
import ManageTeam from "./components/ManageTeam";

type Tab = "submit" | "today" | "manage";

export default function Page() {
  const [tab, setTab] = useState<Tab>("submit");
  const [status, setStatus] = useState<Status | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [updates, setUpdates] = useState<UpdateRow[]>([]);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      setStatus(await res.json());
    } catch {
      /* keep last known */
    }
  }, []);

  const loadTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/team", { cache: "no-store" });
      const data = await res.json();
      setTeams(data.teams ?? []);
      setMembers(data.members ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadUpdates = useCallback(async () => {
    try {
      const res = await fetch("/api/updates", { cache: "no-store" });
      const data = await res.json();
      setUpdates(data.updates ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  // Initial load.
  useEffect(() => {
    loadStatus();
    loadTeam();
    loadUpdates();
  }, [loadStatus, loadTeam, loadUpdates]);

  // Poll status (clock/cutoff) every 30s and updates every 15s so concurrent
  // submissions show up without a manual reload.
  useEffect(() => {
    const s = setInterval(loadStatus, 30_000);
    const u = setInterval(loadUpdates, 15_000);
    return () => {
      clearInterval(s);
      clearInterval(u);
    };
  }, [loadStatus, loadUpdates]);

  return (
    <div className="container">
      <div className="header">
        <div className="row between">
          <h1>Daily Update</h1>
          <StatusPill status={status} />
        </div>
        <p className="subtitle">
          Submit your daily update. Resets to a clean slate each midnight IST.
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === "submit" ? "active" : ""}`}
          onClick={() => setTab("submit")}
        >
          Submit
        </button>
        <button
          className={`tab ${tab === "today" ? "active" : ""}`}
          onClick={() => {
            setTab("today");
            loadUpdates();
          }}
        >
          Today&apos;s Updates
        </button>
        <button
          className={`tab ${tab === "manage" ? "active" : ""}`}
          onClick={() => setTab("manage")}
        >
          Manage Team
        </button>
      </div>

      {tab === "submit" && (
        <SubmitForm
          teams={teams}
          members={members}
          status={status}
          onSubmitted={loadUpdates}
        />
      )}

      {tab === "today" && <TodayBoard teams={teams} updates={updates} />}

      {tab === "manage" && (
        <ManageTeam teams={teams} members={members} onChanged={loadTeam} />
      )}
    </div>
  );
}
