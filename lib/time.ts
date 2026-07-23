// Server-authoritative IST time helpers.
// All "today" and cutoff logic is computed from the SERVER clock in Asia/Kolkata.
// The browser clock is never trusted, so changing local device time cannot
// reopen submissions or shift which day an update belongs to.

const IST_TZ = "Asia/Kolkata";
export const CUTOFF_HOUR = 22; // 10:00 PM IST — submissions close at/after this.

type ISTParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
};

function getISTParts(date: Date = new Date()): ISTParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
  });

  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";

  let hour = parseInt(get("hour"), 10);
  // Intl can emit "24" for midnight in hour12:false — normalize to 0.
  if (hour === 24) hour = 0;

  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    hour,
    minute: parseInt(get("minute"), 10),
    weekday: get("weekday"),
  };
}

/** IST date partition key, e.g. "2026-07-22". */
export function todayKey(date: Date = new Date()): string {
  const p = getISTParts(date);
  const mm = String(p.month).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  return `${p.year}-${mm}-${dd}`;
}

/** True while submissions are open (before 10:00 PM IST). */
export function isSubmissionOpen(date: Date = new Date()): boolean {
  const p = getISTParts(date);
  return p.hour < CUTOFF_HOUR;
}

/** Human-friendly date + day, e.g. "Wednesday, 22 July 2026". */
export function formatDateDay(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Format an IST date key ("2026-07-18") as "Fri, 18 Jul". */
export function formatDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return dateKey;
  // Noon UTC keeps the date stable regardless of timezone rendering.
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(dt);
}

/** Current IST wall-clock time, e.g. "21:37". */
export function formatISTTime(date: Date = new Date()): string {
  const p = getISTParts(date);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}
