-- Cover the reverse side of the saved-item foreign keys for efficient cleanup and joins.
create index if not exists connect_saved_products_product_idx
  on public.connect_saved_products (product_id);
create index if not exists connect_saved_vendors_vendor_idx
  on public.connect_saved_vendors (vendor_id);
