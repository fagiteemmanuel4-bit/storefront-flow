drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select to authenticated
  using ((id = (select auth.uid())) or (select public.is_platform_admin()));

drop policy if exists store_compliance_owner_select on public.store_compliance_profiles;
create policy store_compliance_owner_select
  on public.store_compliance_profiles
  for select to authenticated
  using (
    (owner_id = (select auth.uid()) and (select private.is_store_owner(store_id, (select auth.uid()))))
    or (select public.is_platform_admin())
  );