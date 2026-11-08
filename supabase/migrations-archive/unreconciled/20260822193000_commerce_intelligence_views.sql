-- Kudi operational intelligence: reusable, RLS-respecting views for inventory and customer segmentation.
create or replace view public.inventory_intelligence
with (security_invoker = true)
as
select p.id as product_id, p.store_id, p.name, p.sku, p.barcode, p.category, p.cost, p.price, p.low_stock_threshold,
coalesce(sum(bs.quantity), 0)::bigint as total_quantity,
coalesce(sum(bs.quantity * p.cost), 0)::numeric(14,2) as inventory_cost_value,
coalesce(sum(bs.quantity * p.price), 0)::numeric(14,2) as inventory_retail_value,
case when coalesce(sum(bs.quantity), 0) = 0 then 'out_of_stock' when coalesce(sum(bs.quantity), 0) <= coalesce(p.low_stock_threshold, 0) then 'low_stock' else 'healthy' end as stock_status
from public.products p left join public.branch_stock bs on bs.product_id = p.id and bs.store_id = p.store_id
group by p.id, p.store_id, p.name, p.sku, p.barcode, p.category, p.cost, p.price, p.low_stock_threshold;
grant select on public.inventory_intelligence to authenticated;

create or replace view public.customer_segment_insights
with (security_invoker = true)
as
select c.id as customer_id, c.store_id, c.name, c.phone, c.email, c.total_spent, c.visit_count, c.last_visit_at,
case when coalesce(c.total_spent,0) >= 500000 or coalesce(c.visit_count,0) >= 20 then 'vip' when coalesce(c.visit_count,0) >= 5 then 'frequent' when c.last_visit_at is null or c.last_visit_at < now() - interval '90 days' then 'inactive' when c.visit_count <= 1 then 'new' else 'regular' end as segment
from public.customers c;
grant select on public.customer_segment_insights to authenticated;

create index if not exists customers_store_last_visit_idx on public.customers(store_id, last_visit_at desc);
create index if not exists customers_store_spend_idx on public.customers(store_id, total_spent desc);
create index if not exists products_store_category_idx on public.products(store_id, category);
create index if not exists branch_stock_store_product_idx on public.branch_stock(store_id, product_id);
