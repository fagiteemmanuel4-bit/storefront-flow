-- Keep MCP audit writes server-mediated without exposing direct table INSERT.
-- The RPC derives the actor from auth.uid() and independently checks manager access.
create or replace function public.record_mcp_action(
  _store_id uuid,
  _action text,
  _resource_type text,
  _resource_id uuid,
  _summary text
)
returns void
language plpgsql
security definer
set search_path = public, private
as $function$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not private.has_store_role(
    _store_id,
    auth.uid(),
    array['owner'::public.store_role, 'manager'::public.store_role]
  ) then
    raise exception 'Not authorized to write MCP audit events';
  end if;

  insert into public.mcp_action_audit (
    store_id, user_id, action, resource_type, resource_id, summary
  )
  values (
    _store_id, auth.uid(), _action, _resource_type, _resource_id, coalesce(_summary, '')
  );
end;
$function$;

revoke all on function public.record_mcp_action(uuid, text, text, uuid, text) from public, anon;
grant execute on function public.record_mcp_action(uuid, text, text, uuid, text) to authenticated;
