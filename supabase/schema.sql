-- ============================================================
-- Crewzy - Supabase schema (idempotente)
-- Pega este SQL en: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- Extensiones
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (1 por usuario de auth)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar text,
  coins integer not null default 1000,
  created_at timestamptz default now()
);
alter table public.profiles add column if not exists avatar text;
alter table public.profiles add column if not exists coins integer not null default 1000;
update public.profiles set coins = 1000 where coins is null;
alter table public.profiles enable row level security;

drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- GROUPS
-- ============================================================
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);
alter table public.groups enable row level security;

-- ============================================================
-- GROUP MEMBERS
-- ============================================================
create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);
alter table public.group_members enable row level security;

-- ============================================================
-- HELPER: evita recursión de RLS en group_members
-- (debe crearse después de la tabla group_members)
-- ============================================================
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = uid);
$$;

-- ============================================================
-- CHAT DE GRUPO
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  reply_to_id uuid references public.messages(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.messages add column if not exists reply_to_id uuid references public.messages(id) on delete set null;
alter table public.messages enable row level security;

drop policy if exists "messages_read_members" on public.messages;
create policy "messages_read_members" on public.messages for select using (
  public.is_group_member(group_id, auth.uid())
);
drop policy if exists "messages_insert_members" on public.messages;
create policy "messages_insert_members" on public.messages for insert with check (
  auth.uid() = user_id and public.is_group_member(group_id, auth.uid())
);
drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own" on public.messages for delete using (
  auth.uid() = user_id
);

-- Políticas de groups
drop policy if exists "groups_read_members" on public.groups;
create policy "groups_read_members" on public.groups for select using (
  public.is_group_member(id, auth.uid())
);
drop policy if exists "groups_insert_owner" on public.groups;
create policy "groups_insert_owner" on public.groups for insert with check (auth.uid() = owner_id);
drop policy if exists "groups_update_owner" on public.groups;
create policy "groups_update_owner" on public.groups for update using (auth.uid() = owner_id);
drop policy if exists "groups_delete_owner" on public.groups;
create policy "groups_delete_owner" on public.groups for delete using (auth.uid() = owner_id);

drop policy if exists "gm_read_members" on public.group_members;
create policy "gm_read_members" on public.group_members for select using (
  public.is_group_member(group_id, auth.uid())
);
drop policy if exists "gm_delete_self_or_owner" on public.group_members;
create policy "gm_delete_self_or_owner" on public.group_members for delete using (
  auth.uid() = user_id
  or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
);
-- Nota: no hay policy de INSERT. Unirse a un grupo se hace con join_group_by_code
-- (SECURITY DEFINER). El alta del owner la hace el trigger handle_new_group.

-- Añadir owner como admin al crear el grupo
create or replace function public.handle_new_group()
returns trigger as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'admin')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute procedure public.handle_new_group();

-- Unirse por código de invitación
create or replace function public.join_group_by_code(code text)
returns uuid as $$
declare gid uuid;
begin
  select id into gid from public.groups where invite_code = code;
  if gid is null then raise exception 'Codigo invalido'; end if;
  insert into public.group_members (group_id, user_id, role)
    values (gid, auth.uid(), 'member')
    on conflict (group_id, user_id) do nothing;
  return gid;
end;
$$ language plpgsql security definer;

-- ============================================================
-- PLANS
-- ============================================================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text,
  date bigint,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.plans enable row level security;

drop policy if exists "plans_members" on public.plans;
create policy "plans_members" on public.plans for all using (
  public.is_group_member(group_id, auth.uid())
) with check (
  public.is_group_member(group_id, auth.uid())
);

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  title text not null,
  assignee_id uuid references public.profiles(id) on delete set null,
  status text not null default 'todo',
  due_date bigint,
  notes text
);
alter table public.tasks enable row level security;

drop policy if exists "tasks_members" on public.tasks;
create policy "tasks_members" on public.tasks for all using (
  exists (select 1 from public.plans p
          where p.id = plan_id and public.is_group_member(p.group_id, auth.uid()))
) with check (
  exists (select 1 from public.plans p
          where p.id = plan_id and public.is_group_member(p.group_id, auth.uid()))
);

-- ============================================================
-- EXPENSES
-- ============================================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  title text not null,
  amount numeric not null,
  paid_by uuid not null references public.profiles(id) on delete cascade,
  split_among uuid[] not null,
  created_at timestamptz default now()
);
alter table public.expenses enable row level security;

drop policy if exists "expenses_members" on public.expenses;
create policy "expenses_members" on public.expenses for all using (
  exists (select 1 from public.plans p
          where p.id = plan_id and public.is_group_member(p.group_id, auth.uid()))
) with check (
  exists (select 1 from public.plans p
          where p.id = plan_id and public.is_group_member(p.group_id, auth.uid()))
);

-- ============================================================
-- BETS (privadas: el objetivo NO puede verlas)
-- ============================================================
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open',
  winning_option_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  resolved_at timestamptz
);
alter table public.bets enable row level security;

drop policy if exists "bets_read_not_target" on public.bets;
create policy "bets_read_not_target" on public.bets for select using (
  public.is_group_member(group_id, auth.uid())
  and target_user_id <> auth.uid()
);
drop policy if exists "bets_insert_members" on public.bets;
create policy "bets_insert_members" on public.bets for insert with check (
  public.is_group_member(group_id, auth.uid())
  and created_by = auth.uid()
);
drop policy if exists "bets_update_creator" on public.bets;
create policy "bets_update_creator" on public.bets for update using (created_by = auth.uid());
drop policy if exists "bets_delete_creator" on public.bets;
create policy "bets_delete_creator" on public.bets for delete using (created_by = auth.uid());

-- ============================================================
-- BET OPTIONS
-- ============================================================
create table if not exists public.bet_options (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  label text not null
);
alter table public.bet_options enable row level security;

drop policy if exists "bo_read" on public.bet_options;
create policy "bo_read" on public.bet_options for select using (
  exists (select 1 from public.bets b
          where b.id = bet_id
            and b.target_user_id <> auth.uid()
            and public.is_group_member(b.group_id, auth.uid()))
);
drop policy if exists "bo_insert" on public.bet_options;
create policy "bo_insert" on public.bet_options for insert with check (
  exists (select 1 from public.bets b where b.id = bet_id and b.created_by = auth.uid())
);

-- ============================================================
-- BET WAGERS
-- ============================================================
create table if not exists public.bet_wagers (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_id uuid not null references public.bet_options(id) on delete cascade,
  amount numeric,
  created_at timestamptz default now(),
  unique (bet_id, user_id)
);
alter table public.bet_wagers enable row level security;

drop policy if exists "bw_read" on public.bet_wagers;
create policy "bw_read" on public.bet_wagers for select using (
  exists (select 1 from public.bets b
          where b.id = bet_id
            and b.target_user_id <> auth.uid()
            and public.is_group_member(b.group_id, auth.uid()))
);
drop policy if exists "bw_insert" on public.bet_wagers;
create policy "bw_insert" on public.bet_wagers for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.bets b
              where b.id = bet_id
                and b.target_user_id <> auth.uid()
                and b.status = 'open'
                and public.is_group_member(b.group_id, auth.uid()))
);
drop policy if exists "bw_update" on public.bet_wagers;
create policy "bw_update" on public.bet_wagers for update using (auth.uid() = user_id);
drop policy if exists "bw_delete" on public.bet_wagers;
create policy "bw_delete" on public.bet_wagers for delete using (auth.uid() = user_id);

-- ============================================================
-- CAMPEONATOS
-- ============================================================
create table if not exists public.championships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  description text,
  points_system jsonb not null default '[25,18,15,12,10,8,6,4,2,1]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.championships enable row level security;

drop policy if exists "championships_members" on public.championships;
create policy "championships_members" on public.championships for all using (
  public.is_group_member(group_id, auth.uid())
) with check (
  public.is_group_member(group_id, auth.uid())
);

create table if not exists public.championship_events (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  name text not null,
  date bigint,
  created_at timestamptz default now()
);
alter table public.championship_events enable row level security;

drop policy if exists "championship_events_members" on public.championship_events;
create policy "championship_events_members" on public.championship_events for all using (
  exists (
    select 1 from public.championships c
    where c.id = championship_id and public.is_group_member(c.group_id, auth.uid())
  )
) with check (
  exists (
    select 1 from public.championships c
    where c.id = championship_id and public.is_group_member(c.group_id, auth.uid())
  )
);

create table if not exists public.championship_results (
  event_id uuid not null references public.championship_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  position integer not null check (position > 0),
  points integer not null default 0,
  primary key (event_id, user_id)
);
alter table public.championship_results enable row level security;

drop policy if exists "championship_results_members" on public.championship_results;
create policy "championship_results_members" on public.championship_results for all using (
  exists (
    select 1
    from public.championship_events e
    join public.championships c on c.id = e.championship_id
    where e.id = event_id and public.is_group_member(c.group_id, auth.uid())
  )
) with check (
  exists (
    select 1
    from public.championship_events e
    join public.championships c on c.id = e.championship_id
    where e.id = event_id and public.is_group_member(c.group_id, auth.uid())
  )
);

-- ============================================================
-- ============================================================
-- MONEDAS (recompensas)
-- ============================================================
create or replace function public.add_coins(p_user_id uuid, p_amount integer)
returns void language plpgsql security definer as $$
begin
  update public.profiles set coins = coins + p_amount where id = p_user_id;
end;
$$;

grant execute on function public.add_coins(uuid, integer) to authenticated;

-- ============================================================
-- REALTIME (idempotente)
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array['groups','group_members','plans','tasks','expenses','bets','bet_options','bet_wagers','messages','championships','championship_events','championship_results']::text[]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_gm_user on public.group_members(user_id);
create index if not exists idx_plans_group on public.plans(group_id);
create index if not exists idx_tasks_plan on public.tasks(plan_id);
create index if not exists idx_expenses_plan on public.expenses(plan_id);
create index if not exists idx_bets_group on public.bets(group_id);
create index if not exists idx_messages_group on public.messages(group_id, created_at);
create index if not exists idx_championships_group on public.championships(group_id);
create index if not exists idx_championship_events_champ on public.championship_events(championship_id);
create index if not exists idx_championship_results_event on public.championship_results(event_id);
