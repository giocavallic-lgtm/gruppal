-- ============================================================
-- Crewzy - Supabase schema
-- Pega este SQL en: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- Extensiones
create extension if not exists "pgcrypto";

-- PROFILES (1 por usuario de auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- GROUPS
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);
alter table public.groups enable row level security;

-- GROUP MEMBERS
create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);
alter table public.group_members enable row level security;

-- RLS groups: miembros pueden leer; owner puede modificar/borrar
create policy "groups_read_members" on public.groups for select using (
  exists (select 1 from public.group_members gm where gm.group_id = id and gm.user_id = auth.uid())
  or invite_code is not null  -- permite buscar por codigo para unirse
);
create policy "groups_insert_owner" on public.groups for insert with check (auth.uid() = owner_id);
create policy "groups_update_owner" on public.groups for update using (auth.uid() = owner_id);
create policy "groups_delete_owner" on public.groups for delete using (auth.uid() = owner_id);

-- RLS group_members
create policy "gm_read_members" on public.group_members for select using (
  exists (select 1 from public.group_members gm2 where gm2.group_id = group_id and gm2.user_id = auth.uid())
);
create policy "gm_insert_self" on public.group_members for insert with check (auth.uid() = user_id);
create policy "gm_delete_self_or_owner" on public.group_members for delete using (
  auth.uid() = user_id
  or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
);

-- Auto-añadir owner como admin al crear grupo
create or replace function public.handle_new_group()
returns trigger as $$
begin
  insert into public.group_members (group_id, user_id, role) values (new.id, new.owner_id, 'admin');
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute procedure public.handle_new_group();

-- Función para unirse a grupo por código
create or replace function public.join_group_by_code(code text)
returns uuid as $$
declare gid uuid;
begin
  select id into gid from public.groups where invite_code = code;
  if gid is null then raise exception 'Código inválido'; end if;
  insert into public.group_members (group_id, user_id, role)
    values (gid, auth.uid(), 'member')
    on conflict (group_id, user_id) do nothing;
  return gid;
end;
$$ language plpgsql security definer;

-- PLANS
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text,
  date bigint,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.plans enable row level security;
create policy "plans_members" on public.plans for all using (
  exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid())
) with check (
  exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid())
);

-- TASKS
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  title text not null,
  assignee_id uuid references public.profiles(id),
  status text not null default 'todo',
  due_date bigint,
  notes text
);
alter table public.tasks enable row level security;
create policy "tasks_members" on public.tasks for all using (
  exists (select 1 from public.plans p join public.group_members gm on gm.group_id = p.group_id
          where p.id = plan_id and gm.user_id = auth.uid())
) with check (
  exists (select 1 from public.plans p join public.group_members gm on gm.group_id = p.group_id
          where p.id = plan_id and gm.user_id = auth.uid())
);

-- EXPENSES
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  title text not null,
  amount numeric not null,
  paid_by uuid not null references public.profiles(id),
  split_among uuid[] not null,
  created_at timestamptz default now()
);
alter table public.expenses enable row level security;
create policy "expenses_members" on public.expenses for all using (
  exists (select 1 from public.plans p join public.group_members gm on gm.group_id = p.group_id
          where p.id = plan_id and gm.user_id = auth.uid())
) with check (
  exists (select 1 from public.plans p join public.group_members gm on gm.group_id = p.group_id
          where p.id = plan_id and gm.user_id = auth.uid())
);

-- BETS
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text,
  target_user_id uuid not null references public.profiles(id),
  status text not null default 'open',
  winning_option_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  resolved_at timestamptz
);
alter table public.bets enable row level security;
-- El target NO puede ver la apuesta
create policy "bets_read_not_target" on public.bets for select using (
  exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid())
  and target_user_id <> auth.uid()
);
create policy "bets_insert_members" on public.bets for insert with check (
  exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid())
  and created_by = auth.uid()
);
create policy "bets_update_creator" on public.bets for update using (created_by = auth.uid());
create policy "bets_delete_creator" on public.bets for delete using (created_by = auth.uid());

-- BET OPTIONS
create table if not exists public.bet_options (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  label text not null
);
alter table public.bet_options enable row level security;
create policy "bo_read" on public.bet_options for select using (
  exists (select 1 from public.bets b where b.id = bet_id and b.target_user_id <> auth.uid()
    and exists (select 1 from public.group_members gm where gm.group_id = b.group_id and gm.user_id = auth.uid()))
);
create policy "bo_insert" on public.bet_options for insert with check (
  exists (select 1 from public.bets b where b.id = bet_id and b.created_by = auth.uid())
);

-- BET WAGERS
create table if not exists public.bet_wagers (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  option_id uuid not null references public.bet_options(id) on delete cascade,
  amount numeric,
  created_at timestamptz default now(),
  unique (bet_id, user_id)
);
alter table public.bet_wagers enable row level security;
create policy "bw_read" on public.bet_wagers for select using (
  exists (select 1 from public.bets b where b.id = bet_id and b.target_user_id <> auth.uid()
    and exists (select 1 from public.group_members gm where gm.group_id = b.group_id and gm.user_id = auth.uid()))
);
create policy "bw_insert" on public.bet_wagers for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.bets b where b.id = bet_id and b.target_user_id <> auth.uid()
    and b.status = 'open'
    and exists (select 1 from public.group_members gm where gm.group_id = b.group_id and gm.user_id = auth.uid()))
);
create policy "bw_update" on public.bet_wagers for update using (auth.uid() = user_id);
create policy "bw_delete" on public.bet_wagers for delete using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.groups, public.group_members, public.plans, public.tasks, public.expenses, public.bets, public.bet_options, public.bet_wagers;

-- Índices
create index if not exists idx_gm_user on public.group_members(user_id);
create index if not exists idx_plans_group on public.plans(group_id);
create index if not exists idx_tasks_plan on public.tasks(plan_id);
create index if not exists idx_expenses_plan on public.expenses(plan_id);
create index if not exists idx_bets_group on public.bets(group_id);