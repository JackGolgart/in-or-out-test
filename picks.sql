drop table if exists picks cascade;

create table picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  player_id integer not null,
  player_name text,
  selection text check (selection in ('IN', 'OUT')),
  per_at_selection float,
  current_per float,
  per_change float generated always as (current_per - per_at_selection) stored,
  created_at timestamptz default now(),
  unique (user_id, player_id)
);

alter table picks enable row level security;

create policy "Users manage their own picks"
on picks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);