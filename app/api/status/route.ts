import { NextResponse } from "next/server";
import {
  formatDateDay,
  formatISTTime,
  isSubmissionOpen,
  CUTOFF_HOUR,
} from "@/lib/time";

export const dynamic = "force-dynamic";

// Authoritative clock for the client. The UI displays this; it never decides
// open/closed from the browser's own Date.
export async function GET() {
  const now = new Date();
  return NextResponse.json({
    dateLabel: formatDateDay(now),
    istTime: formatISTTime(now),
    isOpen: isSubmissionOpen(now),
    cutoffHour: CUTOFF_HOUR,
  });
}
