-- Run this entire file in Supabase SQL Editor (supabase.com → SQL Editor → New query)

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  parent_pin text not null default '0000',
  created_at timestamptz not null default now()
);
alter table public.families enable row level security;
create policy "family_owner" on public.families
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.kids (
  id text primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  pin text not null,
  avatar text not null default '🦋',
  color text not null default 'purple',
  weekly_target int not null default 5,
  age int not null default 6,
  created_at timestamptz not null default now()
);
alter table public.kids enable row level security;
create policy "kids_owner" on public.kids
  using (family_id in (select id from public.families where user_id = auth.uid()))
  with check (family_id in (select id from public.families where user_id = auth.uid()));

create table if not exists public.goals (
  id text primary key,
  kid_id text references public.kids(id) on delete cascade not null,
  title text not null,
  icon text not null default '⭐',
  category text not null default 'chore',
  active boolean not null default true,
  "order" int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "goals_owner" on public.goals
  using (kid_id in (
    select k.id from public.kids k
    join public.families f on k.family_id = f.id where f.user_id = auth.uid()
  ))
  with check (kid_id in (
    select k.id from public.kids k
    join public.families f on k.family_id = f.id where f.user_id = auth.uid()
  ));

create table if not exists public.goal_logs (
  id text primary key,
  goal_id text references public.goals(id) on delete cascade not null,
  kid_id text references public.kids(id) on delete cascade not null,
  date date not null,
  completed_at timestamptz not null default now(),
  unique(goal_id, date)
);
alter table public.goal_logs enable row level security;
create policy "goal_logs_owner" on public.goal_logs
  using (kid_id in (
    select k.id from public.kids k
    join public.families f on k.family_id = f.id where f.user_id = auth.uid()
  ))
  with check (kid_id in (
    select k.id from public.kids k
    join public.families f on k.family_id = f.id where f.user_id = auth.uid()
  ));

create table if not exists public.rewards (
  id text primary key,
  kid_id text references public.kids(id) on delete cascade not null,
  type text not null,
  icon text,
  name text,
  for_date date,
  for_week date,
  reason text,
  earned_at timestamptz not null default now()
);
alter table public.rewards enable row level security;
create policy "rewards_owner" on public.rewards
  using (kid_id in (
    select k.id from public.kids k
    join public.families f on k.family_id = f.id where f.user_id = auth.uid()
  ))
  with check (kid_id in (
    select k.id from public.kids k
    join public.families f on k.family_id = f.id where f.user_id = auth.uid()
  ));

create table if not exists public.game_unlocks (
  id text primary key,
  kid_id text references public.kids(id) on delete cascade not null,
  week_of date not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  unique(kid_id, week_of)
);
alter table public.game_unlocks enable row level security;
create policy "game_unlocks_owner" on public.game_unlocks
  using (kid_id in (
    select k.id from public.kids k
    join public.families f on k.family_id = f.id where f.user_id = auth.uid()
  ))
  with check (kid_id in (
    select k.id from public.kids k
    join public.families f on k.family_id = f.id where f.user_id = auth.uid()
  ));
