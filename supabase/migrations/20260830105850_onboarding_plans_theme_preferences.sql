alter table public.profiles add column if not exists theme_preference text not null default 'system' check (theme_preference in ('system','light','dark'));

create index if not exists store_subscriptions_store_status_idx on public.store_subscriptions(store_id,status);

insert into public.premium_entitlements (key, plan_code, description)
values
  ('online_store', 'business', 'Publish and operate an online storefront'),
  ('advanced_reports', 'pro', 'Advanced business reporting'),
  ('advanced_inventory', 'pro', 'Advanced inventory workflows'),
  ('staff_management', 'business', 'Manage staff accounts and permissions'),
  ('branches', 'business', 'Operate multiple branches'),
  ('store_data_export', 'business', 'Download store data')
on conflict (key) do nothing;
