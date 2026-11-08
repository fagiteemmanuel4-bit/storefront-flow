-- Public SECURITY DEFINER helpers must only answer questions about the caller.
-- These wrappers are used by RLS policies with auth.uid(); reject arbitrary user IDs
-- so authenticated users cannot enumerate other users' store memberships or roles.
create or replace function public.is_store_member(_store_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $function$
  select coalesce(_user_id = auth.uid(), false)
    and private.is_store_member(_store_id, auth.uid());
$function$;

create or replace function public.has_store_role(_store_id uuid, _user_id uuid, _roles public.store_role[])
returns boolean
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $function$
  select coalesce(_user_id = auth.uid(), false)
    and private.has_store_role(_store_id, auth.uid(), _roles);
$function$;

create or replace function public.is_store_owner(_store_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $function$
  select coalesce(_user_id = auth.uid(), false)
    and private.is_store_owner(_store_id, auth.uid());
$function$;

-- This is a trigger-only guard. It is not an RPC endpoint.
revoke execute on function public.guard_online_order_status_transition()
  from public, anon, authenticated;

-- The pre-auth staff login page only needs a display name, role and store name.
-- Do not expose internal IDs, branch IDs, login slugs or inactive staff profiles.
create or replace function public.staff_login_profile(_slug text)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (
      select jsonb_build_object(
        'name', s.name,
        'role', s.role,
        'store_name', st.name
      )
      from public.staff_accounts s
      join public.stores st on st.id = s.store_id
      where s.login_slug = lower(btrim(_slug))
        and s.is_active = true
      limit 1
    ),
    '{}'::jsonb
  );
$function$;

-- This helper only constructs a path and does not need elevated privileges.
create or replace function public.staff_login_url(_slug text)
returns text
language sql
immutable
security invoker
set search_path to 'public'
as $function$
  select '/staff-login/' || trim(both '/' from coalesce(_slug, ''));
$function$;
