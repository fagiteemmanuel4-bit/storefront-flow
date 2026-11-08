drop index if exists public.products_store_active_idx;
drop index if exists public.sales_store_id_created_at_idx;
drop policy if exists api_keys_owner_select on public.api_keys;

create index if not exists api_keys_created_by_idx on public.api_keys (created_by);
create index if not exists fulfillment_orders_order_id_idx on public.fulfillment_orders (order_id);
create index if not exists inventory_alerts_product_id_idx on public.inventory_alerts (product_id);
create index if not exists order_fulfillments_branch_id_idx on public.order_fulfillments (branch_id);
create index if not exists product_bundles_component_product_id_idx on public.product_bundles (component_product_id);
create index if not exists saved_searches_user_id_idx on public.saved_searches (user_id);
create index if not exists store_activity_log_actor_staff_id_idx on public.store_activity_log (actor_staff_id);
create index if not exists store_activity_log_actor_user_id_idx on public.store_activity_log (actor_user_id);
create index if not exists store_notifications_branch_id_idx on public.store_notifications (branch_id);
create index if not exists temporary_tracking_accounts_created_by_idx on public.temporary_tracking_accounts (created_by);
create index if not exists webhook_deliveries_endpoint_id_idx on public.webhook_deliveries (endpoint_id);
create index if not exists webhook_deliveries_store_id_idx on public.webhook_deliveries (store_id);
create index if not exists webhook_endpoints_created_by_idx on public.webhook_endpoints (created_by);
