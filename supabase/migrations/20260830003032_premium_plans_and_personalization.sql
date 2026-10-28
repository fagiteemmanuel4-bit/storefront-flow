-- Strap premium plans and onboarding personalization.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS team_size TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS business_goal TEXT NOT NULL DEFAULT '';

ALTER TABLE public.store_subscriptions
  DROP CONSTRAINT IF EXISTS store_subscriptions_plan_code_check;
ALTER TABLE public.store_subscriptions
  ADD CONSTRAINT store_subscriptions_plan_code_check
  CHECK (plan_code IS NULL OR plan_code IN ('free','business','pro'));

CREATE OR REPLACE FUNCTION public.is_active_premium_store(_store_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_subscriptions ss
    WHERE ss.store_id = _store_id
      AND ss.plan_code IN ('business','pro')
      AND ss.status IN ('trialing','active')
      AND (ss.current_period_end IS NULL OR ss.current_period_end > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_published_online_store(_store_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.online_stores os
    WHERE os.store_id = _store_id
      AND os.is_published
      AND os.setup_completed
      AND public.is_active_premium_store(_store_id)
  );
$$;
