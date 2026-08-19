create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_store_created_idx on public.notifications(store_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications for select to authenticated using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, update on public.notifications to authenticated;

create or replace function public.notify_online_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications(user_id, store_id, type, title, body, data)
    select distinct u.user_id, new.store_id, 'order_new', 'New online order',
      new.order_number || ' from ' || new.customer_name || ' · ' || to_char(new.total, 'FM9999999990.00'),
      jsonb_build_object('order_id', new.id, 'order_number', new.order_number, 'status', new.status)
    from (
      select sm.user_id from public.store_members sm where sm.store_id = new.store_id
      union
      select s.owner_id from public.stores s where s.id = new.store_id
    ) u
    where u.user_id is not null;
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.notifications(user_id, store_id, type, title, body, data)
    select distinct u.user_id, new.store_id, 'order_status', 'Order ' || new.order_number || ' updated',
      'Status changed to ' || replace(new.status, '_', ' '),
      jsonb_build_object('order_id', new.id, 'order_number', new.order_number, 'status', new.status)
    from (
      select sm.user_id from public.store_members sm where sm.store_id = new.store_id
      union
      select s.owner_id from public.stores s where s.id = new.store_id
    ) u
    where u.user_id is not null;
  end if;
  return new;
end;
$$;

drop trigger if exists online_order_notifications on public.online_orders;
create trigger online_order_notifications
after insert or update of status on public.online_orders
for each row execute function public.notify_online_order();
