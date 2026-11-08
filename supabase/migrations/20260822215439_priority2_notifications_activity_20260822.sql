create table if not exists public.store_notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  type text not null check (type in ('low_stock','order','staff','system','inventory','customer','success','warning')),
  title text not null,
  message text not null,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists store_notifications_store_created_idx on public.store_notifications(store_id, created_at desc);
create index if not exists store_notifications_unread_idx on public.store_notifications(store_id, read_at) where read_at is null;
alter table public.store_notifications enable row level security;
create policy store_notifications_member_select on public.store_notifications for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy store_notifications_member_update on public.store_notifications for update to authenticated using (public.is_store_member(store_id, auth.uid())) with check (public.is_store_member(store_id, auth.uid()));

create table if not exists public.store_activity_log (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_staff_id uuid references public.staff_accounts(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists store_activity_store_created_idx on public.store_activity_log(store_id, created_at desc);
alter table public.store_activity_log enable row level security;
create policy store_activity_member_select on public.store_activity_log for select to authenticated using (public.is_store_member(store_id, auth.uid()));

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  resource text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(store_id, user_id, name)
);
create index if not exists saved_searches_user_idx on public.saved_searches(store_id, user_id);
alter table public.saved_searches enable row level security;
create policy saved_searches_owner_all on public.saved_searches for all to authenticated using (user_id = auth.uid() and public.is_store_member(store_id, auth.uid())) with check (user_id = auth.uid() and public.is_store_member(store_id, auth.uid()));
