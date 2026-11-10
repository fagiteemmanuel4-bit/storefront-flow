-- Close remaining client access to platform pricing configuration.
-- Subscription prices are authoritative server-side values, never client-editable.

ALTER TABLE public.platform_plan_prices ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.platform_plan_prices FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.platform_plan_prices TO service_role;

-- Avoid silently assigning new records to a legacy payment provider.
-- Existing historical provider values remain unchanged.
ALTER TABLE public.store_subscriptions
  ALTER COLUMN provider SET DEFAULT 'unconfigured';

COMMENT ON TABLE public.platform_plan_prices IS
  'Authoritative subscription price catalogue. Only trusted platform server operations may mutate or read the administrative price records.';
