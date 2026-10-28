-- Performance hardening discovered by the Supabase advisor.
-- Keep this migration additive and safe for existing commerce data.

CREATE INDEX IF NOT EXISTS online_order_status_history_changed_by_idx
  ON public.online_order_status_history (changed_by);

ALTER FUNCTION public.kudi_slugify(TEXT)
  SET search_path = public, pg_temp;
