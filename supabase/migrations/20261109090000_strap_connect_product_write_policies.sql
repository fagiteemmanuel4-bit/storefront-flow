-- Keep product reads on one policy; scope vendor writes by operation.
drop policy if exists "Vendors manage their own Connect products" on public.connect_products;

create policy "Vendors add their own Connect products"
on public.connect_products for insert to authenticated
with check (
  exists (
    select 1 from public.connect_vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  )
);

create policy "Vendors update their own Connect products"
on public.connect_products for update to authenticated
using (
  exists (
    select 1 from public.connect_vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.connect_vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  )
);

create policy "Vendors delete their own Connect products"
on public.connect_products for delete to authenticated
using (
  exists (
    select 1 from public.connect_vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  )
);
