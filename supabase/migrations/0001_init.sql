-- Daily Update Portal schema + seed
-- Run in the Supabase SQL editor (or via the Supabase CLI).

create extension if not exists "pgcrypto";

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists updates (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  member_name text not null,
  date_key text not null,           -- IST YYYY-MM-DD, computed server-side
  body text not null,
  updated_at timestamptz not null default now(),
  -- One row per person per IST day. Re-submitting upserts (overwrites) this row,
  -- which also makes concurrent submissions safe (DB-enforced, last-write-wins).
  unique (member_id, date_key)
);

create index if not exists idx_updates_date_key on updates (date_key);
create index if not exists idx_members_team on members (team_id);

-- ---------------------------------------------------------------------------
-- Seed: three roles/teams + members parsed from the 21-07-2026 update.
-- PMs start empty; add them via the Manage Team tab.
-- ---------------------------------------------------------------------------
insert into teams (name, sort_order) values
  ('Testers', 1),
  ('PMs', 2),
  ('Developers', 3)
on conflict do nothing;

insert into members (team_id, name)
select t.id, m.name
from teams t
join (values
  ('Testers', 'Abhilash'),
  ('Testers', 'Ketan'),
  ('Testers', 'Shweta'),
  ('Testers', 'Mansi'),
  ('Testers', 'Omkar'),
  ('Testers', 'Neha'),
  ('Developers', 'Mohd Salman Ansari'),
  ('Developers', 'Umesh Bhagwat'),
  ('Developers', 'Atuldev Sharma'),
  ('Developers', 'Shivaji Mandapati'),
  ('Developers', 'Parth'),
  ('Developers', 'Shashank Bambole'),
  ('Developers', 'Zuhair Sakharkar'),
  ('Developers', 'Vinay Jadhav'),
  ('Developers', 'Fulaji'),
  ('Developers', 'Shakir Choudhary'),
  ('Developers', 'Karan Kesarwani'),
  ('Developers', 'Piyush'),
  ('Developers', 'Aslam Shaikh'),
  ('Developers', 'Pranay Patil'),
  ('Developers', 'Vrushabh Kadam'),
  ('Developers', 'Raj Trivedi'),
  ('Developers', 'Jyan Jain'),
  ('Developers', 'Suraj'),
  ('Developers', 'Dinesh Patil'),
  ('Developers', 'Sakshi Tiwari'),
  ('Developers', 'Sahil Khan')
) as m(team_name, name) on t.name = m.team_name
where not exists (
  select 1 from members ex where ex.team_id = t.id and ex.name = m.name
);
