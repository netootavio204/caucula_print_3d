begin;

alter table public.external_projects
  add column if not exists imported_layer_height text,
  add column if not exists imported_walls text,
  add column if not exists imported_infill text,
  add column if not exists imported_nozzle text,
  add column if not exists imported_image_urls text[] not null default '{}',
  add column if not exists makerworld_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create table if not exists public.external_project_filaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_project_id uuid not null references public.external_projects(id) on delete cascade,
  filament_id uuid references public.filaments(id) on delete set null,
  detected_name text,
  detected_color text,
  detected_material text,
  weight_g numeric not null default 0,
  cost numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists external_project_filaments_user_id_idx on public.external_project_filaments(user_id);
create index if not exists external_project_filaments_project_id_idx on public.external_project_filaments(external_project_id);
create index if not exists external_project_filaments_filament_id_idx on public.external_project_filaments(filament_id);

drop trigger if exists external_project_filaments_set_updated_at on public.external_project_filaments;
create trigger external_project_filaments_set_updated_at
before update on public.external_project_filaments
for each row execute function public.set_updated_at();

alter table public.external_project_filaments enable row level security;

drop policy if exists "Users can select own external project filaments" on public.external_project_filaments;
create policy "Users can select own external project filaments" on public.external_project_filaments
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own external project filaments" on public.external_project_filaments;
create policy "Users can insert own external project filaments" on public.external_project_filaments
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.external_projects
    where external_projects.id = external_project_id
      and external_projects.user_id = (select auth.uid())
  )
  and (
    filament_id is null
    or exists (
      select 1
      from public.filaments
      where filaments.id = filament_id
        and filaments.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users can update own external project filaments" on public.external_project_filaments;
create policy "Users can update own external project filaments" on public.external_project_filaments
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.external_projects
    where external_projects.id = external_project_id
      and external_projects.user_id = (select auth.uid())
  )
  and (
    filament_id is null
    or exists (
      select 1
      from public.filaments
      where filaments.id = filament_id
        and filaments.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users can delete own external project filaments" on public.external_project_filaments;
create policy "Users can delete own external project filaments" on public.external_project_filaments
for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on table public.external_project_filaments to authenticated;

commit;
