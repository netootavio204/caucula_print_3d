begin;

alter table public.external_projects
  add column if not exists manual_filament_id uuid references public.filaments(id) on delete set null,
  add column if not exists manual_machine_id uuid references public.machines(id) on delete set null,
  add column if not exists review_notes text;

create index if not exists external_projects_manual_filament_id_idx on public.external_projects(manual_filament_id);
create index if not exists external_projects_manual_machine_id_idx on public.external_projects(manual_machine_id);

drop policy if exists "Users can insert own external projects" on public.external_projects;
create policy "Users can insert own external projects" on public.external_projects
for insert to authenticated with check (
  user_id = (select auth.uid())
  and (
    manual_filament_id is null
    or exists (
      select 1
      from public.filaments
      where filaments.id = manual_filament_id
        and filaments.user_id = (select auth.uid())
    )
  )
  and (
    manual_machine_id is null
    or exists (
      select 1
      from public.machines
      where machines.id = manual_machine_id
        and machines.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users can update own external projects" on public.external_projects;
create policy "Users can update own external projects" on public.external_projects
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    manual_filament_id is null
    or exists (
      select 1
      from public.filaments
      where filaments.id = manual_filament_id
        and filaments.user_id = (select auth.uid())
    )
  )
  and (
    manual_machine_id is null
    or exists (
      select 1
      from public.machines
      where machines.id = manual_machine_id
        and machines.user_id = (select auth.uid())
    )
  )
);

commit;
