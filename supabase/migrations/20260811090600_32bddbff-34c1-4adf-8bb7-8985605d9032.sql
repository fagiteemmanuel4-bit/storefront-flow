-- ============ enums ============
CREATE TYPE public.store_role AS ENUM ('owner', 'manager', 'cashier');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'transfer', 'credit');

-- ============ helper: updated_at ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ stores ============
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN' CHECK (currency IN ('NGN','USD','GHS','KES','ZAR')),
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ store_members ============
CREATE TABLE public.store_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.store_role NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_members TO authenticated;
GRANT ALL ON public.store_members TO service_role;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

-- ============ security definer helpers (avoid recursive RLS) ============
CREATE OR REPLACE FUNCTION public.is_store_member(_store_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.store_members WHERE store_id = _store_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.has_store_role(_store_id UUID, _user_id UUID, _roles public.store_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members
    WHERE store_id = _store_id AND user_id = _user_id AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = _user_id);
$$;

-- stores policies
CREATE POLICY "stores_select_members" ON public.stores FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_store_member(id, auth.uid()));
CREATE POLICY "stores_insert_self_owned" ON public.stores FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "stores_update_owner" ON public.stores FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "stores_delete_owner" ON public.stores FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- store_members policies: creation moment differs from steady state.
-- A brand-new store has no members yet, so the very first membership row is
-- authorised against stores.owner_id, not against an existing membership.
CREATE POLICY "store_members_select" ON public.store_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_store_owner(store_id, auth.uid()) OR public.is_store_member(store_id, auth.uid()));
CREATE POLICY "store_members_insert" ON public.store_members FOR INSERT TO authenticated
  WITH CHECK (public.is_store_owner(store_id, auth.uid()));
CREATE POLICY "store_members_update" ON public.store_members FOR UPDATE TO authenticated
  USING (public.is_store_owner(store_id, auth.uid())) WITH CHECK (public.is_store_owner(store_id, auth.uid()));
CREATE POLICY "store_members_delete" ON public.store_members FOR DELETE TO authenticated
  USING (public.is_store_owner(store_id, auth.uid()) AND NOT public.is_store_owner(store_id, user_id));

-- ============ branches ============
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX branches_store_idx ON public.branches(store_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "branches_select" ON public.branches FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "branches_write" ON public.branches FOR INSERT TO authenticated
  WITH CHECK (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));
CREATE POLICY "branches_update" ON public.branches FOR UPDATE TO authenticated
  USING (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]))
  WITH CHECK (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));
CREATE POLICY "branches_delete" ON public.branches FOR DELETE TO authenticated
  USING (public.is_store_owner(store_id, auth.uid()));

-- ============ products ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  barcode TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  image_url TEXT NOT NULL DEFAULT '',
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_store_idx ON public.products(store_id);
CREATE UNIQUE INDEX products_store_barcode_idx ON public.products(store_id, barcode) WHERE barcode <> '';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated
  USING (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]))
  WITH CHECK (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated
  USING (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));

-- ============ branch_stock (per-location quantity, one shared catalog) ============
CREATE TABLE public.branch_stock (
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (branch_id, product_id)
);
CREATE INDEX branch_stock_store_idx ON public.branch_stock(store_id);
CREATE INDEX branch_stock_product_idx ON public.branch_stock(product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branch_stock TO authenticated;
GRANT ALL ON public.branch_stock TO service_role;
ALTER TABLE public.branch_stock ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER branch_stock_updated_at BEFORE UPDATE ON public.branch_stock FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "branch_stock_select" ON public.branch_stock FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "branch_stock_insert" ON public.branch_stock FOR INSERT TO authenticated
  WITH CHECK (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));
CREATE POLICY "branch_stock_update" ON public.branch_stock FOR UPDATE TO authenticated
  USING (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]))
  WITH CHECK (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));
CREATE POLICY "branch_stock_delete" ON public.branch_stock FOR DELETE TO authenticated
  USING (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));

-- ============ sales ============
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  cashier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reference TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  tax NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  payment_method public.payment_method NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, reference)
);
CREATE INDEX sales_store_created_idx ON public.sales(store_id, created_at DESC);
GRANT SELECT, INSERT ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_select" ON public.sales FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));

-- ============ sale_items ============
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);
CREATE INDEX sale_items_sale_idx ON public.sale_items(sale_id);
CREATE INDEX sale_items_store_idx ON public.sale_items(store_id);
GRANT SELECT, INSERT ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_items_select" ON public.sale_items FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));

-- ============ create_store: store + owner membership + default branch, atomically ============
CREATE OR REPLACE FUNCTION public.create_store(
  _name TEXT,
  _currency TEXT,
  _branch_name TEXT DEFAULT 'Main branch',
  _tax_rate NUMERIC DEFAULT 0
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _store_id UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _name IS NULL OR btrim(_name) = '' THEN RAISE EXCEPTION 'Store name is required'; END IF;
  IF _currency IS NULL OR _currency NOT IN ('NGN','USD','GHS','KES','ZAR') THEN
    RAISE EXCEPTION 'Unsupported currency: %', COALESCE(_currency, 'null');
  END IF;

  INSERT INTO public.stores (owner_id, name, currency, tax_rate)
  VALUES (_uid, btrim(_name), _currency, COALESCE(_tax_rate, 0))
  RETURNING id INTO _store_id;

  INSERT INTO public.store_members (store_id, user_id, role) VALUES (_store_id, _uid, 'owner');

  INSERT INTO public.branches (store_id, name, is_default)
  VALUES (_store_id, COALESCE(NULLIF(btrim(_branch_name), ''), 'Main branch'), true);

  RETURN _store_id;
END; $$;
REVOKE ALL ON FUNCTION public.create_store(TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_store(TEXT, TEXT, TEXT, NUMERIC) TO authenticated;

-- ============ create_sale: all-or-nothing checkout ============
CREATE OR REPLACE FUNCTION public.create_sale(
  _store_id UUID,
  _branch_id UUID,
  _payment_method TEXT,
  _items JSONB,
  _note TEXT DEFAULT ''
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _sale_id UUID;
  _item JSONB;
  _product public.products%ROWTYPE;
  _qty INTEGER;
  _subtotal NUMERIC(12,2) := 0;
  _tax NUMERIC(12,2) := 0;
  _rate NUMERIC(5,2);
  _line NUMERIC(12,2);
  _available INTEGER;
  _ref TEXT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_store_member(_store_id, _uid) THEN
    RAISE EXCEPTION 'You do not have access to this store';
  END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Cannot complete a sale with an empty cart';
  END IF;
  IF _payment_method NOT IN ('cash','card','transfer','credit') THEN
    RAISE EXCEPTION 'Unsupported payment method: %', _payment_method;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.branches WHERE id = _branch_id AND store_id = _store_id) THEN
    RAISE EXCEPTION 'Branch does not belong to this store';
  END IF;

  SELECT tax_rate INTO _rate FROM public.stores WHERE id = _store_id;

  _ref := 'S-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 6));

  INSERT INTO public.sales (store_id, branch_id, cashier_id, reference, subtotal, tax, total, payment_method, note)
  VALUES (_store_id, _branch_id, _uid, _ref, 0, 0, 0, _payment_method::public.payment_method, COALESCE(_note, ''))
  RETURNING id INTO _sale_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := COALESCE((_item->>'quantity')::INTEGER, 0);
    IF _qty <= 0 THEN RAISE EXCEPTION 'Invalid quantity in cart'; END IF;

    SELECT * INTO _product FROM public.products
      WHERE id = (_item->>'product_id')::UUID AND store_id = _store_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product not found in this store'; END IF;

    SELECT quantity INTO _available FROM public.branch_stock
      WHERE branch_id = _branch_id AND product_id = _product.id FOR UPDATE;
    IF NOT FOUND THEN _available := 0; END IF;
    IF _available < _qty THEN
      RAISE EXCEPTION 'Not enough stock for "%": % left, % requested', _product.name, _available, _qty;
    END IF;

    UPDATE public.branch_stock SET quantity = quantity - _qty
      WHERE branch_id = _branch_id AND product_id = _product.id;

    _line := ROUND(_product.price * _qty, 2);
    _subtotal := _subtotal + _line;

    INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, unit_price, quantity, line_total)
    VALUES (_sale_id, _store_id, _product.id, _product.name, _product.price, _qty, _line);
  END LOOP;

  _tax := ROUND(_subtotal * COALESCE(_rate, 0) / 100, 2);
  UPDATE public.sales SET subtotal = _subtotal, tax = _tax, total = _subtotal + _tax WHERE id = _sale_id;

  RETURN _sale_id;
END; $$;
REVOKE ALL ON FUNCTION public.create_sale(UUID, UUID, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sale(UUID, UUID, TEXT, JSONB, TEXT) TO authenticated;