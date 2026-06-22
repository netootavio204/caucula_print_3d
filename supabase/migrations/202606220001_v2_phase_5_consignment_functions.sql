begin;

create or replace function public.refresh_consignment_totals(p_consignment_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_remaining numeric;
  v_sold numeric;
  v_paid numeric;
  v_open numeric;
  v_status text;
begin
  if not exists (
    select 1 from public.consignments
    where id = p_consignment_id and user_id = auth.uid()
  ) then
    raise exception 'Consignment not found';
  end if;

  select
    coalesce(sum(quantity_remaining), 0),
    coalesce(sum(sold_value), 0),
    coalesce(sum(paid_value), 0),
    coalesce(sum(open_value), 0)
  into v_remaining, v_sold, v_paid, v_open
  from public.consignment_items
  where consignment_id = p_consignment_id and user_id = auth.uid();

  select status into v_status
  from public.consignments
  where id = p_consignment_id and user_id = auth.uid();

  if v_status <> 'cancelado' then
    v_status := case
      when v_remaining > 0 and v_sold <= 0 then 'em_consignacao'
      when v_remaining > 0 and v_open > 0 and v_paid > 0 then 'parcialmente_pago'
      when v_remaining > 0 then 'parcialmente_vendido'
      when v_sold <= 0 then 'finalizado'
      when v_open > 0 and v_paid <= 0 then 'vendido_nao_pago'
      when v_open > 0 then 'parcialmente_pago'
      else 'vendido_pago'
    end;
  end if;

  update public.consignments
  set
    total_consigned_value = coalesce((select sum(total_consigned_value) from public.consignment_items where consignment_id = p_consignment_id and user_id = auth.uid()), 0),
    total_sold_value = v_sold,
    total_paid_value = v_paid,
    total_open_value = v_open,
    status = v_status
  where id = p_consignment_id and user_id = auth.uid();
end;
$$;

create or replace function public.create_consignment(p_consignment jsonb, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id uuid := gen_random_uuid();
  v_item jsonb;
  v_stock public.ready_stock;
  v_quantity numeric;
  v_price numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one item is required';
  end if;
  if nullif(p_consignment->>'consignee_client_id', '') is null or not exists (
    select 1 from public.clients
    where id = (p_consignment->>'consignee_client_id')::uuid
      and user_id = auth.uid()
      and client_type in ('consignatario', 'ambos')
  ) then
    raise exception 'Invalid consignee';
  end if;
  if (
    select count(*) <> count(distinct value->>'ready_stock_id')
    from jsonb_array_elements(p_items)
  ) then
    raise exception 'Duplicate product in consignment';
  end if;

  insert into public.consignments (
    id, user_id, consignee_client_id, consignment_code, sent_date,
    expected_settlement_date, status, notes
  ) values (
    v_id,
    auth.uid(),
    (p_consignment->>'consignee_client_id')::uuid,
    coalesce(nullif(trim(p_consignment->>'consignment_code'), ''), 'CONS-' || upper(substr(replace(v_id::text, '-', ''), 1, 8))),
    coalesce(nullif(p_consignment->>'sent_date', '')::date, current_date),
    nullif(p_consignment->>'expected_settlement_date', '')::date,
    'em_consignacao',
    nullif(trim(p_consignment->>'notes'), '')
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item->>'quantity_sent')::numeric, 0);
    v_price := coalesce((v_item->>'consignment_unit_price')::numeric, 0);
    if v_quantity <= 0 or v_price < 0 then raise exception 'Invalid consignment item values'; end if;

    select * into v_stock
    from public.ready_stock
    where id = (v_item->>'ready_stock_id')::uuid and user_id = auth.uid()
    for update;
    if not found then raise exception 'Product not found'; end if;
    if v_stock.quantity_internal < v_quantity then
      raise exception 'Estoque insuficiente para o produto %.', v_stock.name;
    end if;

    update public.ready_stock
    set
      quantity_internal = quantity_internal - v_quantity,
      quantity = greatest(quantity - v_quantity, 0),
      quantity_consigned = quantity_consigned + v_quantity,
      status = 'em_consignacao'
    where id = v_stock.id;

    insert into public.consignment_items (
      user_id, consignment_id, ready_stock_id, product_code, product_name,
      quantity_sent, quantity_remaining, consignment_unit_price,
      total_consigned_value, sold_value, paid_value, open_value, status
    ) values (
      auth.uid(), v_id, v_stock.id, coalesce(v_stock.public_code, v_stock.internal_code), v_stock.name,
      v_quantity, v_quantity, v_price, v_quantity * v_price, 0, 0, 0, 'em_consignacao'
    );

    insert into public.ready_stock_movements (
      user_id, ready_stock_id, movement_type, quantity, description, consignment_id
    ) values (
      auth.uid(), v_stock.id, 'saida_consignacao', v_quantity,
      'Envio para consignacao ' || coalesce(nullif(trim(p_consignment->>'consignment_code'), ''), 'CONS-' || upper(substr(replace(v_id::text, '-', ''), 1, 8))),
      v_id
    );
  end loop;

  perform public.refresh_consignment_totals(v_id);
  return v_id;
end;
$$;

create or replace function public.add_consignment_item(p_consignment_id uuid, p_item jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item_id uuid := gen_random_uuid();
  v_consignment public.consignments;
  v_stock public.ready_stock;
  v_quantity numeric := coalesce((p_item->>'quantity_sent')::numeric, 0);
  v_price numeric := coalesce((p_item->>'consignment_unit_price')::numeric, 0);
begin
  select * into v_consignment from public.consignments
  where id = p_consignment_id and user_id = auth.uid() for update;
  if not found or v_consignment.status in ('cancelado', 'finalizado') then
    raise exception 'Consignment not found or closed';
  end if;
  if v_quantity <= 0 or v_price < 0 then raise exception 'Invalid consignment item values'; end if;
  if exists (
    select 1 from public.consignment_items
    where consignment_id = p_consignment_id
      and ready_stock_id = (p_item->>'ready_stock_id')::uuid
      and user_id = auth.uid()
  ) then raise exception 'Product already added to consignment'; end if;

  select * into v_stock from public.ready_stock
  where id = (p_item->>'ready_stock_id')::uuid and user_id = auth.uid() for update;
  if not found then raise exception 'Product not found'; end if;
  if v_stock.quantity_internal < v_quantity then raise exception 'Estoque insuficiente para este produto.'; end if;

  update public.ready_stock
  set quantity_internal = quantity_internal - v_quantity,
      quantity = greatest(quantity - v_quantity, 0),
      quantity_consigned = quantity_consigned + v_quantity,
      status = 'em_consignacao'
  where id = v_stock.id;

  insert into public.consignment_items (
    id, user_id, consignment_id, ready_stock_id, product_code, product_name,
    quantity_sent, quantity_remaining, consignment_unit_price,
    total_consigned_value, sold_value, paid_value, open_value, status
  ) values (
    v_item_id, auth.uid(), p_consignment_id, v_stock.id,
    coalesce(v_stock.public_code, v_stock.internal_code), v_stock.name,
    v_quantity, v_quantity, v_price, v_quantity * v_price, 0, 0, 0, 'em_consignacao'
  );

  insert into public.ready_stock_movements (
    user_id, ready_stock_id, movement_type, quantity, description, consignment_id
  ) values (auth.uid(), v_stock.id, 'saida_consignacao', v_quantity, 'Item adicionado a consignacao', p_consignment_id);
  perform public.refresh_consignment_totals(p_consignment_id);
  return v_item_id;
end;
$$;

create or replace function public.update_consignment_details(p_consignment_id uuid, p_consignment jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if nullif(p_consignment->>'consignee_client_id', '') is null or not exists (
    select 1 from public.clients
    where id = (p_consignment->>'consignee_client_id')::uuid
      and user_id = auth.uid()
      and client_type in ('consignatario', 'ambos')
  ) then raise exception 'Invalid consignee'; end if;

  update public.consignments
  set
    consignee_client_id = (p_consignment->>'consignee_client_id')::uuid,
    consignment_code = coalesce(nullif(trim(p_consignment->>'consignment_code'), ''), consignment_code),
    sent_date = coalesce(nullif(p_consignment->>'sent_date', '')::date, sent_date),
    expected_settlement_date = nullif(p_consignment->>'expected_settlement_date', '')::date,
    notes = nullif(trim(p_consignment->>'notes'), '')
  where id = p_consignment_id and user_id = auth.uid() and status <> 'cancelado';
  if not found then raise exception 'Consignment not found or canceled'; end if;
end;
$$;

create or replace function public.register_consignment_sale(p_item_id uuid, p_quantity numeric)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item public.consignment_items;
  v_consignment public.consignments;
  v_new_sold numeric;
  v_new_remaining numeric;
  v_sold_value numeric;
begin
  if p_quantity is null or p_quantity <= 0 then raise exception 'Invalid sale quantity'; end if;
  select * into v_item from public.consignment_items
  where id = p_item_id and user_id = auth.uid() for update;
  if not found then raise exception 'Consignment item not found'; end if;
  select * into v_consignment from public.consignments
  where id = v_item.consignment_id and user_id = auth.uid() for update;
  if v_consignment.status in ('cancelado', 'finalizado') then raise exception 'Consignment is closed'; end if;
  if p_quantity > v_item.quantity_remaining then raise exception 'Quantidade vendida maior que a disponivel.'; end if;

  perform 1 from public.ready_stock
  where id = v_item.ready_stock_id and user_id = auth.uid() for update;
  if not found then raise exception 'Product not found'; end if;

  v_new_sold := v_item.quantity_sold + p_quantity;
  v_new_remaining := v_item.quantity_remaining - p_quantity;
  v_sold_value := v_new_sold * v_item.consignment_unit_price;

  update public.ready_stock
  set quantity_consigned = quantity_consigned - p_quantity,
      quantity_sold = quantity_sold + p_quantity,
      status = case
        when quantity_internal <= 0 and quantity_consigned - p_quantity <= 0 then 'esgotado'
        when quantity_consigned - p_quantity > 0 then 'em_consignacao'
        else 'disponivel'
      end
  where id = v_item.ready_stock_id and user_id = auth.uid() and quantity_consigned >= p_quantity;
  if not found then raise exception 'Consigned stock is inconsistent'; end if;

  update public.consignment_items
  set quantity_sold = v_new_sold,
      quantity_remaining = v_new_remaining,
      sold_value = v_sold_value,
      open_value = greatest(v_sold_value - paid_value, 0),
      status = case
        when greatest(v_sold_value - paid_value, 0) <= 0 then 'vendido_pago'
        when paid_value > 0 then 'parcialmente_pago'
        else 'vendido_nao_pago'
      end
  where id = p_item_id;
  perform public.refresh_consignment_totals(v_item.consignment_id);
end;
$$;

create or replace function public.register_consignment_return(p_item_id uuid, p_quantity numeric)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item public.consignment_items;
  v_consignment public.consignments;
  v_remaining numeric;
  v_returned numeric;
begin
  if p_quantity is null or p_quantity <= 0 then raise exception 'Invalid return quantity'; end if;
  select * into v_item from public.consignment_items
  where id = p_item_id and user_id = auth.uid() for update;
  if not found then raise exception 'Consignment item not found'; end if;
  select * into v_consignment from public.consignments
  where id = v_item.consignment_id and user_id = auth.uid() for update;
  if v_consignment.status in ('cancelado', 'finalizado') then raise exception 'Consignment is closed'; end if;
  if p_quantity > v_item.quantity_remaining then raise exception 'Quantidade devolvida maior que a restante.'; end if;

  perform 1 from public.ready_stock
  where id = v_item.ready_stock_id and user_id = auth.uid() for update;
  if not found then raise exception 'Product not found'; end if;

  update public.ready_stock
  set quantity_internal = quantity_internal + p_quantity,
      quantity = quantity + p_quantity,
      quantity_consigned = quantity_consigned - p_quantity,
      status = case when quantity_consigned - p_quantity > 0 then 'em_consignacao' else 'disponivel' end
  where id = v_item.ready_stock_id and user_id = auth.uid() and quantity_consigned >= p_quantity;
  if not found then raise exception 'Consigned stock is inconsistent'; end if;

  v_returned := v_item.quantity_returned + p_quantity;
  v_remaining := v_item.quantity_remaining - p_quantity;
  update public.consignment_items
  set quantity_returned = v_returned,
      quantity_remaining = v_remaining,
      status = case
        when v_remaining <= 0 and quantity_sold <= 0 then 'devolvido'
        when open_value > 0 and paid_value > 0 then 'parcialmente_pago'
        when open_value > 0 then 'vendido_nao_pago'
        when quantity_sold > 0 then 'vendido_pago'
        else 'em_consignacao'
      end
  where id = p_item_id;

  insert into public.ready_stock_movements (
    user_id, ready_stock_id, movement_type, quantity, description, consignment_id
  ) values (auth.uid(), v_item.ready_stock_id, 'devolucao_consignacao', p_quantity, 'Devolucao de consignacao', v_item.consignment_id);
  perform public.refresh_consignment_totals(v_item.consignment_id);
end;
$$;

create or replace function public.register_consignment_payment(
  p_item_id uuid,
  p_amount numeric,
  p_payment_method text default null,
  p_payment_date date default current_date,
  p_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item public.consignment_items;
  v_consignment public.consignments;
  v_paid numeric;
  v_open numeric;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'Invalid payment amount'; end if;
  select * into v_item from public.consignment_items
  where id = p_item_id and user_id = auth.uid() for update;
  if not found then raise exception 'Consignment item not found'; end if;
  select * into v_consignment from public.consignments
  where id = v_item.consignment_id and user_id = auth.uid() for update;
  if v_consignment.status = 'cancelado' then raise exception 'Consignment is canceled'; end if;
  if v_item.open_value <= 0 then raise exception 'Item has no open value'; end if;
  if p_amount > v_item.open_value then raise exception 'Payment exceeds open value'; end if;

  v_paid := v_item.paid_value + p_amount;
  v_open := greatest(v_item.sold_value - v_paid, 0);
  update public.consignment_items
  set paid_value = v_paid,
      open_value = v_open,
      status = case when v_open <= 0 then 'vendido_pago' else 'parcialmente_pago' end
  where id = p_item_id;

  insert into public.consignment_payments (
    user_id, consignment_id, consignment_item_id, amount, payment_method, payment_date, notes
  ) values (
    auth.uid(), v_item.consignment_id, p_item_id, p_amount, nullif(p_payment_method, ''),
    coalesce(p_payment_date, current_date), nullif(trim(p_notes), '')
  );
  perform public.refresh_consignment_totals(v_item.consignment_id);
end;
$$;

create or replace function public.cancel_consignment(p_consignment_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_consignment public.consignments;
  v_item public.consignment_items;
begin
  select * into v_consignment from public.consignments
  where id = p_consignment_id and user_id = auth.uid() for update;
  if not found then raise exception 'Consignment not found'; end if;
  if v_consignment.status = 'cancelado' then raise exception 'Consignment already canceled'; end if;
  if exists (
    select 1 from public.consignment_items
    where consignment_id = p_consignment_id and user_id = auth.uid()
      and (quantity_sold > 0 or paid_value > 0)
  ) then raise exception 'Consignment with sales cannot be canceled'; end if;

  for v_item in
    select * from public.consignment_items
    where consignment_id = p_consignment_id and user_id = auth.uid()
    order by ready_stock_id
    for update
  loop
    if v_item.quantity_remaining > 0 then
      perform 1 from public.ready_stock
      where id = v_item.ready_stock_id and user_id = auth.uid() for update;
      update public.ready_stock
      set quantity_internal = quantity_internal + v_item.quantity_remaining,
          quantity = quantity + v_item.quantity_remaining,
          quantity_consigned = quantity_consigned - v_item.quantity_remaining,
          status = case when quantity_consigned - v_item.quantity_remaining > 0 then 'em_consignacao' else 'disponivel' end
      where id = v_item.ready_stock_id and user_id = auth.uid()
        and quantity_consigned >= v_item.quantity_remaining;
      if not found then raise exception 'Consigned stock is inconsistent'; end if;

      insert into public.ready_stock_movements (
        user_id, ready_stock_id, movement_type, quantity, description, consignment_id
      ) values (
        auth.uid(), v_item.ready_stock_id, 'devolucao_consignacao', v_item.quantity_remaining,
        'Devolucao por cancelamento do lote', p_consignment_id
      );

      update public.consignment_items
      set quantity_returned = quantity_returned + quantity_remaining,
          quantity_remaining = 0,
          status = case
            when quantity_sold <= 0 then 'devolvido'
            when open_value > 0 and paid_value > 0 then 'parcialmente_pago'
            when open_value > 0 then 'vendido_nao_pago'
            else 'vendido_pago'
          end
      where id = v_item.id;
    end if;
  end loop;

  update public.consignments set status = 'cancelado' where id = p_consignment_id;
  perform public.refresh_consignment_totals(p_consignment_id);
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
  v_model public.project_models;
  v_filament public.filaments;
  v_supply record;
  v_quantity numeric := coalesce((p_stock->>'quantity')::numeric, 0);
begin
  if nullif(trim(p_stock->>'name'), '') is null or v_quantity <= 0 then raise exception 'Invalid stock product'; end if;
  if p_stock_id is not null then
    update public.ready_stock
    set project_model_id = nullif(p_stock->>'project_model_id', '')::uuid,
        name = trim(p_stock->>'name'),
        quantity = v_quantity,
        quantity_internal = v_quantity,
        unit_cost = (p_stock->>'unit_cost')::numeric,
        sale_price = (p_stock->>'sale_price')::numeric,
        image_url = nullif(trim(p_stock->>'image_url'), ''),
        notes = nullif(trim(p_stock->>'notes'), ''),
        status = case when quantity_consigned > 0 then 'em_consignacao' else 'disponivel' end
    where id = p_stock_id and user_id = auth.uid()
    returning id into v_id;
    if not found then raise exception 'Stock product not found'; end if;
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
  return v_id;
end;
$$;

create or replace function public.record_ready_stock_sale(p_stock_id uuid, p_quantity numeric)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_stock public.ready_stock;
begin
  if p_quantity is null or p_quantity <= 0 then raise exception 'Invalid sale quantity'; end if;
  select * into v_stock from public.ready_stock
  where id = p_stock_id and user_id = auth.uid() for update;
  if not found then raise exception 'Product not found'; end if;
  if v_stock.quantity_internal < p_quantity then raise exception 'Estoque insuficiente para este produto.'; end if;

  update public.ready_stock
  set quantity_internal = quantity_internal - p_quantity,
      quantity = greatest(quantity - p_quantity, 0),
      quantity_sold = quantity_sold + p_quantity,
      status = case
        when quantity_internal - p_quantity <= 0 and quantity_consigned <= 0 then 'esgotado'
        when quantity_consigned > 0 then 'em_consignacao'
        else 'disponivel'
      end
  where id = p_stock_id;
  insert into public.ready_stock_movements (user_id, ready_stock_id, movement_type, quantity, description)
  values (auth.uid(), p_stock_id, 'saida_venda', p_quantity, 'Baixa manual de venda no estoque');
end;
$$;

revoke all on function public.refresh_consignment_totals(uuid) from public, anon;
revoke all on function public.create_consignment(jsonb, jsonb) from public, anon;
revoke all on function public.add_consignment_item(uuid, jsonb) from public, anon;
revoke all on function public.update_consignment_details(uuid, jsonb) from public, anon;
revoke all on function public.register_consignment_sale(uuid, numeric) from public, anon;
revoke all on function public.register_consignment_return(uuid, numeric) from public, anon;
revoke all on function public.register_consignment_payment(uuid, numeric, text, date, text) from public, anon;
revoke all on function public.cancel_consignment(uuid) from public, anon;
revoke all on function public.record_ready_stock_sale(uuid, numeric) from public, anon;

grant execute on function public.create_consignment(jsonb, jsonb) to authenticated;
grant execute on function public.add_consignment_item(uuid, jsonb) to authenticated;
grant execute on function public.update_consignment_details(uuid, jsonb) to authenticated;
grant execute on function public.register_consignment_sale(uuid, numeric) to authenticated;
grant execute on function public.register_consignment_return(uuid, numeric) to authenticated;
grant execute on function public.register_consignment_payment(uuid, numeric, text, date, text) to authenticated;
grant execute on function public.cancel_consignment(uuid) to authenticated;
grant execute on function public.record_ready_stock_sale(uuid, numeric) to authenticated;

commit;
