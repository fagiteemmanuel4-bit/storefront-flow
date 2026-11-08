-- Premium billing foundation: additive only, no existing data is deleted.
ALTER TABLE public.store_subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_payment_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_reminder_at timestamptz;

ALTER TABLE public.store_subscriptions
  ALTER COLUMN provider SET DEFAULT 'korapay';

CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.store_subscriptions(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'korapay',
  provider_reference text NOT NULL,
  plan_code text NOT NULL CHECK (plan_code IN ('business','pro')),
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed','refunded','cancelled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_reference)
);

CREATE INDEX IF NOT EXISTS billing_transactions_store_created_idx
  ON public.billing_transactions(store_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('welcome','payment_receipt','subscription_expiring','subscription_expired')),
  provider_message_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_events_user_welcome_once
  ON public.email_events(user_id, event_type)
  WHERE event_type = 'welcome';

CREATE TABLE IF NOT EXISTS public.premium_entitlements (
  key text PRIMARY KEY,
  plan_code text NOT NULL CHECK (plan_code IN ('business','pro')),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.premium_entitlements(key, plan_code, description) VALUES
('online_store','business','Publish and operate an online storefront'),
('storefront_categories','business','Organize storefront products into categories'),
('storefront_layouts','business','Choose list, compact, or large product layouts'),
('featured_products','business','Pin featured products to the storefront'),
('store_data_export','business','Download store data'),
('stock_tools','business','Advanced stock calculation and inventory tools'),
('advanced_reports','pro','Advanced business reporting'),
('advanced_inventory','pro','Advanced inventory workflows'),
('priority_features','pro','Access to Pro-only product capabilities')
ON CONFLICT (key) DO UPDATE SET plan_code=EXCLUDED.plan_code, description=EXCLUDED.description;

CREATE OR REPLACE FUNCTION public.store_has_premium(p_store_id uuid, p_required_plan text DEFAULT 'business')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_required_plan = 'business' THEN EXISTS (
      SELECT 1 FROM public.store_subscriptions s
      WHERE s.store_id = p_store_id
        AND s.status IN ('trialing','active')
        AND COALESCE(s.expires_at, s.current_period_end) > now()
        AND s.plan_code IN ('business','pro')
    )
    WHEN p_required_plan = 'pro' THEN EXISTS (
      SELECT 1 FROM public.store_subscriptions s
      WHERE s.store_id = p_store_id
        AND s.status IN ('trialing','active')
        AND COALESCE(s.expires_at, s.current_period_end) > now()
        AND s.plan_code = 'pro'
    )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_effective_plan(p_store_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.store_subscriptions s WHERE s.store_id=p_store_id AND s.plan_code='pro' AND s.status IN ('trialing','active') AND COALESCE(s.expires_at,s.current_period_end)>now()) THEN 'pro'
    WHEN EXISTS (SELECT 1 FROM public.store_subscriptions s WHERE s.store_id=p_store_id AND s.plan_code='business' AND s.status IN ('trialing','active') AND COALESCE(s.expires_at,s.current_period_end)>now()) THEN 'business'
    ELSE 'free'
  END;
$$;

CREATE OR REPLACE FUNCTION public.expire_premium_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE affected integer;
BEGIN
  UPDATE public.store_subscriptions
  SET status = CASE
      WHEN expires_at IS NOT NULL AND expires_at <= now() THEN 'expired'
      ELSE status
    END,
    updated_at = now()
  WHERE plan_code IN ('business','pro')
    AND status IN ('trialing','active')
    AND expires_at IS NOT NULL
    AND expires_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_transactions_store_members ON public.billing_transactions;
CREATE POLICY billing_transactions_store_members ON public.billing_transactions
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.store_members m WHERE m.store_id=billing_transactions.store_id AND m.user_id=auth.uid()));

DROP POLICY IF EXISTS email_events_owner ON public.email_events;
CREATE POLICY email_events_owner ON public.email_events
FOR SELECT TO authenticated
USING (user_id=auth.uid());

DROP POLICY IF EXISTS premium_entitlements_read ON public.premium_entitlements;
CREATE POLICY premium_entitlements_read ON public.premium_entitlements
FOR SELECT TO authenticated
USING (true);

REVOKE ALL ON FUNCTION public.store_has_premium(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_has_premium(uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.get_effective_plan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_effective_plan(uuid) TO authenticated;
