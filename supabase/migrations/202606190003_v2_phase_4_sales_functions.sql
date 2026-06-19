begin;

create or replace function public.create_sale(p_sale jsonb, p_item jsonb)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_id uuid:=gen_random_uuid(); v_type text:=coalesce(p_sale->>'sale_type','venda_direta'); v_qty numeric:=coalesce((p_item->>'quantity')::numeric,0); v_unit numeric:=coalesce((p_item->>'unit_price')::numeric,0); v_total numeric; v_paid numeric:=coalesce((p_sale->>'paid_value')::numeric,0); v_stock public.ready_stock; v_name text; v_code text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if v_type not in ('venda_direta','venda_orcamento') then raise exception 'Invalid sale type'; end if;
  if v_qty<=0 or v_unit<0 or v_paid<0 then raise exception 'Invalid sale values'; end if;
  v_total:=v_qty*v_unit; v_paid:=least(v_paid,v_total);
  if v_type='venda_direta' then
    select * into v_stock from public.ready_stock where id=(p_item->>'ready_stock_id')::uuid and user_id=auth.uid() for update;
    if not found then raise exception 'Product not found'; end if;
    if v_stock.quantity_internal<v_qty then raise exception 'Estoque insuficiente para este produto.'; end if;
    update public.ready_stock set quantity_internal=quantity_internal-v_qty, quantity=greatest(quantity-v_qty,0), quantity_sold=quantity_sold+v_qty where id=v_stock.id;
    v_name:=v_stock.name; v_code:=coalesce(v_stock.public_code,v_stock.internal_code);
  else
    if nullif(p_sale->>'budget_id','') is null or not exists(select 1 from public.budgets where id=(p_sale->>'budget_id')::uuid and user_id=auth.uid()) then raise exception 'Invalid budget'; end if;
    v_name:=coalesce(nullif(p_item->>'product_name',''),'Venda por orçamento'); v_code:=nullif(p_item->>'product_code','');
  end if;
  insert into public.sales(id,user_id,client_id,budget_id,sale_type,sale_code,total_value,paid_value,open_value,payment_status,delivery_status,payment_method,sale_date,notes)
  values(v_id,auth.uid(),nullif(p_sale->>'client_id','')::uuid,nullif(p_sale->>'budget_id','')::uuid,v_type,coalesce(nullif(trim(p_sale->>'sale_code'),''),'VEN-'||upper(substr(replace(v_id::text,'-',''),1,8))),v_total,v_paid,greatest(v_total-v_paid,0),case when v_paid<=0 then 'nao_pago' when v_paid<v_total then 'parcialmente_pago' else 'pago' end,coalesce(nullif(p_sale->>'delivery_status',''),'pendente'),nullif(p_sale->>'payment_method',''),coalesce(nullif(p_sale->>'sale_date','')::date,current_date),nullif(trim(p_sale->>'notes'),''));
  insert into public.sale_items(user_id,sale_id,ready_stock_id,product_code,product_name,quantity,unit_price,total_price)
  values(auth.uid(),v_id,case when v_type='venda_direta' then v_stock.id else null end,v_code,v_name,v_qty,v_unit,v_total);
  if v_type='venda_direta' then insert into public.ready_stock_movements(user_id,ready_stock_id,movement_type,quantity,description,sale_id) values(auth.uid(),v_stock.id,'saida_venda',v_qty,'Saída por venda direta',v_id); end if;
  return v_id;
end $$;

create or replace function public.update_sale_details(p_sale_id uuid,p_sale jsonb)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  update public.sales set client_id=nullif(p_sale->>'client_id','')::uuid, delivery_status=coalesce(nullif(p_sale->>'delivery_status',''),delivery_status), payment_method=nullif(p_sale->>'payment_method',''), sale_date=coalesce(nullif(p_sale->>'sale_date','')::date,sale_date), notes=nullif(trim(p_sale->>'notes'),'') where id=p_sale_id and user_id=auth.uid() and payment_status<>'cancelado';
  if not found then raise exception 'Sale not found or canceled'; end if;
end $$;

create or replace function public.register_sale_payment(p_sale_id uuid,p_amount numeric)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_sale public.sales; v_paid numeric;
begin
  if p_amount<=0 then raise exception 'Invalid payment amount'; end if;
  select * into v_sale from public.sales where id=p_sale_id and user_id=auth.uid() for update;
  if not found or v_sale.payment_status='cancelado' then raise exception 'Sale not found or canceled'; end if;
  v_paid:=least(v_sale.total_value,v_sale.paid_value+p_amount);
  update public.sales set paid_value=v_paid,open_value=greatest(total_value-v_paid,0),payment_status=case when v_paid<=0 then 'nao_pago' when v_paid<total_value then 'parcialmente_pago' else 'pago' end where id=p_sale_id;
end $$;

create or replace function public.cancel_sale(p_sale_id uuid)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_sale public.sales; v_item public.sale_items;
begin
  select * into v_sale from public.sales where id=p_sale_id and user_id=auth.uid() for update;
  if not found then raise exception 'Sale not found'; end if;
  if v_sale.payment_status='cancelado' then raise exception 'Sale already canceled'; end if;
  if v_sale.sale_type='venda_direta' then
    select * into v_item from public.sale_items where sale_id=p_sale_id and user_id=auth.uid() limit 1;
    update public.ready_stock set quantity_internal=quantity_internal+v_item.quantity,quantity=quantity+v_item.quantity,quantity_sold=greatest(quantity_sold-v_item.quantity,0) where id=v_item.ready_stock_id and user_id=auth.uid();
    insert into public.ready_stock_movements(user_id,ready_stock_id,movement_type,quantity,description,sale_id) values(auth.uid(),v_item.ready_stock_id,'cancelamento_venda',v_item.quantity,'Estoque devolvido por cancelamento',p_sale_id);
  end if;
  update public.sales set payment_status='cancelado',delivery_status='cancelado',open_value=0 where id=p_sale_id;
end $$;

revoke all on function public.create_sale(jsonb,jsonb),public.update_sale_details(uuid,jsonb),public.register_sale_payment(uuid,numeric),public.cancel_sale(uuid) from public,anon;
grant execute on function public.create_sale(jsonb,jsonb),public.update_sale_details(uuid,jsonb),public.register_sale_payment(uuid,numeric),public.cancel_sale(uuid) to authenticated;
commit;
