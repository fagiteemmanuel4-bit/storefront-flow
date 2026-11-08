create table if not exists public.storefront_editor_layouts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  draft jsonb not null default '{"sections":[]}'::jsonb,
  published jsonb not null default '{"sections":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create unique index if not exists storefront_editor_layouts_store_id_key on public.storefront_editor_layouts(store_id);
alter table public.storefront_editor_layouts enable row level security;
drop policy if exists storefront_editor_layouts_select on public.storefront_editor_layouts;
drop policy if exists storefront_editor_layouts_insert on public.storefront_editor_layouts;
drop policy if exists storefront_editor_layouts_update on public.storefront_editor_layouts;
create policy storefront_editor_layouts_select on public.storefront_editor_layouts for select using (store_id in (select id from public.stores where owner_id = auth.uid()) or store_id in (select store_id from public.store_members where user_id = auth.uid()));
create policy storefront_editor_layouts_insert on public.storefront_editor_layouts for insert with check (store_id in (select id from public.stores where owner_id = auth.uid()));
create policy storefront_editor_layouts_update on public.storefront_editor_layouts for update using (store_id in (select id from public.stores where owner_id = auth.uid()) or store_id in (select store_id from public.store_members where user_id = auth.uid() and role in ('owner','manager'))) with check (store_id in (select id from public.stores where owner_id = auth.uid()) or store_id in (select store_id from public.store_members where user_id = auth.uid() and role in ('owner','manager')));
