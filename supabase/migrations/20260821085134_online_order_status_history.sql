create table if not exists public.online_order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.online_orders(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists online_order_status_history_order_created_idx on public.online_order_status_history(order_id, created_at desc);
create index if not exists online_order_status_history_store_created_idx on public.online_order_status_history(store_id, created_at desc);
alter table public.online_order_status_history enable row level security;
create policy online_order_status_history_member_read on public.online_order_status_history for select to authenticated using ((select private.is_store_member(store_id, (select auth.uid()))));
create or replace function public.record_online_order_status_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status then
    insert into public.online_order_status_history(order_id, store_id, from_status, to_status, changed_by)
    values (new.id, new.store_id, old.status, new.status, (select auth.uid()));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_online_order_status_history on public.online_orders;
create trigger trg_online_order_status_history after update of status on public.online_orders for each row execute function public.record_online_order_status_change();
revoke all on function public.record_online_order_status_change() from public, anon, authenticated;
