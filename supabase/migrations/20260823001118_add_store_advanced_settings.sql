create table if not exists public.store_advanced_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.store_advanced_settings enable row level security;
drop policy if exists store_advanced_settings_member_read on public.store_advanced_settings;
drop policy if exists store_advanced_settings_owner_manager_insert on public.store_advanced_settings;
drop policy if exists store_advanced_settings_owner_manager_update on public.store_advanced_settings;
create policy store_advanced_settings_member_read on public.store_advanced_settings for select using (private.is_store_member(store_id, auth.uid()));
create policy store_advanced_settings_owner_manager_insert on public.store_advanced_settings for insert with check (private.has_store_role(store_id, auth.uid(), ARRAY['owner'::store_role,'manager'::store_role]));
create policy store_advanced_settings_owner_manager_update on public.store_advanced_settings for update using (private.has_store_role(store_id, auth.uid(), ARRAY['owner'::store_role,'manager'::store_role])) with check (private.has_store_role(store_id, auth.uid(), ARRAY['owner'::store_role,'manager'::store_role]));
