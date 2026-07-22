import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function checkAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const provided = req.headers.get("x-admin-password") ?? "";
  return provided === expected;
}

// GET: public roster used to populate the Role dropdown and Name combobox.
export async function GET() {
  const supabase = getServerSupabase();

  const { data: teams, error: teamErr } = await supabase
    .from("teams")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  const { data: members, error: memberErr } = await supabase
    .from("members")
    .select("id, team_id, name, active")
    .eq("active", true)
    .order("name", { ascending: true });

  if (teamErr || memberErr) {
    return NextResponse.json(
      { error: teamErr?.message ?? memberErr?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ teams: teams ?? [], members: members ?? [] });
}

// POST: all roster mutations, admin-gated. Body: { action, ...fields }.
export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const action = body.action;

  try {
    switch (action) {
      case "add_team": {
        const name = (body.name ?? "").trim();
        if (!name) return bad("Team name is required.");
        const { data: max } = await supabase
          .from("teams")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextOrder = (max?.sort_order ?? 0) + 1;
        const { error } = await supabase
          .from("teams")
          .insert({ name, sort_order: nextOrder });
        if (error) return fail(error.message);
        break;
      }
      case "rename_team": {
        const id = (body.id ?? "").trim();
        const name = (body.name ?? "").trim();
        if (!id || !name) return bad("Team id and name are required.");
        const { error } = await supabase.from("teams").update({ name }).eq("id", id);
        if (error) return fail(error.message);
        break;
      }
      case "delete_team": {
        const id = (body.id ?? "").trim();
        if (!id) return bad("Team id is required.");
        const { error } = await supabase.from("teams").delete().eq("id", id);
        if (error) return fail(error.message);
        break;
      }
      case "add_member": {
        const teamId = (body.teamId ?? "").trim();
        const name = (body.name ?? "").trim();
        if (!teamId || !name) return bad("Team and member name are required.");
        const { error } = await supabase
          .from("members")
          .insert({ team_id: teamId, name });
        if (error) return fail(error.message);
        break;
      }
      case "rename_member": {
        const id = (body.id ?? "").trim();
        const name = (body.name ?? "").trim();
        if (!id || !name) return bad("Member id and name are required.");
        const { error } = await supabase.from("members").update({ name }).eq("id", id);
        if (error) return fail(error.message);
        break;
      }
      case "move_member": {
        const id = (body.id ?? "").trim();
        const teamId = (body.teamId ?? "").trim();
        if (!id || !teamId) return bad("Member id and team are required.");
        const { error } = await supabase
          .from("members")
          .update({ team_id: teamId })
          .eq("id", id);
        if (error) return fail(error.message);
        break;
      }
      case "delete_member": {
        const id = (body.id ?? "").trim();
        if (!id) return bad("Member id is required.");
        const { error } = await supabase.from("members").delete().eq("id", id);
        if (error) return fail(error.message);
        break;
      }
      default:
        return bad("Unknown action.");
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unexpected error.");
  }

  return NextResponse.json({ ok: true });
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
function fail(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}
