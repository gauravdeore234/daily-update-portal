import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSupabase } from "@/lib/supabase";
import { buildGroupedMessages } from "@/lib/collate";
import { formatDateKey, yesterdayKey } from "@/lib/time";

export const dynamic = "force-dynamic";

// Triggered by Vercel Cron at 18:45 UTC (00:15 IST next day). It archives the
// day that just ended, so it targets *yesterday's* IST date key. Vercel sends
// `Authorization: Bearer $CRON_SECRET`; we reject anything else. A `?date=`
// override (YYYY-MM-DD) is allowed for manual testing.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = getServerSupabase();
  const dateKey = req.nextUrl.searchParams.get("date")?.trim() || yesterdayKey();

  const { data: teams, error: teamErr } = await supabase
    .from("teams")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  const { data: updates, error: updErr } = await supabase
    .from("updates")
    .select("team_id, member_name, body, updated_at")
    .eq("date_key", dateKey);

  if (teamErr || updErr) {
    return NextResponse.json(
      { error: teamErr?.message ?? updErr?.message },
      { status: 500 }
    );
  }

  const groups = buildGroupedMessages({
    teams: teams ?? [],
    updates: updates ?? [],
    date: new Date(`${dateKey}T12:00:00Z`),
  });

  // Both messages in one email, each under its group heading.
  const message = groups
    .map((g) => `===== ${g.label} =====\n\n${g.message}`)
    .join("\n\n\n");

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ARCHIVE_EMAIL_TO;
  const from = process.env.ARCHIVE_EMAIL_FROM ?? "onboarding@resend.dev";

  if (!apiKey || !to) {
    return NextResponse.json(
      { error: "Email not configured (RESEND_API_KEY / ARCHIVE_EMAIL_TO)." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  const { error: sendErr } = await resend.emails.send({
    from,
    to,
    subject: `Daily Update Archive — ${formatDateKey(dateKey)}`,
    text: message,
    html: `<pre style="font-family:ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;font-size:14px;line-height:1.5">${escapeHtml(
      message
    )}</pre>`,
  });

  if (sendErr) {
    return NextResponse.json({ error: sendErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: updates?.length ?? 0 });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
