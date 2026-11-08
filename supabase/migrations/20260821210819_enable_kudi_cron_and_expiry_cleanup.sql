create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create or replace function public.delete_storeless_accounts() returns integer language plpgsql security definer set search_path = pg_catalog, public, auth as $$
declare
  deleted_count integer := 0;
begin
  delete from auth.users u
  where u.created_at < now() - interval '4 days'
    and not exists (select 1 from public.stores s where s.owner_id = u.id)
    and not exists (select 1 from public.store_members sm where sm.user_id = u.id);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_storeless_accounts() from public;

select cron.schedule('kudi-delete-storeless-accounts-hourly', '17 * * * *', $$select public.delete_storeless_accounts();$$);
