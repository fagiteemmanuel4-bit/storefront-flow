-- Cover the four foreign keys still flagged by the database advisor after the
-- general FK-index pass. These are intentionally separate single-column indexes.
CREATE INDEX IF NOT EXISTS online_order_batch_allocations_branch_id_idx
  ON public.online_order_batch_allocations (branch_id);

CREATE INDEX IF NOT EXISTS online_order_variant_allocations_branch_id_idx
  ON public.online_order_variant_allocations (branch_id);

CREATE INDEX IF NOT EXISTS online_order_variant_allocations_fashion_variant_stock_id_idx
  ON public.online_order_variant_allocations (fashion_variant_stock_id);

CREATE INDEX IF NOT EXISTS online_order_variant_allocations_product_id_idx
  ON public.online_order_variant_allocations (product_id);

CREATE INDEX IF NOT EXISTS online_order_variant_allocations_store_id_idx
  ON public.online_order_variant_allocations (store_id);
