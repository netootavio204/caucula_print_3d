begin;

alter table public.clients
  add column if not exists client_type text default 'cliente';

alter table public.profiles
  add column if not exists company_logo_url text,
  add column if not exists company_logo_path text;

alter table public.ready_stock
  add column if not exists internal_code text,
  add column if not exists public_code text,
  add column if not exists category text,
  add column if not exists public_name text,
  add column if not exists public_description text,
  add column if not exists catalog_image_1_url text,
  add column if not exists catalog_image_1_path text,
  add column if not exists catalog_image_2_url text,
  add column if not exists catalog_image_2_path text,
  add column if not exists is_catalog_visible boolean default false,
  add column if not exists direct_sale_price numeric default 0,
  add column if not exists consignment_price numeric default 0,
  add column if not exists quantity_internal numeric default 0,
  add column if not exists quantity_consigned numeric default 0,
  add column if not exists quantity_sold numeric default 0,
  add column if not exists status text default 'disponivel';

update public.ready_stock
set quantity_internal = quantity
where quantity_internal = 0
  and quantity is not null;

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  budget_id uuid references public.budgets(id) on delete set null,
  sale_type text not null default 'venda_direta',
  sale_code text,
  total_value numeric not null default 0,
  paid_value numeric not null default 0,
  open_value numeric not null default 0,
  payment_status text not null default 'nao_pago',
  delivery_status text not null default 'pendente',
  payment_method text,
  sale_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  ready_stock_id uuid references public.ready_stock(id) on delete set null,
  product_code text,
  product_name text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.consignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consignee_client_id uuid references public.clients(id) on delete set null,
  consignment_code text,
  sent_date date not null default current_date,
  expected_settlement_date date,
  status text not null default 'em_consignacao',
  total_consigned_value numeric not null default 0,
  total_sold_value numeric not null default 0,
  total_paid_value numeric not null default 0,
  total_open_value numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consignment_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consignment_id uuid not null references public.consignments(id) on delete cascade,
  ready_stock_id uuid references public.ready_stock(id) on delete set null,
  product_code text,
  product_name text not null,
  quantity_sent numeric not null default 0,
  quantity_sold numeric not null default 0,
  quantity_returned numeric not null default 0,
  quantity_remaining numeric not null default 0,
  consignment_unit_price numeric not null default 0,
  total_consigned_value numeric not null default 0,
  sold_value numeric not null default 0,
  paid_value numeric not null default 0,
  open_value numeric not null default 0,
  status text not null default 'em_consignacao',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consignment_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consignment_id uuid not null references public.consignments(id) on delete cascade,
  consignment_item_id uuid references public.consignment_items(id) on delete set null,
  amount numeric not null default 0,
  payment_method text,
  payment_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.ready_stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ready_stock_id uuid not null references public.ready_stock(id) on delete cascade,
  movement_type text not null,
  quantity numeric not null,
  description text,
  sale_id uuid references public.sales(id) on delete set null,
  consignment_id uuid references public.consignments(id) on delete set null,
  budget_id uuid references public.budgets(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ready_stock_movements_user_id_idx on public.ready_stock_movements(user_id);
create index if not exists sales_user_id_idx on public.sales(user_id);
create index if not exists sale_items_user_id_idx on public.sale_items(user_id);
create index if not exists consignments_user_id_idx on public.consignments(user_id);
create index if not exists consignment_items_user_id_idx on public.consignment_items(user_id);
create index if not exists consignment_payments_user_id_idx on public.consignment_payments(user_id);

drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at
before update on public.sales
for each row execute function public.set_updated_at();

drop trigger if exists consignments_set_updated_at on public.consignments;
create trigger consignments_set_updated_at
before update on public.consignments
for each row execute function public.set_updated_at();

drop trigger if exists consignment_items_set_updated_at on public.consignment_items;
create trigger consignment_items_set_updated_at
before update on public.consignment_items
for each row execute function public.set_updated_at();

create or replace view public.public_catalog_view as
select
  id,
  user_id,
  public_code,
  public_name,
  public_description,
  category,
  catalog_image_1_url,
  catalog_image_2_url,
  is_catalog_visible,
  created_at
from public.ready_stock
where is_catalog_visible = true
  and public_code is not null
  and public_name is not null
  and public_description is not null
  and catalog_image_1_url is not null;

alter table public.ready_stock_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.consignments enable row level security;
alter table public.consignment_items enable row level security;
alter table public.consignment_payments enable row level security;

drop policy if exists "Users can select own ready stock movements" on public.ready_stock_movements;
create policy "Users can select own ready stock movements" on public.ready_stock_movements
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own ready stock movements" on public.ready_stock_movements;
create policy "Users can insert own ready stock movements" on public.ready_stock_movements
for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own ready stock movements" on public.ready_stock_movements;
create policy "Users can update own ready stock movements" on public.ready_stock_movements
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own ready stock movements" on public.ready_stock_movements;
create policy "Users can delete own ready stock movements" on public.ready_stock_movements
for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can select own sales" on public.sales;
create policy "Users can select own sales" on public.sales
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own sales" on public.sales;
create policy "Users can insert own sales" on public.sales
for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own sales" on public.sales;
create policy "Users can update own sales" on public.sales
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own sales" on public.sales;
create policy "Users can delete own sales" on public.sales
for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can select own sale items" on public.sale_items;
create policy "Users can select own sale items" on public.sale_items
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own sale items" on public.sale_items;
create policy "Users can insert own sale items" on public.sale_items
for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own sale items" on public.sale_items;
create policy "Users can update own sale items" on public.sale_items
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own sale items" on public.sale_items;
create policy "Users can delete own sale items" on public.sale_items
for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can select own consignments" on public.consignments;
create policy "Users can select own consignments" on public.consignments
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own consignments" on public.consignments;
create policy "Users can insert own consignments" on public.consignments
for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own consignments" on public.consignments;
create policy "Users can update own consignments" on public.consignments
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own consignments" on public.consignments;
create policy "Users can delete own consignments" on public.consignments
for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can select own consignment items" on public.consignment_items;
create policy "Users can select own consignment items" on public.consignment_items
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own consignment items" on public.consignment_items;
create policy "Users can insert own consignment items" on public.consignment_items
for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own consignment items" on public.consignment_items;
create policy "Users can update own consignment items" on public.consignment_items
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own consignment items" on public.consignment_items;
create policy "Users can delete own consignment items" on public.consignment_items
for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can select own consignment payments" on public.consignment_payments;
create policy "Users can select own consignment payments" on public.consignment_payments
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can insert own consignment payments" on public.consignment_payments;
create policy "Users can insert own consignment payments" on public.consignment_payments
for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can update own consignment payments" on public.consignment_payments;
create policy "Users can update own consignment payments" on public.consignment_payments
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own consignment payments" on public.consignment_payments;
create policy "Users can delete own consignment payments" on public.consignment_payments
for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on table
  public.ready_stock_movements,
  public.sales,
  public.sale_items,
  public.consignments,
  public.consignment_items,
  public.consignment_payments
to authenticated;

revoke all on public.public_catalog_view from public;
grant select on public.public_catalog_view to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-products',
  'catalog-products',
  true,
  2097152,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  true,
  1048576,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

drop policy if exists "Public can read catalog product images" on storage.objects;
create policy "Public can read catalog product images" on storage.objects
for select to public using (bucket_id = 'catalog-products');

drop policy if exists "Public can read company assets" on storage.objects;
create policy "Public can read company assets" on storage.objects
for select to public using (bucket_id = 'company-assets');

drop policy if exists "Users can upload own catalog product images" on storage.objects;
create policy "Users can upload own catalog product images" on storage.objects
for insert to authenticated with check (
  bucket_id = 'catalog-products'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can upload own company assets" on storage.objects;
create policy "Users can upload own company assets" on storage.objects
for insert to authenticated with check (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own catalog product images" on storage.objects;
create policy "Users can update own catalog product images" on storage.objects
for update to authenticated
using (
  bucket_id = 'catalog-products'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'catalog-products'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own company assets" on storage.objects;
create policy "Users can update own company assets" on storage.objects
for update to authenticated
using (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own catalog product images" on storage.objects;
create policy "Users can delete own catalog product images" on storage.objects
for delete to authenticated using (
  bucket_id = 'catalog-products'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own company assets" on storage.objects;
create policy "Users can delete own company assets" on storage.objects
for delete to authenticated using (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
