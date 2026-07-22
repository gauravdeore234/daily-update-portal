// Small display-only helper for rendering timestamps in IST on the client.
// This is cosmetic; all authoritative time decisions happen on the server.
export function formatISTTimeFromISO(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
