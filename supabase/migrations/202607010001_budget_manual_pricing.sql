alter table public.budgets
add column if not exists markup_percent numeric check (markup_percent is null or markup_percent >= 0),
add column if not exists manual_final_price numeric check (manual_final_price is null or manual_final_price >= 0),
add column if not exists final_price numeric check (final_price is null or final_price >= 0);

update public.budgets
set final_price = coalesce(final_price, suggested_price)
where final_price is null;
