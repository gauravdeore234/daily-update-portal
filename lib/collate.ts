import type { Team, UpdateRow } from "./supabase";
import { formatDateDay } from "./time";

export type CollateInput = {
  teams: Pick<Team, "id" | "name" | "sort_order">[];
  updates: Pick<UpdateRow, "team_id" | "member_name" | "body" | "updated_at">[];
  date?: Date;
};

/**
 * Build a single WhatsApp-ready message that collates every team's updates.
 * Shared by the "Today" tab (Copy All button) and the 10:15 PM archive email,
 * so the pasted message and the archived record are always identical.
 */
export function buildCollatedMessage({ teams, updates, date }: CollateInput): string {
  const header = `*Daily Update — ${formatDateDay(date)}*`;
  const sortedTeams = [...teams].sort((a, b) => a.sort_order - b.sort_order);

  const sections: string[] = [];

  for (const team of sortedTeams) {
    const teamUpdates = updates.filter((u) => u.team_id === team.id);
    if (teamUpdates.length === 0) continue;

    // Latest update per person (in case of any duplicates).
    const byPerson = new Map<string, string>();
    for (const u of teamUpdates) byPerson.set(u.member_name, u.body);

    const lines: string[] = [`*${team.name}*`];
    for (const [name, body] of byPerson) {
      lines.push("");
      lines.push(`${name}:`);
      const bodyLines = body
        .split("\n")
        .map((l) => l.trimEnd())
        .filter((l) => l.length > 0);
      for (const bl of bodyLines) lines.push(bl);
    }
    sections.push(lines.join("\n"));
  }

  if (sections.length === 0) {
    return `${header}\n\n_No updates submitted yet._`;
  }

  return `${header}\n\n${sections.join("\n\n=====================\n\n")}`;
}

export type CollateGroup = { key: string; label: string; message: string };

// A team belongs to the PM group if its name starts with "pm" (PM, PMs, pm…).
function isPmTeam(name: string): boolean {
  return name.trim().toLowerCase().startsWith("pm");
}

/**
 * Split the day's updates into two WhatsApp messages:
 *   1. Developers + Testers (everything that isn't a PM team)
 *   2. PMs
 * Used by both the Today tab (two Copy buttons) and the archive email.
 */
export function buildGroupedMessages({
  teams,
  updates,
  date,
}: CollateInput): CollateGroup[] {
  const pmTeams = teams.filter((t) => isPmTeam(t.name));
  const otherTeams = teams.filter((t) => !isPmTeam(t.name));

  return [
    {
      key: "dev-test",
      label: "Developers + Testers",
      message: buildCollatedMessage({ teams: otherTeams, updates, date }),
    },
    {
      key: "pm",
      label: "PMs",
      message: buildCollatedMessage({ teams: pmTeams, updates, date }),
    },
  ];
}
