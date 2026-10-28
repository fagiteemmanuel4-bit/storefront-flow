-- Bind each fashion metadata row to a product in the same store.
drop policy if exists "Store members can view fashion product details" on public.product_fashion_details;
create policy "Store members can view fashion product details"
  on public.product_fashion_details for select to authenticated
  using (
    public.is_store_member(store_id, (select auth.uid()))
    and exists (
      select 1 from public.products p
      where p.id = product_fashion_details.product_id
        and p.store_id = product_fashion_details.store_id
    )
  );

drop policy if exists "Store managers can create fashion product details" on public.product_fashion_details;
create policy "Store managers can create fashion product details"
  on public.product_fashion_details for insert to authenticated
  with check (
    public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])
    and exists (
      select 1 from public.products p
      where p.id = product_fashion_details.product_id
        and p.store_id = product_fashion_details.store_id
    )
  );

drop policy if exists "Store managers can update fashion product details" on public.product_fashion_details;
create policy "Store managers can update fashion product details"
  on public.product_fashion_details for update to authenticated
  using (
    public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])
    and exists (
      select 1 from public.products p
      where p.id = product_fashion_details.product_id
        and p.store_id = product_fashion_details.store_id
    )
  )
  with check (
    public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])
    and exists (
      select 1 from public.products p
      where p.id = product_fashion_details.product_id
        and p.store_id = product_fashion_details.store_id
    )
  );

drop policy if exists "Store managers can delete fashion product details" on public.product_fashion_details;
create policy "Store managers can delete fashion product details"
  on public.product_fashion_details for delete to authenticated
  using (
    public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])
    and exists (
      select 1 from public.products p
      where p.id = product_fashion_details.product_id
        and p.store_id = product_fashion_details.store_id
    )
  );
