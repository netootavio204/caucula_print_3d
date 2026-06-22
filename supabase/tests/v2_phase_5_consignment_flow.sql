begin;

do $$
declare
  v_user_id uuid;
  v_client_id uuid := gen_random_uuid();
  v_stock_id uuid;
  v_legacy_stock_id uuid;
  v_lot_id uuid;
  v_item_id uuid;
  v_stock public.ready_stock;
  v_item public.consignment_items;
  v_lot public.consignments;
begin
  select id into v_user_id from auth.users order by created_at limit 1;
  if v_user_id is null then raise exception 'No auth user available for transaction test'; end if;
  perform set_config('request.jwt.claim.sub', v_user_id::text, true);

  insert into public.clients (id, user_id, name, client_type)
  values (v_client_id, v_user_id, 'Consignatario Teste V25', 'consignatario');

  v_stock_id := public.save_ready_stock(
    jsonb_build_object('name', 'Produto Teste V25', 'quantity', 10, 'unit_cost', 5, 'sale_price', 15, 'image_url', '', 'notes', ''),
    null,
    false
  );
  select * into v_stock from public.ready_stock where id = v_stock_id;
  if v_stock.quantity <> 10 or v_stock.quantity_internal <> 10 then raise exception 'V1 stock create is not synchronized'; end if;

  v_lot_id := public.create_consignment(
    jsonb_build_object('consignee_client_id', v_client_id, 'consignment_code', 'CONS-TEST-V25', 'sent_date', current_date),
    jsonb_build_array(jsonb_build_object('ready_stock_id', v_stock_id, 'quantity_sent', 6, 'consignment_unit_price', 12))
  );
  select * into v_item from public.consignment_items where consignment_id = v_lot_id;
  select * into v_stock from public.ready_stock where id = v_stock_id;
  if v_stock.quantity_internal <> 4 or v_stock.quantity_consigned <> 6 or v_item.quantity_remaining <> 6 then raise exception 'Consignment send failed'; end if;

  perform public.register_consignment_sale(v_item.id, 2);
  perform public.register_consignment_payment(v_item.id, 10, 'pix', current_date, 'Parcial');
  perform public.register_consignment_return(v_item.id, 1);
  select * into v_item from public.consignment_items where id = v_item.id;
  select * into v_lot from public.consignments where id = v_lot_id;
  select * into v_stock from public.ready_stock where id = v_stock_id;
  if v_stock.quantity_internal <> 5 or v_stock.quantity_consigned <> 3 or v_stock.quantity_sold <> 2 then raise exception 'Consignment stock totals failed'; end if;
  if v_item.quantity_sold <> 2 or v_item.quantity_returned <> 1 or v_item.quantity_remaining <> 3 then raise exception 'Consignment item quantities failed'; end if;
  if v_lot.total_sold_value <> 24 or v_lot.total_paid_value <> 10 or v_lot.total_open_value <> 14 then raise exception 'Consignment financial totals failed'; end if;

  v_legacy_stock_id := public.save_ready_stock(
    jsonb_build_object('name', 'Produto Legado Teste', 'quantity', 4, 'unit_cost', 2, 'sale_price', 8, 'image_url', '', 'notes', ''),
    null,
    false
  );
  perform public.record_ready_stock_sale(v_legacy_stock_id, 1);
  select * into v_stock from public.ready_stock where id = v_legacy_stock_id;
  if v_stock.quantity <> 3 or v_stock.quantity_internal <> 3 or v_stock.quantity_sold <> 1 then raise exception 'V1 stock sale is not synchronized'; end if;
end;
$$;

rollback;
select 'v2_5_transaction_flow=ok' as result;
