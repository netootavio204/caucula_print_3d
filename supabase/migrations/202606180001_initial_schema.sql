begin;

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  company_name text,
  company_phone text,
  company_email text,
  company_instagram text,
  company_address text,
  company_city text,
  company_state text,
  company_logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type_brand text not null,
  color text not null,
  weight_kg numeric not null check (weight_kg > 0),
  price_paid numeric not null check (price_paid >= 0),
  price_per_gram numeric not null default 0 check (price_per_gram >= 0),
  supplier_image_url text,
  stock_real_g numeric not null default 0 check (stock_real_g >= 0),
  stock_reserved_g numeric not null default 0 check (stock_reserved_g >= 0 and stock_reserved_g <= stock_real_g),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  consumption_watts numeric not null default 0 check (consumption_watts >= 0),
  maintenance_per_hour numeric not null default 0 check (maintenance_per_hour >= 0),
  machine_value numeric not null default 0 check (machine_value >= 0),
  estimated_life_hours numeric not null default 10000 check (estimated_life_hours > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  total_price numeric not null default 0 check (total_price >= 0),
  quantity_purchased numeric not null default 0 check (quantity_purchased > 0),
  unit text not null check (unit in ('unidades', 'metros', 'gramas', 'kg', 'pacote', 'litros', 'ml')),
  unit_cost numeric not null default 0 check (unit_cost >= 0),
  stock_quantity numeric not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.global_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  energy_price_kwh numeric not null default 0 check (energy_price_kwh >= 0),
  failure_margin_percent numeric not null default 5 check (failure_margin_percent >= 0),
  markup_percent numeric not null default 30 check (markup_percent >= 0),
  taxes_percent numeric not null default 0 check (taxes_percent >= 0),
  card_fee_percent numeric not null default 0 check (card_fee_percent >= 0),
  fixed_ads_cost numeric not null default 0 check (fixed_ads_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  document text,
  phone text,
  email text,
  instagram text,
  address text,
  city text,
  state text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  local_folder_path text,
  project_url text,
  thumbnail_url text,
  print_days numeric not null default 0 check (print_days >= 0),
  print_hours numeric not null default 0 check (print_hours >= 0),
  print_minutes numeric not null default 0 check (print_minutes >= 0),
  print_seconds numeric not null default 0 check (print_seconds >= 0),
  pieces_per_plate numeric not null default 1 check (pieces_per_plate > 0),
  plate_quantity numeric not null default 1 check (plate_quantity > 0),
  nozzle_diameter numeric check (nozzle_diameter is null or nozzle_diameter > 0),
  size_x numeric check (size_x is null or size_x >= 0),
  size_y numeric check (size_y is null or size_y >= 0),
  size_z numeric check (size_z is null or size_z >= 0),
  default_machine_id uuid references public.machines(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name text,
  client_phone text,
  client_email text,
  client_address text,
  client_city text,
  client_state text,
  project_name text not null,
  description text,
  print_days numeric not null default 0 check (print_days >= 0),
  print_hours numeric not null default 0 check (print_hours >= 0),
  print_minutes numeric not null default 0 check (print_minutes >= 0),
  print_seconds numeric not null default 0 check (print_seconds >= 0),
  total_time_hours numeric not null default 0 check (total_time_hours >= 0),
  pieces_per_plate numeric not null default 1 check (pieces_per_plate > 0),
  plate_quantity numeric not null default 1 check (plate_quantity > 0),
  total_pieces numeric not null default 1 check (total_pieces > 0),
  nozzle_diameter numeric check (nozzle_diameter is null or nozzle_diameter > 0),
  size_x numeric check (size_x is null or size_x >= 0),
  size_y numeric check (size_y is null or size_y >= 0),
  size_z numeric check (size_z is null or size_z >= 0),
  machine_id uuid references public.machines(id) on delete set null,
  filament_cost numeric not null default 0 check (filament_cost >= 0),
  service_cost numeric not null default 0 check (service_cost >= 0),
  energy_cost numeric not null default 0 check (energy_cost >= 0),
  maintenance_cost numeric not null default 0 check (maintenance_cost >= 0),
  depreciation_cost numeric not null default 0 check (depreciation_cost >= 0),
  supplies_cost numeric not null default 0 check (supplies_cost >= 0),
  extra_costs numeric not null default 0 check (extra_costs >= 0),
  failure_margin_value numeric not null default 0 check (failure_margin_value >= 0),
  total_production_cost numeric not null default 0 check (total_production_cost >= 0),
  gross_profit numeric not null default 0,
  fees_value numeric not null default 0 check (fees_value >= 0),
  suggested_price numeric not null default 0 check (suggested_price >= 0),
  price_per_piece numeric not null default 0 check (price_per_piece >= 0),
  net_profit numeric not null default 0,
  net_profit_per_piece numeric not null default 0,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado', 'expirado', 'baixado_estoque')),
  validity_days numeric not null default 7 check (validity_days > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filament_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filament_id uuid not null references public.filaments(id) on delete cascade,
  movement_type text not null check (movement_type in ('entrada', 'saida', 'reserva', 'cancelamento_reserva', 'baixa_definitiva', 'ajuste_manual')),
  quantity_g numeric not null check (quantity_g > 0),
  description text,
  budget_id uuid references public.budgets(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_filaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid not null references public.budgets(id) on delete cascade,
  filament_id uuid not null references public.filaments(id) on delete restrict,
  weight_used_g numeric not null check (weight_used_g > 0),
  cost numeric not null check (cost >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.budget_supplies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid not null references public.budgets(id) on delete cascade,
  supply_id uuid not null references public.supplies(id) on delete restrict,
  quantity_used numeric not null check (quantity_used > 0),
  cost numeric not null check (cost >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.budget_extra_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid not null references public.budgets(id) on delete cascade,
  name text not null,
  value numeric not null check (value >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.ready_stock (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_model_id uuid references public.project_models(id) on delete set null,
  name text not null,
  quantity numeric not null default 0 check (quantity >= 0),
  unit_cost numeric not null default 0 check (unit_cost >= 0),
  sale_price numeric not null default 0 check (sale_price >= 0),
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists filaments_user_id_idx on public.filaments(user_id);
create index if not exists filament_movements_user_id_idx on public.filament_movements(user_id);
create index if not exists machines_user_id_idx on public.machines(user_id);
create index if not exists supplies_user_id_idx on public.supplies(user_id);
create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists project_models_user_id_idx on public.project_models(user_id);
create index if not exists budgets_user_id_idx on public.budgets(user_id);
create index if not exists budget_filaments_user_id_idx on public.budget_filaments(user_id);
create index if not exists budget_supplies_user_id_idx on public.budget_supplies(user_id);
create index if not exists budget_extra_costs_user_id_idx on public.budget_extra_costs(user_id);
create index if not exists ready_stock_user_id_idx on public.ready_stock(user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists filaments_set_updated_at on public.filaments;
create trigger filaments_set_updated_at before update on public.filaments for each row execute function public.set_updated_at();
drop trigger if exists machines_set_updated_at on public.machines;
create trigger machines_set_updated_at before update on public.machines for each row execute function public.set_updated_at();
drop trigger if exists supplies_set_updated_at on public.supplies;
create trigger supplies_set_updated_at before update on public.supplies for each row execute function public.set_updated_at();
drop trigger if exists global_settings_set_updated_at on public.global_settings;
create trigger global_settings_set_updated_at before update on public.global_settings for each row execute function public.set_updated_at();
drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at before update on public.clients for each row execute function public.set_updated_at();
drop trigger if exists project_models_set_updated_at on public.project_models;
create trigger project_models_set_updated_at before update on public.project_models for each row execute function public.set_updated_at();
drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at before update on public.budgets for each row execute function public.set_updated_at();
drop trigger if exists ready_stock_set_updated_at on public.ready_stock;
create trigger ready_stock_set_updated_at before update on public.ready_stock for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Usuário'),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.filaments enable row level security;
alter table public.filament_movements enable row level security;
alter table public.machines enable row level security;
alter table public.supplies enable row level security;
alter table public.global_settings enable row level security;
alter table public.clients enable row level security;
alter table public.project_models enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_filaments enable row level security;
alter table public.budget_supplies enable row level security;
alter table public.budget_extra_costs enable row level security;
alter table public.ready_stock enable row level security;

drop policy if exists "Users can manage own profile" on public.profiles;
create policy "Users can manage own profile" on public.profiles for all to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Users can manage own filaments" on public.filaments;
create policy "Users can manage own filaments" on public.filaments for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users can manage own machines" on public.machines;
create policy "Users can manage own machines" on public.machines for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users can manage own supplies" on public.supplies;
create policy "Users can manage own supplies" on public.supplies for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users can manage own settings" on public.global_settings;
create policy "Users can manage own settings" on public.global_settings for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users can manage own clients" on public.clients;
create policy "Users can manage own clients" on public.clients for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users can manage own project models" on public.project_models;
create policy "Users can manage own project models" on public.project_models for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (default_machine_id is null or exists (
    select 1 from public.machines where machines.id = default_machine_id and machines.user_id = (select auth.uid())
  ))
);

drop policy if exists "Users can manage own budgets" on public.budgets;
create policy "Users can manage own budgets" on public.budgets for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (client_id is null or exists (
    select 1 from public.clients where clients.id = client_id and clients.user_id = (select auth.uid())
  ))
  and (machine_id is null or exists (
    select 1 from public.machines where machines.id = machine_id and machines.user_id = (select auth.uid())
  ))
);

drop policy if exists "Users can manage own filament movements" on public.filament_movements;
create policy "Users can manage own filament movements" on public.filament_movements for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.filaments where filaments.id = filament_id and filaments.user_id = (select auth.uid()))
  and (budget_id is null or exists (select 1 from public.budgets where budgets.id = budget_id and budgets.user_id = (select auth.uid())))
);

drop policy if exists "Users can manage own budget filaments" on public.budget_filaments;
create policy "Users can manage own budget filaments" on public.budget_filaments for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.budgets where budgets.id = budget_id and budgets.user_id = (select auth.uid()))
  and exists (select 1 from public.filaments where filaments.id = filament_id and filaments.user_id = (select auth.uid()))
);

drop policy if exists "Users can manage own budget supplies" on public.budget_supplies;
create policy "Users can manage own budget supplies" on public.budget_supplies for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.budgets where budgets.id = budget_id and budgets.user_id = (select auth.uid()))
  and exists (select 1 from public.supplies where supplies.id = supply_id and supplies.user_id = (select auth.uid()))
);

drop policy if exists "Users can manage own budget extra costs" on public.budget_extra_costs;
create policy "Users can manage own budget extra costs" on public.budget_extra_costs for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.budgets where budgets.id = budget_id and budgets.user_id = (select auth.uid()))
);

drop policy if exists "Users can manage own ready stock" on public.ready_stock;
create policy "Users can manage own ready stock" on public.ready_stock for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (project_model_id is null or exists (
    select 1 from public.project_models where project_models.id = project_model_id and project_models.user_id = (select auth.uid())
  ))
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.filaments,
  public.filament_movements,
  public.machines,
  public.supplies,
  public.global_settings,
  public.clients,
  public.project_models,
  public.budgets,
  public.budget_filaments,
  public.budget_supplies,
  public.budget_extra_costs,
  public.ready_stock
to authenticated;

commit;
