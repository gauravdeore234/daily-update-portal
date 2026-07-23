-- Enforce globally-unique member names (case-insensitive) so the Submit form
-- can auto-detect a person's role from their name alone.
-- Run this in the Supabase SQL editor.
--
-- If this fails, you have existing duplicate names. Find them with:
--   select lower(name), count(*) from members group by lower(name) having count(*) > 1;
-- rename the duplicates (Manage Team → rename), then re-run.

create unique index if not exists idx_members_name_ci
  on members (lower(name));
