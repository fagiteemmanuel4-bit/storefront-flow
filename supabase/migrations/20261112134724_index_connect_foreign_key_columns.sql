CREATE INDEX IF NOT EXISTS connect_distribution_code_products_product_idx
  ON public.connect_distribution_code_products (product_id);
CREATE INDEX IF NOT EXISTS connect_distribution_codes_group_idx
  ON public.connect_distribution_codes (group_id);
CREATE INDEX IF NOT EXISTS connect_distribution_group_products_product_idx
  ON public.connect_distribution_group_products (product_id);
CREATE INDEX IF NOT EXISTS connect_distribution_redemptions_retailer_idx
  ON public.connect_distribution_redemptions (retailer_user_id);
CREATE INDEX IF NOT EXISTS connect_notifications_product_idx
  ON public.connect_notifications (product_id);
CREATE INDEX IF NOT EXISTS connect_notifications_vendor_idx
  ON public.connect_notifications (vendor_id);
CREATE INDEX IF NOT EXISTS connect_product_connections_connection_idx
  ON public.connect_product_connections (connection_id);
CREATE INDEX IF NOT EXISTS connect_product_connections_vendor_idx
  ON public.connect_product_connections (vendor_id);
CREATE INDEX IF NOT EXISTS connect_supplier_connections_distribution_code_idx
  ON public.connect_supplier_connections (distribution_code_id);
CREATE INDEX IF NOT EXISTS connect_sync_events_product_idx
  ON public.connect_sync_events (product_id);
