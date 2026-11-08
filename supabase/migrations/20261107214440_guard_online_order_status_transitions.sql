create or replace function public.guard_online_order_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if old.status in ('shipped', 'completed', 'refunded') and new.status = 'cancelled' then
    raise exception 'Fulfilled orders cannot be cancelled. Process a return or refund instead.';
  end if;

  if old.status in ('cancelled', 'completed', 'refunded') then
    raise exception 'This order is in a terminal state and cannot be changed.';
  end if;

  if not (
    (old.status = 'pending' and new.status in ('confirmed', 'cancelled')) or
    (old.status = 'confirmed' and new.status in ('processing', 'shipped', 'cancelled')) or
    (old.status = 'processing' and new.status in ('shipped', 'cancelled')) or
    (old.status = 'ready' and new.status in ('completed', 'cancelled')) or
    (old.status = 'shipped' and new.status = 'completed')
  ) then
    raise exception 'Invalid online order status transition: % -> %', old.status, new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_online_order_status_transition on public.online_orders;
create trigger trg_guard_online_order_status_transition
before update of status on public.online_orders
for each row
execute function public.guard_online_order_status_transition();
