"use client";

import { useMemo } from "react";
import type { Team, UpdateRow } from "../types";
import CollatedMessage from "./CollatedMessage";
import { formatISTTimeFromISO } from "../clientTime";

type Props = {
  teams: Team[];
  updates: UpdateRow[];
};

export default function TodayBoard({ teams, updates }: Props) {
  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.sort_order - b.sort_order),
    [teams]
  );

  const hasAny = updates.length > 0;

  return (
    <div>
      <CollatedMessage teams={teams} updates={updates} />

      {!hasAny && (
        <div className="panel">
          <p className="note" style={{ marginTop: 0 }}>
            No updates submitted yet today. Submissions appear here live.
          </p>
        </div>
      )}

      {sortedTeams.map((team) => {
        const teamUpdates = updates.filter((u) => u.team_id === team.id);
        if (teamUpdates.length === 0) return null;
        return (
          <div className="panel team-block" key={team.id}>
            <h3 className="team-title">{team.name}</h3>
            {teamUpdates.map((u) => (
              <div className="update-card" key={u.id}>
                <div className="name">{u.member_name}</div>
                <div className="body">{u.body}</div>
                <div className="time">
                  Updated {formatISTTimeFromISO(u.updated_at)} IST
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
