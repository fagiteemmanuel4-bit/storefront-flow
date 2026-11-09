alter table public.online_products
  drop constraint if exists online_products_discount_value_consistency_check,
  add constraint online_products_discount_value_consistency_check
  check (
    (discount_type is null and discount_value is null)
    or (discount_type in ('percentage','fixed') and discount_value > 0)
  );

revoke all on function public.apply_online_product_discount_to_order_item() from public, anon, authenticated;
revoke all on function public.refresh_online_order_totals_after_item() from public, anon, authenticated;
