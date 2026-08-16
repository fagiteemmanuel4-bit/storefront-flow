CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  debt_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (debt_balance >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX customers_store_name_idx ON public.customers(store_id, name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON public.customers FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated
  USING (public.is_store_member(store_id, auth.uid()))
  WITH CHECK (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "customers_delete" ON public.customers FOR DELETE TO authenticated
  USING (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
