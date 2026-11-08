create table if not exists public.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  pin_hash text not null,
  role text not null default 'cashier' check (role in ('manager','cashier','inventory','sales','viewer')),
  is_active boolean not null default true,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists staff_accounts_store_name_unique on public.staff_accounts(store_id, lower(name));
create index if not exists staff_accounts_store_idx on public.staff_accounts(store_id);

create table if not exists public.staff_audit_log (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  staff_id uuid references public.staff_accounts(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists staff_audit_store_created_idx on public.staff_audit_log(store_id, created_at desc);

alter table public.staff_accounts enable row level security;
alter table public.staff_audit_log enable row level security;

drop policy if exists staff_accounts_select_manager on public.staff_accounts;
create policy staff_accounts_select_manager on public.staff_accounts for select using (private.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
drop policy if exists staff_accounts_insert_manager on public.staff_accounts;
create policy staff_accounts_insert_manager on public.staff_accounts for insert with check (private.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
drop policy if exists staff_accounts_update_manager on public.staff_accounts;
create policy staff_accounts_update_manager on public.staff_accounts for update using (private.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
drop policy if exists staff_accounts_delete_manager on public.staff_accounts;
create policy staff_accounts_delete_manager on public.staff_accounts for delete using (private.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));

create policy staff_audit_select_manager on public.staff_audit_log for select using (private.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));

create or replace function public.hash_staff_pin(_pin text)
returns text language sql security definer set search_path=public,extensions as $$
  select crypt(_pin, gen_salt('bf', 10));
$$;

create or replace function public.verify_staff_pin(_store_id uuid, _staff_id uuid, _pin text)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_staff public.staff_accounts; v_ok boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not private.is_store_member(_store_id, auth.uid()) then raise exception 'Not authorized'; end if;
  select * into v_staff from public.staff_accounts where id=_staff_id and store_id=_store_id and is_active=true;
  if not found then raise exception 'Staff account not found'; end if;
  if v_staff.locked_until is not null and v_staff.locked_until > now() then raise exception 'Staff account temporarily locked'; end if;
  v_ok := crypt(_pin, v_staff.pin_hash) = v_staff.pin_hash;
  if not v_ok then
    update public.staff_accounts set failed_attempts=failed_attempts+1, locked_until=case when failed_attempts+1 >= 5 then now()+interval '10 minutes' else locked_until end, updated_at=now() where id=v_staff.id;
    insert into public.staff_audit_log(store_id,staff_id,actor_user_id,action,metadata) values(_store_id,v_staff.id,auth.uid(),'pin_failed',jsonb_build_object('failed_attempts',v_staff.failed_attempts+1));
    return jsonb_build_object('ok',false,'message','Incorrect PIN');
  end if;
  update public.staff_accounts set failed_attempts=0,locked_until=null,last_login_at=now(),updated_at=now() where id=v_staff.id;
  insert into public.staff_audit_log(store_id,staff_id,actor_user_id,action) values(_store_id,v_staff.id,auth.uid(),'pin_login');
  return jsonb_build_object('ok',true,'staff_id',v_staff.id,'name',v_staff.name,'role',v_staff.role);
end;
$$;

grant execute on function public.hash_staff_pin(text) to authenticated;
grant execute on function public.verify_staff_pin(uuid,uuid,text) to authenticated;
