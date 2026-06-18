begin;

create or replace function public.create_filament_with_entry(
  p_type_brand text,
  p_color text,
  p_weight_kg numeric,
  p_price_paid numeric,
  p_supplier_image_url text default null
)
returns public.filaments
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  created_filament public.filaments;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if nullif(trim(p_type_brand), '') is null or nullif(trim(p_color), '') is null then
    raise exception 'Brand and color are required';
  end if;
  if p_weight_kg <= 0 or p_price_paid < 0 then
    raise exception 'Invalid weight or price';
  end if;

  insert into public.filaments (
    user_id, type_brand, color, weight_kg, price_paid, price_per_gram,
    supplier_image_url, stock_real_g, stock_reserved_g
  ) values (
    auth.uid(), trim(p_type_brand), trim(p_color), p_weight_kg, p_price_paid,
    p_price_paid / (p_weight_kg * 1000), nullif(trim(p_supplier_image_url), ''),
    p_weight_kg * 1000, 0
  ) returning * into created_filament;

  insert into public.filament_movements (
    user_id, filament_id, movement_type, quantity_g, description
  ) values (
    auth.uid(), created_filament.id, 'entrada', created_filament.stock_real_g,
    'Entrada inicial do filamento'
  );

  return created_filament;
end;
$$;

create or replace function public.update_filament_with_adjustment(
  p_id uuid,
  p_type_brand text,
  p_color text,
  p_weight_kg numeric,
  p_price_paid numeric,
  p_supplier_image_url text default null
)
returns public.filaments
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_filament public.filaments;
  updated_filament public.filaments;
  new_stock numeric;
  stock_difference numeric;
begin
  if nullif(trim(p_type_brand), '') is null or nullif(trim(p_color), '') is null then
    raise exception 'Brand and color are required';
  end if;
  if p_weight_kg <= 0 or p_price_paid < 0 then
    raise exception 'Invalid weight or price';
  end if;

  select * into current_filament
  from public.filaments
  where id = p_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Filament not found';
  end if;

  new_stock := current_filament.stock_real_g + ((p_weight_kg - current_filament.weight_kg) * 1000);
  if new_stock < current_filament.stock_reserved_g then
    raise exception 'New stock cannot be lower than reserved stock';
  end if;
  stock_difference := new_stock - current_filament.stock_real_g;

  update public.filaments set
    type_brand = trim(p_type_brand),
    color = trim(p_color),
    weight_kg = p_weight_kg,
    price_paid = p_price_paid,
    price_per_gram = p_price_paid / (p_weight_kg * 1000),
    supplier_image_url = nullif(trim(p_supplier_image_url), ''),
    stock_real_g = new_stock
  where id = p_id
  returning * into updated_filament;

  if stock_difference <> 0 then
    insert into public.filament_movements (
      user_id, filament_id, movement_type, quantity_g, description
    ) values (
      auth.uid(), p_id, 'ajuste_manual', abs(stock_difference),
      case when stock_difference > 0 then 'Ajuste manual de entrada' else 'Ajuste manual de saída' end
    );
  end if;

  return updated_filament;
end;
$$;

grant execute on function public.create_filament_with_entry(text, text, numeric, numeric, text) to authenticated;
grant execute on function public.update_filament_with_adjustment(uuid, text, text, numeric, numeric, text) to authenticated;

commit;
