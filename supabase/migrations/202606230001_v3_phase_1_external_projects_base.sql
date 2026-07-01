begin;

create table if not exists public.external_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source_url text,
  source_platform text,
  source_author text,
  source_license text,
  description text,
  status text not null default 'rascunho',
  file_type text,
  main_file_path text,
  estimated_weight_g numeric,
  estimated_time_minutes numeric,
  estimated_plates_count integer,
  manual_weight_g numeric,
  manual_time_minutes numeric,
  manual_plates_count integer,
  final_weight_g numeric,
  final_time_minutes numeric,
  final_plates_count integer,
  safety_margin_percent numeric not null default 15,
  estimated_price numeric,
  final_price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.external_project_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_project_id uuid not null references public.external_projects(id) on delete cascade,
  file_name text not null,
  file_type text,
  file_path text not null,
  file_size bigint,
  mime_type text,
  is_main_file boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.external_project_plates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_project_id uuid not null references public.external_projects(id) on delete cascade,
  plate_index integer not null,
  plate_name text,
  estimated_weight_g numeric,
  estimated_time_minutes numeric,
  manual_weight_g numeric,
  manual_time_minutes numeric,
  final_weight_g numeric,
  final_time_minutes numeric,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists external_projects_user_id_idx on public.external_projects(user_id);
create index if not exists external_project_files_user_id_idx on public.external_project_files(user_id);
create index if not exists external_project_files_project_id_idx on public.external_project_files(external_project_id);
create index if not exists external_project_plates_user_id_idx on public.external_project_plates(user_id);
create index if not exists external_project_plates_project_id_idx on public.external_project_plates(external_project_id);

drop trigger if exists external_projects_set_updated_at on public.external_projects;
create trigger external_projects_set_updated_at
before update on public.external_projects
for each row execute function public.set_updated_at();

drop trigger if exists external_project_plates_set_updated_at on public.external_project_plates;
create trigger external_project_plates_set_updated_at
before update on public.external_project_plates
for each row execute function public.set_updated_at();

alter table public.external_projects enable row level security;
alter table public.external_project_files enable row level security;
alter table public.external_project_plates enable row level security;

drop policy if exists "Users can select own external projects" on public.external_projects;
create policy "Users can select own external projects" on public.external_projects
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own external projects" on public.external_projects;
create policy "Users can insert own external projects" on public.external_projects
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own external projects" on public.external_projects;
create policy "Users can update own external projects" on public.external_projects
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own external projects" on public.external_projects;
create policy "Users can delete own external projects" on public.external_projects
for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can select own external project files" on public.external_project_files;
create policy "Users can select own external project files" on public.external_project_files
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own external project files" on public.external_project_files;
create policy "Users can insert own external project files" on public.external_project_files
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.external_projects
    where external_projects.id = external_project_id
      and external_projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update own external project files" on public.external_project_files;
create policy "Users can update own external project files" on public.external_project_files
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
);

drop policy if exists "Users can delete own external project files" on public.external_project_files;
create policy "Users can delete own external project files" on public.external_project_files
for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can select own external project plates" on public.external_project_plates;
create policy "Users can select own external project plates" on public.external_project_plates
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own external project plates" on public.external_project_plates;
create policy "Users can insert own external project plates" on public.external_project_plates
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.external_projects
    where external_projects.id = external_project_id
      and external_projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update own external project plates" on public.external_project_plates;
create policy "Users can update own external project plates" on public.external_project_plates
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
);

drop policy if exists "Users can delete own external project plates" on public.external_project_plates;
create policy "Users can delete own external project plates" on public.external_project_plates
for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on table
  public.external_projects,
  public.external_project_files,
  public.external_project_plates
to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'external-projects',
  'external-projects',
  false,
  104857600,
  null
)
on conflict (id) do nothing;

drop policy if exists "Users can read own external project files" on storage.objects;
create policy "Users can read own external project files" on storage.objects
for select to authenticated using (
  bucket_id = 'external-projects'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'projects'
  and (storage.foldername(name))[3] is not null
);

drop policy if exists "Users can upload own external project files" on storage.objects;
create policy "Users can upload own external project files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'external-projects'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'projects'
  and (storage.foldername(name))[3] is not null
);

drop policy if exists "Users can update own external project files" on storage.objects;
create policy "Users can update own external project files" on storage.objects
for update to authenticated
using (
  bucket_id = 'external-projects'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'projects'
  and (storage.foldername(name))[3] is not null
)
with check (
  bucket_id = 'external-projects'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'projects'
  and (storage.foldername(name))[3] is not null
);

drop policy if exists "Users can delete own external project files" on storage.objects;
create policy "Users can delete own external project files" on storage.objects
for delete to authenticated using (
  bucket_id = 'external-projects'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'projects'
  and (storage.foldername(name))[3] is not null
);

commit;
