import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { todayKey } from "@/lib/time";

export const dynamic = "force-dynamic";

// GET ?memberId= : the member's most recent update from any past day (IST),
// used to help them recall/reuse what they did. Read-only, no auth needed
// (same posture as GET /api/updates).
export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId")?.trim();
  if (!memberId) {
    return NextResponse.json({ error: "memberId is required." }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("updates")
    .select("body, date_key")
    .eq("member_id", memberId)
    .lt("date_key", todayKey())
    .order("date_key", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ previous: data ?? null });
}
