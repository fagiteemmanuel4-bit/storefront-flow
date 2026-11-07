-- Prevent cancelled status from undoing stock for orders that have already been completed or refunded.
-- The UI's "Mark ready" action maps to the legacy "shipped" status, so ready-to-fulfill
-- orders remain cancellable and their reservations are released as before.
create or replace function public.release_online_order_stock()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_batch record;
begin
  if new.status = 'cancelled' and old.status in ('completed', 'refunded') then
    raise exception 'Completed or refunded orders cannot be cancelled. Process a return separately.';
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.branch_stock bs
    set quantity = bs.quantity + a.quantity,
        updated_at = now()
    from public.online_order_stock_allocations a
    where a.order_id = new.id
      and a.released_at is null
      and bs.branch_id = a.branch_id
      and bs.product_id = a.product_id;

    update public.online_order_stock_allocations
    set released_at = now()
    where order_id = new.id and released_at is null;

    for v_batch in
      select a.id, a.batch_id, a.quantity
      from public.online_order_batch_allocations a
      where a.order_id = new.id
        and a.released_at is null
        and a.batch_id is not null
      for update
    loop
      update public.inventory_batches
      set quantity = quantity + v_batch.quantity,
          status = case
            when expiry_date is not null and expiry_date < current_date then 'expired'
            else 'active'
          end,
          updated_at = now()
      where id = v_batch.batch_id;
    end loop;

    update public.online_order_batch_allocations
    set released_at = now()
    where order_id = new.id and released_at is null;
  end if;

  return new;
end;
$$;