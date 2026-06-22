begin;

update public.ready_stock
set quantity_internal = greatest(coalesce(quantity, 0), 0)
where quantity_internal is distinct from quantity;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ready_stock_quantities_nonnegative') then
    alter table public.ready_stock add constraint ready_stock_quantities_nonnegative
      check (quantity >= 0 and quantity_internal >= 0 and quantity_consigned >= 0 and quantity_sold >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'consignment_item_quantities_nonnegative') then
    alter table public.consignment_items add constraint consignment_item_quantities_nonnegative
      check (quantity_sent >= 0 and quantity_sold >= 0 and quantity_returned >= 0 and quantity_remaining >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'consignment_item_values_nonnegative') then
    alter table public.consignment_items add constraint consignment_item_values_nonnegative
      check (consignment_unit_price >= 0 and total_consigned_value >= 0 and sold_value >= 0 and paid_value >= 0 and open_value >= 0);
  end if;
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
  v_supply record;
  v_quantity numeric := coalesce((p_stock->>'quantity')::numeric, 0);
  v_difference numeric;
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
    if v_model.default_filament_id is not null and v_model.default_filament_weight_g is not null then
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

revoke all on function public.save_ready_stock(jsonb, uuid, boolean) from public, anon;
grant execute on function public.save_ready_stock(jsonb, uuid, boolean) to authenticated;

commit;
