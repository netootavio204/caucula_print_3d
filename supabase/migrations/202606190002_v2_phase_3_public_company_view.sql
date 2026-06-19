begin;

create or replace view public.public_company_view
with (security_barrier = true) as
select
  id as user_id,
  company_name,
  company_phone,
  company_logo_url
from public.profiles
where (company_name is not null or company_phone is not null or company_logo_url is not null)
  and exists (
    select 1
    from public.ready_stock
    where ready_stock.user_id = profiles.id
      and ready_stock.is_catalog_visible = true
      and ready_stock.public_code is not null
      and ready_stock.public_name is not null
      and ready_stock.public_description is not null
      and ready_stock.catalog_image_1_url is not null
  );

revoke all on public.public_company_view from public;
grant select on public.public_company_view to anon, authenticated;

commit;
