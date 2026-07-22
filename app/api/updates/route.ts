import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { isSubmissionOpen, todayKey } from "@/lib/time";

export const dynamic = "force-dynamic";

// GET: today's updates (IST) — automatically empty after IST midnight because
// we filter by the current date_key.
export async function GET() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("updates")
    .select("id, member_id, team_id, member_name, date_key, body, updated_at")
    .eq("date_key", todayKey())
    .order("updated_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ updates: data ?? [] });
}

// POST: upsert one person's update for today. Server re-checks the cutoff, so a
// tampered client clock cannot get past 10 PM IST.
export async function POST(req: NextRequest) {
  if (!isSubmissionOpen()) {
    return NextResponse.json(
      { error: "Submissions are closed for today (after 10:00 PM IST)." },
      { status: 403 }
    );
  }

  let payload: { memberId?: string; body?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const memberId = (payload.memberId ?? "").trim();
  const body = (payload.body ?? "").replace(/\r\n/g, "\n").trim();

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required." }, { status: 400 });
  }
  if (!body) {
    return NextResponse.json({ error: "Update text cannot be empty." }, { status: 400 });
  }
  if (body.length > 8000) {
    return NextResponse.json({ error: "Update is too long." }, { status: 400 });
  }

  const supabase = getServerSupabase();

  // Resolve the member server-side so team_id/name come from the DB, not the client.
  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id, team_id, name, active")
    .eq("id", memberId)
    .single();

  if (memberErr || !member) {
    return NextResponse.json({ error: "Unknown member." }, { status: 400 });
  }
  if (!member.active) {
    return NextResponse.json({ error: "This member is inactive." }, { status: 400 });
  }

  const dateKey = todayKey();

  // Was there already an update today (to tell the user it was overwritten)?
  const { data: existing } = await supabase
    .from("updates")
    .select("id")
    .eq("member_id", memberId)
    .eq("date_key", dateKey)
    .maybeSingle();

  const { error: upsertErr } = await supabase.from("updates").upsert(
    {
      member_id: member.id,
      team_id: member.team_id,
      member_name: member.name,
      date_key: dateKey,
      body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "member_id,date_key" }
  );

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, overwritten: Boolean(existing) });
}
