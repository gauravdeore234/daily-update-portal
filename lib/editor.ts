// Pure, client-safe helpers for appending list items to the update text while
// respecting the existing list convention (bullet vs numbered). Shared by the
// starter-phrase chips and the "add yesterday's update" action.

export type ListStyle = {
  kind: "ordered" | "bullet" | "none";
  bulletChar: string; // e.g. "•", "-", "*"
  nextNumber: number; // next number for an ordered list
};

const BULLET_RE = /^\s*([•\-*])\s+/;
const ORDERED_RE = /^\s*(\d+)[.)]\s+/;

/** Inspect existing text to decide how new list items should be marked. */
export function detectListStyle(text: string): ListStyle {
  const lines = text.split("\n");
  let bulletChar = "•";
  let maxNumber = 0;
  let sawOrdered = false;
  let sawBullet = false;

  for (const line of lines) {
    const om = line.match(ORDERED_RE);
    if (om) {
      sawOrdered = true;
      maxNumber = Math.max(maxNumber, parseInt(om[1], 10));
      continue;
    }
    const bm = line.match(BULLET_RE);
    if (bm) {
      sawBullet = true;
      bulletChar = bm[1];
    }
  }

  // Ordered wins if present (numbered lists are the stronger signal).
  if (sawOrdered) {
    return { kind: "ordered", bulletChar, nextNumber: maxNumber + 1 };
  }
  if (sawBullet) {
    return { kind: "bullet", bulletChar, nextNumber: 1 };
  }
  return { kind: "none", bulletChar: "•", nextNumber: 1 };
}

/** Remove a leading bullet or "N." / "N)" marker (left side only) from a line. */
export function stripMarker(line: string): string {
  return line.replace(BULLET_RE, "").replace(ORDERED_RE, "").replace(/^\s+/, "");
}

function markerFor(style: ListStyle, index: number): string {
  if (style.kind === "ordered") return `${style.nextNumber + index}. `;
  return `${style.bulletChar} `;
}

/**
 * Append `items` to `existing` as new list lines at the very end, continuing the
 * detected style. Never inserts ahead of existing text. `items` may contain raw
 * text (markers are stripped first, so callers can pass yesterday's lines
 * verbatim). When `existing` is empty, a default bullet style is used unless
 * `keepVerbatimWhenEmpty` is set (used for pasting yesterday's update as-is).
 */
export function appendItems(
  existing: string,
  items: string[],
  opts: { keepVerbatimWhenEmpty?: boolean } = {}
): string {
  const cleaned = items
    .map((i) => stripMarker(i))
    .filter((i) => i.trim().length > 0);
  if (cleaned.length === 0) return existing;

  const base = existing.replace(/\s+$/, ""); // drop trailing whitespace/newlines

  // Empty box + verbatim request → paste the joined items with default bullets.
  if (base.length === 0 && opts.keepVerbatimWhenEmpty) {
    const lines = cleaned.map((c) => `• ${c}`);
    return lines.join("\n");
  }

  const style = base.length === 0
    ? ({ kind: "bullet", bulletChar: "•", nextNumber: 1 } as ListStyle)
    : detectListStyle(base);

  const newLines = cleaned.map((c, i) => `${markerFor(style, i)}${c}`);
  return base.length === 0 ? newLines.join("\n") : `${base}\n${newLines.join("\n")}`;
}

// Built-in starter phrases shown as tappable chips. Editable here + redeploy.
export const STARTER_PHRASES = [
  "Worked on",
  "Followed up with",
  "Discussion about",
  "Checked the issue of",
  "Meeting with",
  "Reviewed",
  "Tested",
  "Fixed",
  "Deployed",
  "Blocked on",
];
