"use client";

import type { Status } from "../types";

export default function StatusPill({ status }: { status: Status | null }) {
  if (!status) {
    return <span className="pill closed">Loading…</span>;
  }
  return status.isOpen ? (
    <span className="pill open">● OPEN · {status.istTime} IST</span>
  ) : (
    <span className="pill closed">● CLOSED · {status.istTime} IST</span>
  );
}
