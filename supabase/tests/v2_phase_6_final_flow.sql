begin;

do $$
declare
  v_user_id uuid;
  v_client_id uuid := gen_random_uuid();
  v_machine_id uuid := gen_random_uuid();
  v_filament_id uuid := gen_random_uuid();
  v_stock_id uuid;
  v_sale_id uuid;
  v_lot_id uuid;
  v_item_id uuid;
  v_budget_id uuid;
  v_stock public.ready_stock;
  v_sale public.sales;
  v_item public.consignment_items;
  v_lot public.consignments;
  v_public jsonb;
  v_count integer;
begin
  select id into v_user_id from auth.users order by created_at limit 1;
  if v_user_id is null then raise exception 'No auth user available for transaction test'; end if;
  perform set_config('request.jwt.claim.sub', v_user_id::text, true);

  insert into public.clients (id, user_id, name, client_type)
  values (v_client_id, v_user_id, 'Cliente Final V26', 'ambos');

  v_stock_id := public.save_ready_stock(
    jsonb_build_object('name', 'Produto Final V26', 'quantity', 10, 'unit_cost', 5, 'sale_price', 20, 'image_url', '', 'notes', ''),
    null,
    false
  );
  select * into v_stock from public.ready_stock where id = v_stock_id;
  if v_stock.quantity_internal <> 10 then raise exception 'Ready stock creation failed'; end if;
  if not exists (select 1 from public.ready_stock_movements where ready_stock_id = v_stock_id and movement_type = 'entrada_manual' and quantity = 10) then
    raise exception 'Ready stock entry movement missing';
  end if;

  perform public.save_ready_stock(
    jsonb_build_object('name', 'Produto Final V26', 'quantity', 12, 'unit_cost', 5, 'sale_price', 20, 'image_url', '', 'notes', ''),
    v_stock_id,
    false
  );
  if not exists (select 1 from public.ready_stock_movements where ready_stock_id = v_stock_id and movement_type = 'ajuste_manual' and quantity = 2) then
    raise exception 'Ready stock adjustment movement missing';
  end if;

  v_sale_id := public.create_sale(
    jsonb_build_object('client_id', v_client_id, 'sale_type', 'venda_direta', 'sale_code', 'VEN-TEST-V26', 'paid_value', 5, 'delivery_status', 'pendente', 'payment_method', 'pix', 'sale_date', current_date),
    jsonb_build_object('ready_stock_id', v_stock_id, 'quantity', 2, 'unit_price', 20)
  );
  select * into v_sale from public.sales where id = v_sale_id;
  select * into v_stock from public.ready_stock where id = v_stock_id;
  if v_stock.quantity_internal <> 10 or v_stock.quantity_sold <> 2 then raise exception 'Direct sale stock failed'; end if;
  if v_sale.total_value <> 40 or v_sale.paid_value <> 5 or v_sale.open_value <> 35 or v_sale.payment_status <> 'parcialmente_pago' then
    raise exception 'Direct sale totals failed';
  end if;
  perform public.register_sale_payment(v_sale_id, 35);
  perform public.cancel_sale(v_sale_id);
  select * into v_stock from public.ready_stock where id = v_stock_id;
  if v_stock.quantity_internal <> 12 or v_stock.quantity_sold <> 0 then raise exception 'Sale cancellation stock failed'; end if;
  if not exists (select 1 from public.ready_stock_movements where sale_id = v_sale_id and movement_type = 'cancelamento_venda') then
    raise exception 'Sale cancellation movement missing';
  end if;

  v_lot_id := public.create_consignment(
    jsonb_build_object('consignee_client_id', v_client_id, 'consignment_code', 'CONS-TEST-V26', 'sent_date', current_date),
    jsonb_build_array(jsonb_build_object('ready_stock_id', v_stock_id, 'quantity_sent', 6, 'consignment_unit_price', 12))
  );
  select id into v_item_id from public.consignment_items where consignment_id = v_lot_id;
  perform public.register_consignment_sale(v_item_id, 2);
  perform public.register_consignment_payment(v_item_id, 10, 'pix', current_date, 'Parcial');
  perform public.register_consignment_return(v_item_id, 1);
  select * into v_item from public.consignment_items where id = v_item_id;
  select * into v_lot from public.consignments where id = v_lot_id;
  select * into v_stock from public.ready_stock where id = v_stock_id;
  if v_stock.quantity_internal <> 7 or v_stock.quantity_consigned <> 3 or v_stock.quantity_sold <> 2 then raise exception 'Consignment stock failed'; end if;
  if v_item.quantity_remaining <> 3 or v_item.sold_value <> 24 or v_item.paid_value <> 10 or v_item.open_value <> 14 then raise exception 'Consignment item totals failed'; end if;
  if v_lot.total_sold_value <> 24 or v_lot.total_paid_value <> 10 or v_lot.total_open_value <> 14 then raise exception 'Consignment indicators failed'; end if;

  update public.ready_stock set
    public_code = 'PUBLIC-V26', public_name = 'Produto Publico', public_description = 'Descricao publica',
    category = 'Teste', catalog_image_1_url = 'https://example.com/public-v26.webp', is_catalog_visible = true
  where id = v_stock_id;
  select to_jsonb(public_catalog_view.*) into v_public from public.public_catalog_view where id = v_stock_id;
  if v_public is null then raise exception 'Public catalog row missing'; end if;
  if v_public ?| array['unit_cost','sale_price','direct_sale_price','consignment_price','quantity','quantity_internal','quantity_consigned','quantity_sold','notes'] then
    raise exception 'Public catalog exposes private fields';
  end if;
  select count(*) into v_count from information_schema.columns
  where table_schema = 'public' and table_name in ('public_catalog_view', 'public_company_view')
    and column_name in ('unit_cost','sale_price','direct_sale_price','consignment_price','quantity','quantity_internal','quantity_consigned','quantity_sold','email','notes');
  if v_count <> 0 then raise exception 'Public views expose forbidden columns'; end if;

  select count(*) into v_count from storage.buckets where id in ('catalog-products', 'company-assets') and public = true;
  if v_count <> 2 then raise exception 'Storage buckets missing'; end if;
  select count(*) into v_count from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and policyname in ('Public can read catalog product images','Public can read company assets','Users can upload own catalog product images','Users can upload own company assets','Users can update own catalog product images','Users can update own company assets','Users can delete own catalog product images','Users can delete own company assets');
  if v_count <> 8 then raise exception 'Storage policies missing'; end if;
  select count(*) into v_count from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('ready_stock_movements','sales','sale_items','consignments','consignment_items','consignment_payments') and c.relrowsecurity;
  if v_count <> 6 then raise exception 'RLS missing on V2 tables'; end if;

  insert into public.machines (id, user_id, model, consumption_watts, maintenance_per_hour, machine_value, estimated_life_hours)
  values (v_machine_id, v_user_id, 'Maquina V1 Teste', 100, 1, 1000, 5000);
  insert into public.filaments (id, user_id, type_brand, color, weight_kg, price_paid, price_per_gram, stock_real_g, stock_reserved_g)
  values (v_filament_id, v_user_id, 'PLA Teste', 'Azul', 1, 100, 0.1, 1000, 0);
  v_budget_id := public.save_budget(
    jsonb_build_object(
      'project_name','Orcamento V1 Preservado','total_time_hours',2,'total_pieces',1,'machine_id',v_machine_id,
      'print_days',0,'print_hours',2,'print_minutes',0,'print_seconds',0,'pieces_per_plate',1,'plate_quantity',1,
      'nozzle_diameter',0.4,'size_x',10,'size_y',10,'size_z',10,'filament_cost',1,'service_cost',2,
      'energy_cost',1,'maintenance_cost',0.5,'depreciation_cost',0.5,'supplies_cost',0,'extra_costs',0,
      'failure_margin_value',0.2,'total_production_cost',3.2,'gross_profit',1,'fees_value',0,
      'suggested_price',4.2,'price_per_piece',4.2,'net_profit',1,'net_profit_per_piece',1
    ),
    jsonb_build_array(jsonb_build_object('filament_id',v_filament_id,'weight_used_g',10)),
    '[]'::jsonb,
    '[]'::jsonb,
    null
  );
  if not exists (select 1 from public.budgets where id = v_budget_id and status = 'pendente') then raise exception 'V1 budget creation failed'; end if;
  if (select stock_reserved_g from public.filaments where id = v_filament_id) <> 10 then raise exception 'V1 budget reservation failed'; end if;
  perform public.reject_budget(v_budget_id);
  if (select stock_reserved_g from public.filaments where id = v_filament_id) <> 0 then raise exception 'V1 budget release failed'; end if;

  begin
    update public.ready_stock set quantity_internal = -1 where id = v_stock_id;
    raise exception 'Negative stock was accepted';
  exception when check_violation then null;
  end;
end;
$$;

rollback;
select 'v2_6_final_database_flow=ok' as result;
