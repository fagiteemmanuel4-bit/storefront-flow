CREATE OR REPLACE FUNCTION public.list_staff_branch_access(_staff_id uuid)
RETURNS TABLE(
  branch_id uuid,
  branch_name text,
  is_primary boolean,
  can_sell boolean,
  can_view_reports boolean,
  can_manage_inventory boolean,
  can_manage_customers boolean,
  can_manage_orders boolean,
  can_manage_expenses boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT
    a.branch_id,
    b.name AS branch_name,
    a.is_primary,
    a.can_sell,
    a.can_view_reports,
    a.can_manage_inventory,
    a.can_manage_customers,
    a.can_manage_orders,
    a.can_manage_expenses
  FROM public.staff_branch_access AS a
  JOIN public.branches AS b ON b.id = a.branch_id
  WHERE a.staff_id = _staff_id
    AND EXISTS (
      SELECT 1
      FROM public.staff_accounts AS s
      WHERE s.id = _staff_id
        AND private.has_store_role(
          s.store_id,
          auth.uid(),
          ARRAY['owner'::public.store_role, 'manager'::public.store_role]
        )
    );
$func$;
REVOKE ALL ON FUNCTION public.list_staff_branch_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_staff_branch_access(uuid) TO authenticated;
