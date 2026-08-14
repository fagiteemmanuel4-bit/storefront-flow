CREATE TABLE public.shelves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shelves TO authenticated;
GRANT ALL ON public.shelves TO service_role;

ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;

CREATE POLICY shelves_select ON public.shelves FOR SELECT TO authenticated
  USING (is_store_member(store_id, auth.uid()));
CREATE POLICY shelves_insert ON public.shelves FOR INSERT TO authenticated
  WITH CHECK (has_store_role(store_id, auth.uid(), ARRAY['owner'::store_role,'manager'::store_role]));
CREATE POLICY shelves_update ON public.shelves FOR UPDATE TO authenticated
  USING (has_store_role(store_id, auth.uid(), ARRAY['owner'::store_role,'manager'::store_role]))
  WITH CHECK (has_store_role(store_id, auth.uid(), ARRAY['owner'::store_role,'manager'::store_role]));
CREATE POLICY shelves_delete ON public.shelves FOR DELETE TO authenticated
  USING (has_store_role(store_id, auth.uid(), ARRAY['owner'::store_role,'manager'::store_role]));

CREATE TRIGGER shelves_set_updated_at BEFORE UPDATE ON public.shelves
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.products ADD COLUMN shelf_id uuid REFERENCES public.shelves(id) ON DELETE SET NULL;
CREATE INDEX products_shelf_id_idx ON public.products(shelf_id);