-- Cache auth identity once per statement in RLS expressions. This is a
-- semantics-preserving optimization: auth claims are constant for a request.
do $migration$
declare
  policy_row record;
  using_expression text;
  check_expression text;
  statement_sql text;
begin
  for policy_row in
    select *
    from pg_policies
    where schemaname = 'public'
      and (
        (qual is not null and qual ~* 'auth\.(uid|jwt)\(\)'
          and qual !~* '\(\s*select\s+auth\.(uid|jwt)\(\)')
        or
        (with_check is not null and with_check ~* 'auth\.(uid|jwt)\(\)'
          and with_check !~* '\(\s*select\s+auth\.(uid|jwt)\(\)')
      )
  loop
    using_expression := policy_row.qual;
    check_expression := policy_row.with_check;

    if using_expression is not null then
      using_expression := regexp_replace(
        using_expression,
        '(^|[^[:alnum:]_])(auth\.(uid|jwt)\(\))',
        '\1(SELECT \2)',
        'gi'
      );
    end if;

    if check_expression is not null then
      check_expression := regexp_replace(
        check_expression,
        '(^|[^[:alnum:]_])(auth\.(uid|jwt)\(\))',
        '\1(SELECT \2)',
        'gi'
      );
    end if;

    statement_sql := format(
      'ALTER POLICY %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );

    if using_expression is not null then
      statement_sql := statement_sql || format(' USING (%s)', using_expression);
    end if;
    if check_expression is not null then
      statement_sql := statement_sql || format(' WITH CHECK (%s)', check_expression);
    end if;

    execute statement_sql;
  end loop;
end
$migration$;

-- A manager-write ALL policy overlaps a member SELECT policy. Managers are
-- members (and store owners are explicitly backfilled as members), so the
-- SELECT policy already covers the ALL policy's read access. Split the ALL
-- policy into its three write commands to preserve writes while removing the
-- redundant permissive SELECT path.
do $migration$
declare
  policy_row record;
  role_list text;
  policy_mode text;
  using_expression text;
  check_expression text;
  insert_name text;
  update_name text;
  delete_name text;
begin
  for policy_row in
    select all_policy.*
    from pg_policies all_policy
    where all_policy.schemaname = 'public'
      and all_policy.cmd = 'ALL'
      and exists (
        select 1
        from pg_policies select_policy
        where select_policy.schemaname = all_policy.schemaname
          and select_policy.tablename = all_policy.tablename
          and select_policy.cmd = 'SELECT'
          and select_policy.roles = all_policy.roles
          and select_policy.policyname <> all_policy.policyname
      )
  loop
    select string_agg(quote_ident(role_name::text), ', ')
      into role_list
    from unnest(policy_row.roles) as roles(role_name);

    policy_mode := case
      when policy_row.permissive = 'RESTRICTIVE' then 'RESTRICTIVE'
      else 'PERMISSIVE'
    end;
    using_expression := policy_row.qual;
    check_expression := coalesce(policy_row.with_check, policy_row.qual);
    insert_name := left(policy_row.policyname, 55) || '_insert';
    update_name := left(policy_row.policyname, 55) || '_update';
    delete_name := left(policy_row.policyname, 55) || '_delete';

    if exists (
      select 1 from pg_policies existing
      where existing.schemaname = policy_row.schemaname
        and existing.tablename = policy_row.tablename
        and existing.policyname in (insert_name, update_name, delete_name)
    ) then
      raise exception 'Policy-name collision while splitting % on %',
        policy_row.policyname, policy_row.tablename;
    end if;

    execute format(
      'CREATE POLICY %I ON %I.%I AS %s FOR INSERT TO %s WITH CHECK (%s)',
      insert_name, policy_row.schemaname, policy_row.tablename,
      policy_mode, role_list, check_expression
    );
    execute format(
      'CREATE POLICY %I ON %I.%I AS %s FOR UPDATE TO %s USING (%s) WITH CHECK (%s)',
      update_name, policy_row.schemaname, policy_row.tablename,
      policy_mode, role_list, using_expression, check_expression
    );
    execute format(
      'CREATE POLICY %I ON %I.%I AS %s FOR DELETE TO %s USING (%s)',
      delete_name, policy_row.schemaname, policy_row.tablename,
      policy_mode, role_list, using_expression
    );
    execute format(
      'DROP POLICY %I ON %I.%I',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename
    );
  end loop;
end
$migration$;
