-- Tighten table grants; RLS remains the row-level authorization boundary.
revoke all on table
 public.connect_supplier_settings,public.connect_supplier_connections,
 public.connect_distribution_groups,public.connect_distribution_group_products,
 public.connect_distribution_codes,public.connect_distribution_code_products,
 public.connect_product_connections,public.connect_sync_events,
 public.connect_notifications,public.connect_distribution_redemptions
from anon,public;
grant select,insert,update,delete on public.connect_supplier_settings to authenticated;
grant select on public.connect_supplier_connections to authenticated;
grant select,insert,update,delete on public.connect_distribution_groups to authenticated;
grant select,insert,update,delete on public.connect_distribution_group_products to authenticated;
grant select,insert,update,delete on public.connect_distribution_codes to authenticated;
grant select,insert,update,delete on public.connect_distribution_code_products to authenticated;
grant select on public.connect_product_connections to authenticated;
grant update(custom_title,selling_price,sync_stock,sync_wholesale_price,sync_availability,sync_product_details) on public.connect_product_connections to authenticated;
grant select on public.connect_sync_events to authenticated;
grant select,update on public.connect_notifications to authenticated;
grant select on public.connect_distribution_redemptions to authenticated;
