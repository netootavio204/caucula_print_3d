begin;

create table if not exists public.project_model_filaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_model_id uuid not null references public.project_models(id) on delete cascade,
  model_id uuid not null references public.project_models(id) on delete cascade,
  filament_id uuid not null references public.filaments(id) on delete restrict,
  color_name text,
  weight_used_g numeric not null default 0 check (weight_used_g > 0),
  weight_g numeric not null check (weight_g > 0),
  cost numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_model_filaments
add column if not exists color_name text;

alter table public.project_model_filaments
add column if not exists project_model_id uuid references public.project_models(id) on delete cascade,
add column if not exists model_id uuid references public.project_models(id) on delete cascade,
add column if not exists weight_used_g numeric,
add column if not exists weight_g numeric,
add column if not exists cost numeric not null default 0;

update public.project_model_filaments
set project_model_id = coalesce(project_model_id, model_id),
    model_id = coalesce(model_id, project_model_id),
    weight_used_g = coalesce(weight_used_g, weight_g),
    weight_g = coalesce(weight_g, weight_used_g),
    cost = coalesce(cost, 0)
where project_model_id is null
   or model_id is null
   or weight_used_g is null
   or weight_g is null
   or cost is null;

alter table public.project_model_filaments
alter column project_model_id set not null,
alter column model_id set not null,
alter column weight_g set not null,
alter column weight_used_g set not null;

create index if not exists project_model_filaments_user_id_idx on public.project_model_filaments(user_id);
create index if not exists project_model_filaments_project_model_id_idx on public.project_model_filaments(project_model_id);
create index if not exists project_model_filaments_model_id_idx on public.project_model_filaments(model_id);
create index if not exists project_model_filaments_filament_id_idx on public.project_model_filaments(filament_id);

drop trigger if exists project_model_filaments_set_updated_at on public.project_model_filaments;
create trigger project_model_filaments_set_updated_at
before update on public.project_model_filaments
for each row execute function public.set_updated_at();

alter table public.project_model_filaments enable row level security;

drop policy if exists "Users can select own project model filaments" on public.project_model_filaments;
create policy "Users can select own project model filaments" on public.project_model_filaments
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own project model filaments" on public.project_model_filaments;
create policy "Users can insert own project model filaments" on public.project_model_filaments
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.project_models
    where project_models.id = project_model_id
      and project_models.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.filaments
    where filaments.id = filament_id
      and filaments.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update own project model filaments" on public.project_model_filaments;
create policy "Users can update own project model filaments" on public.project_model_filaments
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.project_models
    where project_models.id = project_model_id
      and project_models.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.filaments
    where filaments.id = filament_id
      and filaments.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete own project model filaments" on public.project_model_filaments;
create policy "Users can delete own project model filaments" on public.project_model_filaments
for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on table public.project_model_filaments to authenticated;

create or replace function public.save_project_model(
  p_model jsonb,
  p_supplies jsonb,
  p_extra_costs jsonb,
  p_filaments jsonb,
  p_model_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  target_id uuid;
  item jsonb;
  filament_count integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_model->>'name'), '') is null then raise exception 'Project name is required'; end if;
  if nullif(p_model->>'default_machine_id', '') is not null and not exists (
    select 1 from public.machines where id = (p_model->>'default_machine_id')::uuid and user_id = auth.uid()
  ) then raise exception 'Invalid machine'; end if;

  for item in select * from jsonb_array_elements(coalesce(p_filaments, '[]'::jsonb)) loop
    filament_count := filament_count + 1;
    if nullif(item->>'filament_id', '') is null or coalesce((item->>'weight_g')::numeric, 0) <= 0 then
      raise exception 'Invalid model filament';
    end if;
    if not exists (
      select 1 from public.filaments where id = (item->>'filament_id')::uuid and user_id = auth.uid()
    ) then raise exception 'Invalid filament'; end if;
  end loop;
  if filament_count = 0 then raise exception 'At least one filament is required'; end if;

  if p_model_id is null then
    insert into public.project_models (
      user_id, name, description, local_folder_path, project_url, thumbnail_url,
      print_days, print_hours, print_minutes, print_seconds, pieces_per_plate, plate_quantity,
      nozzle_diameter, size_x, size_y, size_z, default_machine_id, default_filament_id, default_filament_weight_g
    )
    values (
      auth.uid(), trim(p_model->>'name'), nullif(trim(p_model->>'description'), ''),
      nullif(trim(p_model->>'local_folder_path'), ''), nullif(trim(p_model->>'project_url'), ''),
      nullif(trim(p_model->>'thumbnail_url'), ''), (p_model->>'print_days')::numeric,
      (p_model->>'print_hours')::numeric, (p_model->>'print_minutes')::numeric,
      (p_model->>'print_seconds')::numeric, (p_model->>'pieces_per_plate')::numeric,
      (p_model->>'plate_quantity')::numeric, nullif(p_model->>'nozzle_diameter', '')::numeric,
      nullif(p_model->>'size_x', '')::numeric, nullif(p_model->>'size_y', '')::numeric,
      nullif(p_model->>'size_z', '')::numeric, nullif(p_model->>'default_machine_id', '')::uuid,
      nullif(p_model->>'default_filament_id', '')::uuid,
      nullif(p_model->>'default_filament_weight_g', '')::numeric
    )
    returning id into target_id;
  else
    target_id := p_model_id;
    update public.project_models
    set name = trim(p_model->>'name'),
        description = nullif(trim(p_model->>'description'), ''),
        local_folder_path = nullif(trim(p_model->>'local_folder_path'), ''),
        project_url = nullif(trim(p_model->>'project_url'), ''),
        thumbnail_url = nullif(trim(p_model->>'thumbnail_url'), ''),
        print_days = (p_model->>'print_days')::numeric,
        print_hours = (p_model->>'print_hours')::numeric,
        print_minutes = (p_model->>'print_minutes')::numeric,
        print_seconds = (p_model->>'print_seconds')::numeric,
        pieces_per_plate = (p_model->>'pieces_per_plate')::numeric,
        plate_quantity = (p_model->>'plate_quantity')::numeric,
        nozzle_diameter = nullif(p_model->>'nozzle_diameter', '')::numeric,
        size_x = nullif(p_model->>'size_x', '')::numeric,
        size_y = nullif(p_model->>'size_y', '')::numeric,
        size_z = nullif(p_model->>'size_z', '')::numeric,
        default_machine_id = nullif(p_model->>'default_machine_id', '')::uuid,
        default_filament_id = nullif(p_model->>'default_filament_id', '')::uuid,
        default_filament_weight_g = nullif(p_model->>'default_filament_weight_g', '')::numeric
    where id = target_id and user_id = auth.uid();
    if not found then raise exception 'Project not found'; end if;
    delete from public.project_model_supplies where project_model_id = target_id;
    delete from public.project_model_extra_costs where project_model_id = target_id;
    delete from public.project_model_filaments where project_model_id = target_id;
  end if;

  for item in select * from jsonb_array_elements(coalesce(p_filaments, '[]'::jsonb)) loop
    insert into public.project_model_filaments(user_id, project_model_id, model_id, filament_id, color_name, weight_used_g, weight_g, cost)
    values(auth.uid(), target_id, target_id, (item->>'filament_id')::uuid, nullif(trim(item->>'color_name'), ''), (item->>'weight_g')::numeric, (item->>'weight_g')::numeric, coalesce((item->>'cost')::numeric, 0));
  end loop;

  for item in select * from jsonb_array_elements(coalesce(p_supplies, '[]'::jsonb)) loop
    insert into public.project_model_supplies(user_id, project_model_id, supply_id, quantity_used)
    values(auth.uid(), target_id, (item->>'supply_id')::uuid, (item->>'quantity_used')::numeric);
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_extra_costs, '[]'::jsonb)) loop
    insert into public.project_model_extra_costs(user_id, project_model_id, name, value)
    values(auth.uid(), target_id, trim(item->>'name'), (item->>'value')::numeric);
  end loop;
  return target_id;
end;
$$;

create or replace function public.save_ready_stock(
  p_stock jsonb,
  p_stock_id uuid default null,
  p_deduct_materials boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_old public.ready_stock;
  v_model public.project_models;
  v_filament public.filaments;
  v_model_filament record;
  v_supply record;
  v_quantity numeric := coalesce((p_stock->>'quantity')::numeric, 0);
  v_difference numeric;
  v_model_filament_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_stock->>'name'), '') is null or v_quantity <= 0 then raise exception 'Invalid stock product'; end if;
  if coalesce((p_stock->>'unit_cost')::numeric, 0) < 0 or coalesce((p_stock->>'sale_price')::numeric, 0) < 0 then
    raise exception 'Invalid stock values';
  end if;

  if p_stock_id is not null then
    select * into v_old from public.ready_stock
    where id = p_stock_id and user_id = auth.uid() for update;
    if not found then raise exception 'Stock product not found'; end if;

    update public.ready_stock
    set project_model_id = nullif(p_stock->>'project_model_id', '')::uuid,
        name = trim(p_stock->>'name'),
        quantity = v_quantity,
        quantity_internal = v_quantity,
        unit_cost = (p_stock->>'unit_cost')::numeric,
        sale_price = (p_stock->>'sale_price')::numeric,
        image_url = nullif(trim(p_stock->>'image_url'), ''),
        notes = nullif(trim(p_stock->>'notes'), ''),
        status = case
          when quantity_consigned > 0 then 'em_consignacao'
          when v_quantity <= 0 then 'esgotado'
          else 'disponivel'
        end
    where id = p_stock_id
    returning id into v_id;

    v_difference := v_quantity - v_old.quantity_internal;
    if v_difference <> 0 then
      insert into public.ready_stock_movements (user_id, ready_stock_id, movement_type, quantity, description)
      values (
        auth.uid(), v_id, 'ajuste_manual', abs(v_difference),
        case when v_difference > 0 then 'Aumento manual do estoque interno' else 'Reducao manual do estoque interno' end
      );
    end if;
    return v_id;
  end if;

  if p_deduct_materials then
    select * into v_model from public.project_models
    where id = nullif(p_stock->>'project_model_id', '')::uuid and user_id = auth.uid();
    if not found then raise exception 'Select a valid project model for automatic deduction'; end if;

    select count(*) into v_model_filament_count
    from public.project_model_filaments
    where project_model_id = v_model.id and user_id = auth.uid();

    if v_model_filament_count > 0 then
      for v_model_filament in
        select * from public.project_model_filaments
        where project_model_id = v_model.id and user_id = auth.uid()
      loop
        select * into v_filament from public.filaments
        where id = v_model_filament.filament_id and user_id = auth.uid() for update;
        if not found or v_filament.stock_real_g - v_filament.stock_reserved_g < v_model_filament.weight_used_g then
          raise exception 'Estoque insuficiente para este filamento.';
        end if;
        update public.filaments
        set stock_real_g = stock_real_g - v_model_filament.weight_used_g
        where id = v_filament.id;
        insert into public.filament_movements (user_id, filament_id, movement_type, quantity_g, description)
        values (auth.uid(), v_filament.id, 'saida', v_model_filament.weight_used_g, 'Consumo para produto pronto');
      end loop;
    elsif v_model.default_filament_id is not null and v_model.default_filament_weight_g is not null then
      select * into v_filament from public.filaments
      where id = v_model.default_filament_id and user_id = auth.uid() for update;
      if not found or v_filament.stock_real_g - v_filament.stock_reserved_g < v_model.default_filament_weight_g then
        raise exception 'Estoque insuficiente para este filamento.';
      end if;
      update public.filaments set stock_real_g = stock_real_g - v_model.default_filament_weight_g where id = v_filament.id;
      insert into public.filament_movements (user_id, filament_id, movement_type, quantity_g, description)
      values (auth.uid(), v_filament.id, 'saida', v_model.default_filament_weight_g, 'Consumo para produto pronto');
    end if;

    for v_supply in select * from public.project_model_supplies where project_model_id = v_model.id
    loop
      update public.supplies
      set stock_quantity = stock_quantity - v_supply.quantity_used
      where id = v_supply.supply_id and user_id = auth.uid() and stock_quantity >= v_supply.quantity_used;
      if not found then raise exception 'Estoque insuficiente para este insumo.'; end if;
    end loop;
  end if;

  insert into public.ready_stock (
    user_id, project_model_id, name, quantity, quantity_internal,
    unit_cost, sale_price, image_url, notes
  ) values (
    auth.uid(), nullif(p_stock->>'project_model_id', '')::uuid, trim(p_stock->>'name'),
    v_quantity, v_quantity, (p_stock->>'unit_cost')::numeric, (p_stock->>'sale_price')::numeric,
    nullif(trim(p_stock->>'image_url'), ''), nullif(trim(p_stock->>'notes'), '')
  ) returning id into v_id;

  insert into public.ready_stock_movements (user_id, ready_stock_id, movement_type, quantity, description)
  values (auth.uid(), v_id, 'entrada_manual', v_quantity, 'Entrada de produto pronto');
  return v_id;
end;
$$;

revoke all on function public.save_project_model(jsonb, jsonb, jsonb, jsonb, uuid) from public, anon;
grant execute on function public.save_project_model(jsonb, jsonb, jsonb, jsonb, uuid) to authenticated;

revoke all on function public.save_ready_stock(jsonb, uuid, boolean) from public, anon;
grant execute on function public.save_ready_stock(jsonb, uuid, boolean) to authenticated;

commit;
