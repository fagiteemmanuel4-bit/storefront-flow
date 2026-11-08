insert into public.store_subscriptions (store_id, provider, plan_code, status, currency, amount, interval, metadata, created_at, updated_at)
select s.id, 'korapay', 'free', 'active', coalesce(s.currency, 'NGN'), 0, 'month', jsonb_build_object('backfilled', true), now(), now()
from public.stores s
where not exists (select 1 from public.store_subscriptions ss where ss.store_id = s.id);
