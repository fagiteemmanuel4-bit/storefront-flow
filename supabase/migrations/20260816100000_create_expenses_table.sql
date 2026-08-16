CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT NOT NULL DEFAULT '',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX expenses_store_date_idx ON public.expenses(store_id, expense_date DESC);
CREATE INDEX expenses_branch_idx ON public.expenses(branch_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select" ON public.expenses FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.is_store_member(store_id, auth.uid()));

CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE TO authenticated
  USING (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]))
  WITH CHECK (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));

CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE TO authenticated
  USING (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));

CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
