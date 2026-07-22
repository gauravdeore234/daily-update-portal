import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key.
// This module must never be imported into client components.
let cached: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export type Team = {
  id: string;
  name: string;
  sort_order: number;
};

export type Member = {
  id: string;
  team_id: string;
  name: string;
  active: boolean;
};

export type UpdateRow = {
  id: string;
  member_id: string;
  team_id: string;
  member_name: string;
  date_key: string;
  body: string;
  updated_at: string;
};
