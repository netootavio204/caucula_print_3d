begin;

alter table public.budgets add column if not exists project_url text;
alter table public.budgets add column if not exists local_folder_path text;
alter table public.budgets add column if not exists thumbnail_url text;

alter table public.project_models add column if not exists default_filament_id uuid references public.filaments(id) on delete set null;
alter table public.project_models add column if not exists default_filament_weight_g numeric check (default_filament_weight_g is null or default_filament_weight_g > 0);

create table if not exists public.project_model_supplies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_model_id uuid not null references public.project_models(id) on delete cascade,
  supply_id uuid not null references public.supplies(id) on delete restrict,
  quantity_used numeric not null check (quantity_used > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.project_model_extra_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_model_id uuid not null references public.project_models(id) on delete cascade,
  name text not null,
  value numeric not null check (value >= 0),
  created_at timestamptz not null default now()
);

create index if not exists project_model_supplies_user_id_idx on public.project_model_supplies(user_id);
create index if not exists project_model_extra_costs_user_id_idx on public.project_model_extra_costs(user_id);

alter table public.project_model_supplies enable row level security;
alter table public.project_model_extra_costs enable row level security;

drop policy if exists "Users can manage own project model supplies" on public.project_model_supplies;
create policy "Users can manage own project model supplies" on public.project_model_supplies for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.project_models where id = project_model_id and user_id = (select auth.uid()))
  and exists (select 1 from public.supplies where id = supply_id and user_id = (select auth.uid()))
);

drop policy if exists "Users can manage own project model extra costs" on public.project_model_extra_costs;
create policy "Users can manage own project model extra costs" on public.project_model_extra_costs for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.project_models where id = project_model_id and user_id = (select auth.uid()))
);

grant select, insert, update, delete on public.project_model_supplies, public.project_model_extra_costs to authenticated;

drop policy if exists "Users can manage own project models" on public.project_models;
create policy "Users can manage own project models" on public.project_models for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (default_machine_id is null or exists (select 1 from public.machines where id = default_machine_id and user_id = (select auth.uid())))
  and (default_filament_id is null or exists (select 1 from public.filaments where id = default_filament_id and user_id = (select auth.uid())))
);

create or replace function public.save_budget(
  p_budget jsonb,
  p_filaments jsonb,
  p_supplies jsonb,
  p_extra_costs jsonb,
  p_budget_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  target_id uuid;
  existing_status text;
  item jsonb;
  old_item record;
  filament_record public.filaments;
  supply_record public.supplies;
  used_weight numeric;
  used_quantity numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_budget->>'project_name'), '') is null then raise exception 'Project name is required'; end if;
  if coalesce((p_budget->>'total_time_hours')::numeric, 0) <= 0 then raise exception 'Print time must be greater than zero'; end if;
  if coalesce((p_budget->>'total_pieces')::numeric, 0) <= 0 then raise exception 'Total pieces must be greater than zero'; end if;
  if jsonb_array_length(coalesce(p_filaments, '[]'::jsonb)) = 0 then raise exception 'At least one filament is required'; end if;
  if not exists (select 1 from public.machines where id = (p_budget->>'machine_id')::uuid and user_id = auth.uid()) then raise exception 'Invalid machine'; end if;

  if p_budget_id is not null then
    select status into existing_status from public.budgets where id = p_budget_id and user_id = auth.uid() for update;
    if not found then raise exception 'Budget not found'; end if;
    if existing_status <> 'pendente' then raise exception 'Only pending budgets can be edited'; end if;
    for old_item in select * from public.budget_filaments where budget_id = p_budget_id loop
      update public.filaments set stock_reserved_g = stock_reserved_g - old_item.weight_used_g
      where id = old_item.filament_id and user_id = auth.uid() and stock_reserved_g >= old_item.weight_used_g;
      if not found then raise exception 'Invalid existing reservation'; end if;
      insert into public.filament_movements(user_id, filament_id, movement_type, quantity_g, description, budget_id)
      values (auth.uid(), old_item.filament_id, 'cancelamento_reserva', old_item.weight_used_g, 'Reserva anterior removida para edição', p_budget_id);
    end loop;
    delete from public.budget_filaments where budget_id = p_budget_id;
    delete from public.budget_supplies where budget_id = p_budget_id;
    delete from public.budget_extra_costs where budget_id = p_budget_id;
    target_id := p_budget_id;
    update public.budgets set
      client_id = nullif(p_budget->>'client_id', '')::uuid,
      client_name = nullif(trim(p_budget->>'client_name'), ''), client_phone = nullif(trim(p_budget->>'client_phone'), ''),
      client_email = nullif(trim(p_budget->>'client_email'), ''), client_address = nullif(trim(p_budget->>'client_address'), ''),
      client_city = nullif(trim(p_budget->>'client_city'), ''), client_state = nullif(trim(p_budget->>'client_state'), ''),
      project_name = trim(p_budget->>'project_name'), description = nullif(trim(p_budget->>'description'), ''),
      project_url = nullif(trim(p_budget->>'project_url'), ''), local_folder_path = nullif(trim(p_budget->>'local_folder_path'), ''), thumbnail_url = nullif(trim(p_budget->>'thumbnail_url'), ''),
      print_days = (p_budget->>'print_days')::numeric, print_hours = (p_budget->>'print_hours')::numeric,
      print_minutes = (p_budget->>'print_minutes')::numeric, print_seconds = (p_budget->>'print_seconds')::numeric,
      total_time_hours = (p_budget->>'total_time_hours')::numeric, pieces_per_plate = (p_budget->>'pieces_per_plate')::numeric,
      plate_quantity = (p_budget->>'plate_quantity')::numeric, total_pieces = (p_budget->>'total_pieces')::numeric,
      nozzle_diameter = nullif(p_budget->>'nozzle_diameter', '')::numeric, size_x = nullif(p_budget->>'size_x', '')::numeric,
      size_y = nullif(p_budget->>'size_y', '')::numeric, size_z = nullif(p_budget->>'size_z', '')::numeric,
      machine_id = (p_budget->>'machine_id')::uuid, filament_cost = (p_budget->>'filament_cost')::numeric,
      service_cost = (p_budget->>'service_cost')::numeric, energy_cost = (p_budget->>'energy_cost')::numeric,
      maintenance_cost = (p_budget->>'maintenance_cost')::numeric, depreciation_cost = (p_budget->>'depreciation_cost')::numeric,
      supplies_cost = (p_budget->>'supplies_cost')::numeric, extra_costs = (p_budget->>'extra_costs')::numeric,
      failure_margin_value = (p_budget->>'failure_margin_value')::numeric, total_production_cost = (p_budget->>'total_production_cost')::numeric,
      gross_profit = (p_budget->>'gross_profit')::numeric, fees_value = (p_budget->>'fees_value')::numeric,
      suggested_price = (p_budget->>'suggested_price')::numeric, price_per_piece = (p_budget->>'price_per_piece')::numeric,
      net_profit = (p_budget->>'net_profit')::numeric, net_profit_per_piece = (p_budget->>'net_profit_per_piece')::numeric
    where id = target_id and user_id = auth.uid();
  else
    insert into public.budgets (
      user_id, client_id, client_name, client_phone, client_email, client_address, client_city, client_state,
      project_name, description, project_url, local_folder_path, thumbnail_url,
      print_days, print_hours, print_minutes, print_seconds, total_time_hours, pieces_per_plate, plate_quantity, total_pieces,
      nozzle_diameter, size_x, size_y, size_z, machine_id, filament_cost, service_cost, energy_cost, maintenance_cost,
      depreciation_cost, supplies_cost, extra_costs, failure_margin_value, total_production_cost, gross_profit, fees_value,
      suggested_price, price_per_piece, net_profit, net_profit_per_piece
    ) values (
      auth.uid(), nullif(p_budget->>'client_id', '')::uuid, nullif(trim(p_budget->>'client_name'), ''), nullif(trim(p_budget->>'client_phone'), ''),
      nullif(trim(p_budget->>'client_email'), ''), nullif(trim(p_budget->>'client_address'), ''), nullif(trim(p_budget->>'client_city'), ''), nullif(trim(p_budget->>'client_state'), ''),
      trim(p_budget->>'project_name'), nullif(trim(p_budget->>'description'), ''), nullif(trim(p_budget->>'project_url'), ''),
      nullif(trim(p_budget->>'local_folder_path'), ''), nullif(trim(p_budget->>'thumbnail_url'), ''),
      (p_budget->>'print_days')::numeric, (p_budget->>'print_hours')::numeric, (p_budget->>'print_minutes')::numeric,
      (p_budget->>'print_seconds')::numeric, (p_budget->>'total_time_hours')::numeric, (p_budget->>'pieces_per_plate')::numeric,
      (p_budget->>'plate_quantity')::numeric, (p_budget->>'total_pieces')::numeric, nullif(p_budget->>'nozzle_diameter', '')::numeric,
      nullif(p_budget->>'size_x', '')::numeric, nullif(p_budget->>'size_y', '')::numeric, nullif(p_budget->>'size_z', '')::numeric,
      (p_budget->>'machine_id')::uuid, (p_budget->>'filament_cost')::numeric, (p_budget->>'service_cost')::numeric,
      (p_budget->>'energy_cost')::numeric, (p_budget->>'maintenance_cost')::numeric, (p_budget->>'depreciation_cost')::numeric,
      (p_budget->>'supplies_cost')::numeric, (p_budget->>'extra_costs')::numeric, (p_budget->>'failure_margin_value')::numeric,
      (p_budget->>'total_production_cost')::numeric, (p_budget->>'gross_profit')::numeric, (p_budget->>'fees_value')::numeric,
      (p_budget->>'suggested_price')::numeric, (p_budget->>'price_per_piece')::numeric, (p_budget->>'net_profit')::numeric,
      (p_budget->>'net_profit_per_piece')::numeric
    ) returning id into target_id;
  end if;

  for item in select * from jsonb_array_elements(p_filaments) loop
    used_weight := (item->>'weight_used_g')::numeric;
    if used_weight <= 0 then raise exception 'Invalid filament weight'; end if;
    select * into filament_record from public.filaments where id = (item->>'filament_id')::uuid and user_id = auth.uid() for update;
    if not found or filament_record.stock_real_g - filament_record.stock_reserved_g < used_weight then raise exception 'Estoque insuficiente para este filamento.'; end if;
    insert into public.budget_filaments(user_id, budget_id, filament_id, weight_used_g, cost)
    values (auth.uid(), target_id, filament_record.id, used_weight, used_weight * filament_record.price_per_gram);
    update public.filaments set stock_reserved_g = stock_reserved_g + used_weight where id = filament_record.id;
    insert into public.filament_movements(user_id, filament_id, movement_type, quantity_g, description, budget_id)
    values (auth.uid(), filament_record.id, 'reserva', used_weight, 'Reserva para orçamento', target_id);
  end loop;

  for item in select * from jsonb_array_elements(coalesce(p_supplies, '[]'::jsonb)) loop
    used_quantity := (item->>'quantity_used')::numeric;
    select * into supply_record from public.supplies where id = (item->>'supply_id')::uuid and user_id = auth.uid();
    if not found or used_quantity <= 0 or supply_record.stock_quantity < used_quantity then raise exception 'Estoque insuficiente para este insumo.'; end if;
    insert into public.budget_supplies(user_id, budget_id, supply_id, quantity_used, cost)
    values (auth.uid(), target_id, supply_record.id, used_quantity, used_quantity * supply_record.unit_cost);
  end loop;

  for item in select * from jsonb_array_elements(coalesce(p_extra_costs, '[]'::jsonb)) loop
    if nullif(trim(item->>'name'), '') is null or (item->>'value')::numeric < 0 then raise exception 'Invalid extra cost'; end if;
    insert into public.budget_extra_costs(user_id, budget_id, name, value)
    values (auth.uid(), target_id, trim(item->>'name'), (item->>'value')::numeric);
  end loop;
  return target_id;
end;
$$;

create or replace function public.approve_budget(p_budget_id uuid) returns void
language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  update public.budgets set status = 'aprovado' where id = p_budget_id and user_id = auth.uid() and status = 'pendente';
  if not found then raise exception 'Only pending budgets can be approved'; end if;
end; $$;

create or replace function public.reject_budget(p_budget_id uuid) returns void
language plpgsql security invoker set search_path = public, pg_temp as $$
declare item record; current_status text;
begin
  select status into current_status from public.budgets where id = p_budget_id and user_id = auth.uid() for update;
  if not found then raise exception 'Budget not found'; end if;
  if current_status = 'baixado_estoque' then raise exception 'Completed budget cannot be rejected'; end if;
  if current_status <> 'recusado' then
    for item in select * from public.budget_filaments where budget_id = p_budget_id loop
      update public.filaments set stock_reserved_g = stock_reserved_g - item.weight_used_g where id = item.filament_id and stock_reserved_g >= item.weight_used_g;
      insert into public.filament_movements(user_id, filament_id, movement_type, quantity_g, description, budget_id)
      values (auth.uid(), item.filament_id, 'cancelamento_reserva', item.weight_used_g, 'Reserva liberada por recusa', p_budget_id);
    end loop;
    update public.budgets set status = 'recusado' where id = p_budget_id;
  end if;
end; $$;

create or replace function public.finalize_budget_stock(p_budget_id uuid) returns void
language plpgsql security invoker set search_path = public, pg_temp as $$
declare item record; supply_item record; current_status text;
begin
  select status into current_status from public.budgets where id = p_budget_id and user_id = auth.uid() for update;
  if not found then raise exception 'Budget not found'; end if;
  if current_status <> 'aprovado' then raise exception 'Only approved budgets can update stock'; end if;
  for item in select * from public.budget_filaments where budget_id = p_budget_id loop
    update public.filaments set stock_real_g = stock_real_g - item.weight_used_g, stock_reserved_g = stock_reserved_g - item.weight_used_g
    where id = item.filament_id and user_id = auth.uid() and stock_real_g >= item.weight_used_g and stock_reserved_g >= item.weight_used_g;
    if not found then raise exception 'Invalid filament stock'; end if;
    insert into public.filament_movements(user_id, filament_id, movement_type, quantity_g, description, budget_id)
    values (auth.uid(), item.filament_id, 'baixa_definitiva', item.weight_used_g, 'Baixa definitiva do orçamento', p_budget_id);
  end loop;
  for supply_item in select * from public.budget_supplies where budget_id = p_budget_id loop
    update public.supplies set stock_quantity = stock_quantity - supply_item.quantity_used
    where id = supply_item.supply_id and user_id = auth.uid() and stock_quantity >= supply_item.quantity_used;
    if not found then raise exception 'Estoque insuficiente para este insumo.'; end if;
  end loop;
  update public.budgets set status = 'baixado_estoque' where id = p_budget_id;
end; $$;

create or replace function public.delete_budget_safely(p_budget_id uuid) returns void
language plpgsql security invoker set search_path = public, pg_temp as $$
declare item record; current_status text;
begin
  select status into current_status from public.budgets where id = p_budget_id and user_id = auth.uid() for update;
  if not found then raise exception 'Budget not found'; end if;
  if current_status = 'baixado_estoque' then raise exception 'Completed budget cannot be deleted'; end if;
  if current_status <> 'recusado' then
    for item in select * from public.budget_filaments where budget_id = p_budget_id loop
      update public.filaments set stock_reserved_g = stock_reserved_g - item.weight_used_g where id = item.filament_id and stock_reserved_g >= item.weight_used_g;
      insert into public.filament_movements(user_id, filament_id, movement_type, quantity_g, description, budget_id)
      values (auth.uid(), item.filament_id, 'cancelamento_reserva', item.weight_used_g, 'Reserva liberada por exclusão', p_budget_id);
    end loop;
  end if;
  delete from public.budgets where id = p_budget_id and user_id = auth.uid();
end; $$;

create or replace function public.expire_pending_budgets() returns integer
language plpgsql security invoker set search_path = public, pg_temp as $$
declare budget_item record; filament_item record; expired_count integer := 0;
begin
  for budget_item in
    select id from public.budgets
    where user_id = auth.uid() and status = 'pendente' and created_at + (validity_days * interval '1 day') < now()
    for update
  loop
    for filament_item in select * from public.budget_filaments where budget_id = budget_item.id loop
      update public.filaments set stock_reserved_g = stock_reserved_g - filament_item.weight_used_g
      where id = filament_item.filament_id and user_id = auth.uid() and stock_reserved_g >= filament_item.weight_used_g;
      insert into public.filament_movements(user_id, filament_id, movement_type, quantity_g, description, budget_id)
      values (auth.uid(), filament_item.filament_id, 'cancelamento_reserva', filament_item.weight_used_g, 'Reserva liberada por expiração', budget_item.id);
    end loop;
    update public.budgets set status = 'expirado' where id = budget_item.id;
    expired_count := expired_count + 1;
  end loop;
  return expired_count;
end; $$;

create or replace function public.save_project_model(p_model jsonb, p_supplies jsonb, p_extra_costs jsonb, p_model_id uuid default null)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare target_id uuid; item jsonb;
begin
  if nullif(trim(p_model->>'name'), '') is null then raise exception 'Project name is required'; end if;
  if nullif(p_model->>'default_machine_id', '') is not null and not exists (select 1 from public.machines where id = (p_model->>'default_machine_id')::uuid and user_id = auth.uid()) then raise exception 'Invalid machine'; end if;
  if nullif(p_model->>'default_filament_id', '') is not null and not exists (select 1 from public.filaments where id = (p_model->>'default_filament_id')::uuid and user_id = auth.uid()) then raise exception 'Invalid filament'; end if;
  if p_model_id is null then
    insert into public.project_models(user_id, name, description, local_folder_path, project_url, thumbnail_url, print_days, print_hours, print_minutes, print_seconds, pieces_per_plate, plate_quantity, nozzle_diameter, size_x, size_y, size_z, default_machine_id, default_filament_id, default_filament_weight_g)
    values (auth.uid(), trim(p_model->>'name'), nullif(trim(p_model->>'description'), ''), nullif(trim(p_model->>'local_folder_path'), ''), nullif(trim(p_model->>'project_url'), ''), nullif(trim(p_model->>'thumbnail_url'), ''), (p_model->>'print_days')::numeric, (p_model->>'print_hours')::numeric, (p_model->>'print_minutes')::numeric, (p_model->>'print_seconds')::numeric, (p_model->>'pieces_per_plate')::numeric, (p_model->>'plate_quantity')::numeric, nullif(p_model->>'nozzle_diameter', '')::numeric, nullif(p_model->>'size_x', '')::numeric, nullif(p_model->>'size_y', '')::numeric, nullif(p_model->>'size_z', '')::numeric, nullif(p_model->>'default_machine_id', '')::uuid, nullif(p_model->>'default_filament_id', '')::uuid, nullif(p_model->>'default_filament_weight_g', '')::numeric)
    returning id into target_id;
  else
    target_id := p_model_id;
    update public.project_models set name=trim(p_model->>'name'), description=nullif(trim(p_model->>'description'), ''), local_folder_path=nullif(trim(p_model->>'local_folder_path'), ''), project_url=nullif(trim(p_model->>'project_url'), ''), thumbnail_url=nullif(trim(p_model->>'thumbnail_url'), ''), print_days=(p_model->>'print_days')::numeric, print_hours=(p_model->>'print_hours')::numeric, print_minutes=(p_model->>'print_minutes')::numeric, print_seconds=(p_model->>'print_seconds')::numeric, pieces_per_plate=(p_model->>'pieces_per_plate')::numeric, plate_quantity=(p_model->>'plate_quantity')::numeric, nozzle_diameter=nullif(p_model->>'nozzle_diameter', '')::numeric, size_x=nullif(p_model->>'size_x', '')::numeric, size_y=nullif(p_model->>'size_y', '')::numeric, size_z=nullif(p_model->>'size_z', '')::numeric, default_machine_id=nullif(p_model->>'default_machine_id', '')::uuid, default_filament_id=nullif(p_model->>'default_filament_id', '')::uuid, default_filament_weight_g=nullif(p_model->>'default_filament_weight_g', '')::numeric where id=target_id and user_id=auth.uid();
    if not found then raise exception 'Project not found'; end if;
    delete from public.project_model_supplies where project_model_id=target_id;
    delete from public.project_model_extra_costs where project_model_id=target_id;
  end if;
  for item in select * from jsonb_array_elements(coalesce(p_supplies, '[]'::jsonb)) loop
    insert into public.project_model_supplies(user_id, project_model_id, supply_id, quantity_used) values(auth.uid(), target_id, (item->>'supply_id')::uuid, (item->>'quantity_used')::numeric);
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_extra_costs, '[]'::jsonb)) loop
    insert into public.project_model_extra_costs(user_id, project_model_id, name, value) values(auth.uid(), target_id, trim(item->>'name'), (item->>'value')::numeric);
  end loop;
  return target_id;
end; $$;

create or replace function public.save_ready_stock(p_stock jsonb, p_stock_id uuid default null, p_deduct_materials boolean default false)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare target_id uuid; model_record public.project_models; filament_record public.filaments; supply_item record;
begin
  if nullif(trim(p_stock->>'name'), '') is null or (p_stock->>'quantity')::numeric <= 0 then raise exception 'Invalid stock product'; end if;
  if p_stock_id is not null then
    update public.ready_stock set project_model_id=nullif(p_stock->>'project_model_id','')::uuid, name=trim(p_stock->>'name'), quantity=(p_stock->>'quantity')::numeric, unit_cost=(p_stock->>'unit_cost')::numeric, sale_price=(p_stock->>'sale_price')::numeric, image_url=nullif(trim(p_stock->>'image_url'),''), notes=nullif(trim(p_stock->>'notes'),'') where id=p_stock_id and user_id=auth.uid() returning id into target_id;
    if not found then raise exception 'Stock product not found'; end if;
    return target_id;
  end if;
  if p_deduct_materials then
    select * into model_record from public.project_models where id=nullif(p_stock->>'project_model_id','')::uuid and user_id=auth.uid();
    if not found then raise exception 'Select a valid project model for automatic deduction'; end if;
    if model_record.default_filament_id is not null and model_record.default_filament_weight_g is not null then
      select * into filament_record from public.filaments where id=model_record.default_filament_id and user_id=auth.uid() for update;
      if not found or filament_record.stock_real_g-filament_record.stock_reserved_g < model_record.default_filament_weight_g then raise exception 'Estoque insuficiente para este filamento.'; end if;
      update public.filaments set stock_real_g=stock_real_g-model_record.default_filament_weight_g where id=filament_record.id;
      insert into public.filament_movements(user_id, filament_id, movement_type, quantity_g, description) values(auth.uid(), filament_record.id, 'saida', model_record.default_filament_weight_g, 'Consumo para produto pronto');
    end if;
    for supply_item in select * from public.project_model_supplies where project_model_id=model_record.id loop
      update public.supplies set stock_quantity=stock_quantity-supply_item.quantity_used where id=supply_item.supply_id and user_id=auth.uid() and stock_quantity>=supply_item.quantity_used;
      if not found then raise exception 'Estoque insuficiente para este insumo.'; end if;
    end loop;
  end if;
  insert into public.ready_stock(user_id, project_model_id, name, quantity, unit_cost, sale_price, image_url, notes)
  values(auth.uid(), nullif(p_stock->>'project_model_id','')::uuid, trim(p_stock->>'name'), (p_stock->>'quantity')::numeric, (p_stock->>'unit_cost')::numeric, (p_stock->>'sale_price')::numeric, nullif(trim(p_stock->>'image_url'),''), nullif(trim(p_stock->>'notes'),'')) returning id into target_id;
  return target_id;
end; $$;

revoke all on function public.save_budget(jsonb,jsonb,jsonb,jsonb,uuid) from public, anon;
revoke all on function public.approve_budget(uuid) from public, anon;
revoke all on function public.reject_budget(uuid) from public, anon;
revoke all on function public.finalize_budget_stock(uuid) from public, anon;
revoke all on function public.delete_budget_safely(uuid) from public, anon;
revoke all on function public.expire_pending_budgets() from public, anon;
revoke all on function public.save_project_model(jsonb,jsonb,jsonb,uuid) from public, anon;
revoke all on function public.save_ready_stock(jsonb,uuid,boolean) from public, anon;
grant execute on function public.save_budget(jsonb,jsonb,jsonb,jsonb,uuid) to authenticated;
grant execute on function public.approve_budget(uuid) to authenticated;
grant execute on function public.reject_budget(uuid) to authenticated;
grant execute on function public.finalize_budget_stock(uuid) to authenticated;
grant execute on function public.delete_budget_safely(uuid) to authenticated;
grant execute on function public.expire_pending_budgets() to authenticated;
grant execute on function public.save_project_model(jsonb,jsonb,jsonb,uuid) to authenticated;
grant execute on function public.save_ready_stock(jsonb,uuid,boolean) to authenticated;

commit;
