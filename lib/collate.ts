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
