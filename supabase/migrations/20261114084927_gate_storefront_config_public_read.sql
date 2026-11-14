drop policy if exists storefront_configs_public_read on public.storefront_configs;
create policy storefront_configs_public_read
  on public.storefront_configs
  for select
  to anon
  using (
    is_published
    and not coalesce((seo ->> 'noIndex')::boolean, false)
    and exists (
      select 1
      from public.online_stores os
      where os.store_id = storefront_configs.store_id
        and os.is_published
        and os.setup_completed
    )
  );