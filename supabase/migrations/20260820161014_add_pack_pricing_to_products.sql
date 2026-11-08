alter table public.products add column if not exists units_per_pack integer not null default 1, add column if not exists pack_price numeric not null default 0, add column if not exists piece_price numeric not null default 0;
update public.products set piece_price = price where piece_price = 0;
update public.products set pack_price = price * greatest(units_per_pack, 1) where pack_price = 0;
alter table public.products add constraint products_units_per_pack_positive check (units_per_pack > 0);
alter table public.products add constraint products_piece_price_nonnegative check (piece_price >= 0);
alter table public.products add constraint products_pack_price_nonnegative check (pack_price >= 0);
