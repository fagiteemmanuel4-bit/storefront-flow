-- Retain retailer-imported product snapshots after the supplier removes the original catalogue item.
alter table public.connect_product_connections
 drop constraint if exists connect_product_connections_supplier_product_id_fkey;
alter table public.connect_product_connections
 alter column supplier_product_id drop not null;
alter table public.connect_product_connections
 add constraint connect_product_connections_supplier_product_id_fkey
 foreign key (supplier_product_id) references public.connect_products(id) on delete set null;
