-- KUDI online storefronts, product publishing, customer orders and secure public checkout.
CREATE TABLE IF NOT EXISTS public.online_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, logo_url TEXT NOT NULL DEFAULT '', display_email TEXT NOT NULL DEFAULT '',
  display_phone TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', shipping_note TEXT NOT NULL DEFAULT '', checkout_note TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false, setup_completed BOOLEAN NOT NULL DEFAULT false,
  terms_version TEXT NOT NULL DEFAULT '2026-08-18', privacy_version TEXT NOT NULL DEFAULT '2026-08-18',
  accepted_terms_at TIMESTAMPTZ, accepted_privacy_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.online_stores ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.online_stores TO authenticated;
GRANT SELECT ON public.online_stores TO anon;
CREATE OR REPLACE FUNCTION public.is_published_online_store(_store_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.online_stores WHERE store_id=_store_id AND is_published AND setup_completed);
$$;
CREATE POLICY "online_store_members_read" ON public.online_stores FOR SELECT TO authenticated USING (public.is_store_member(store_id,auth.uid()));
CREATE POLICY "online_store_public_read" ON public.online_stores FOR SELECT TO anon USING (is_published AND setup_completed);
CREATE POLICY "online_store_owner_insert" ON public.online_stores FOR INSERT TO authenticated WITH CHECK (public.is_store_owner(store_id,auth.uid()));
CREATE POLICY "online_store_owner_update" ON public.online_stores FOR UPDATE TO authenticated USING (public.is_store_owner(store_id,auth.uid())) WITH CHECK (public.is_store_owner(store_id,auth.uid()));

CREATE TABLE IF NOT EXISTS public.online_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE, enabled BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false, description TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS online_products_store_idx ON public.online_products(store_id);
ALTER TABLE public.online_products ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.online_products TO authenticated;
GRANT SELECT ON public.online_products TO anon;
CREATE OR REPLACE FUNCTION public.is_product_public_online(_product_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.online_products op JOIN public.products p ON p.id=op.product_id WHERE op.product_id=_product_id AND op.enabled AND p.is_active AND public.is_published_online_store(op.store_id));
$$;
CREATE POLICY "online_products_members_read" ON public.online_products FOR SELECT TO authenticated USING (public.is_store_member(store_id,auth.uid()));
CREATE POLICY "online_products_members_write" ON public.online_products FOR ALL TO authenticated USING (public.has_store_role(store_id,auth.uid(),ARRAY['owner','manager']::public.store_role[])) WITH CHECK (public.has_store_role(store_id,auth.uid(),ARRAY['owner','manager']::public.store_role[]));
CREATE POLICY "online_products_public_read" ON public.online_products FOR SELECT TO anon USING (enabled AND public.is_published_online_store(store_id));
CREATE POLICY "products_public_online_read" ON public.products FOR SELECT TO anon USING (public.is_product_public_online(id));

CREATE TABLE IF NOT EXISTS public.online_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  online_store_id UUID NOT NULL REFERENCES public.online_stores(id) ON DELETE CASCADE, order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL, customer_email TEXT NOT NULL DEFAULT '', customer_phone TEXT NOT NULL, shipping_address TEXT NOT NULL,
  customer_note TEXT NOT NULL DEFAULT '', payment_method TEXT NOT NULL DEFAULT 'pay_on_delivery',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','completed','cancelled')),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal>=0), shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping_fee>=0),
  total NUMERIC(12,2) NOT NULL CHECK (total>=0), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS online_orders_store_created_idx ON public.online_orders(store_id,created_at DESC);
ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.online_orders TO authenticated;
CREATE POLICY "online_orders_member_read" ON public.online_orders FOR SELECT TO authenticated USING (public.is_store_member(store_id,auth.uid()));
CREATE POLICY "online_orders_manager_update" ON public.online_orders FOR UPDATE TO authenticated USING (public.has_store_role(store_id,auth.uid(),ARRAY['owner','manager']::public.store_role[])) WITH CHECK (public.has_store_role(store_id,auth.uid(),ARRAY['owner','manager']::public.store_role[]));

CREATE TABLE IF NOT EXISTS public.online_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES public.online_orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL, unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price>=0), quantity INTEGER NOT NULL CHECK (quantity>0), line_total NUMERIC(12,2) NOT NULL CHECK (line_total>=0)
);
CREATE INDEX IF NOT EXISTS online_order_items_order_idx ON public.online_order_items(order_id);
ALTER TABLE public.online_order_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.online_order_items TO authenticated;
CREATE POLICY "online_order_items_member_read" ON public.online_order_items FOR SELECT TO authenticated USING (public.is_store_member(store_id,auth.uid()));

CREATE OR REPLACE FUNCTION public.create_online_order(_slug TEXT,_customer_name TEXT,_customer_email TEXT,_customer_phone TEXT,_shipping_address TEXT,_customer_note TEXT,_payment_method TEXT,_items JSONB)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.stores%ROWTYPE; os public.online_stores%ROWTYPE; p public.products%ROWTYPE; item JSONB; qty INTEGER; subtotal NUMERIC(12,2):=0; order_id UUID; order_no TEXT;
BEGIN
  IF btrim(COALESCE(_customer_name,''))='' OR btrim(COALESCE(_customer_phone,''))='' OR btrim(COALESCE(_shipping_address,''))='' THEN RAISE EXCEPTION 'Name, phone and delivery address are required'; END IF;
  IF _payment_method NOT IN ('pay_on_delivery','bank_transfer') THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;
  IF _items IS NULL OR jsonb_array_length(_items)=0 THEN RAISE EXCEPTION 'Your cart is empty'; END IF;
  SELECT * INTO os FROM public.online_stores WHERE slug=lower(btrim(_slug)) AND is_published AND setup_completed;
  IF NOT FOUND THEN RAISE EXCEPTION 'Storefront not found'; END IF;
  SELECT * INTO s FROM public.stores WHERE id=os.store_id;
  FOR item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT p.* INTO p FROM public.products p JOIN public.online_products op ON op.product_id=p.id WHERE p.id=(item->>'product_id')::UUID AND p.store_id=s.id AND p.is_active AND op.enabled;
    IF NOT FOUND THEN RAISE EXCEPTION 'A product in your cart is no longer available'; END IF;
    qty:=GREATEST(1,COALESCE((item->>'quantity')::INTEGER,1)); subtotal:=subtotal+(p.price*qty);
  END LOOP;
  order_no:='KU-'||to_char(now(),'YYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
  INSERT INTO public.online_orders(store_id,online_store_id,order_number,customer_name,customer_email,customer_phone,shipping_address,customer_note,payment_method,subtotal,total)
  VALUES(s.id,os.id,order_no,btrim(_customer_name),lower(btrim(COALESCE(_customer_email,''))),btrim(_customer_phone),btrim(_shipping_address),btrim(COALESCE(_customer_note,'')),_payment_method,subtotal,subtotal) RETURNING id INTO order_id;
  FOR item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT p.* INTO p FROM public.products p JOIN public.online_products op ON op.product_id=p.id WHERE p.id=(item->>'product_id')::UUID AND p.store_id=s.id AND p.is_active AND op.enabled;
    qty:=GREATEST(1,COALESCE((item->>'quantity')::INTEGER,1));
    INSERT INTO public.online_order_items(order_id,store_id,product_id,product_name,unit_price,quantity,line_total) VALUES(order_id,s.id,p.id,p.name,p.price,qty,p.price*qty);
  END LOOP;
  RETURN order_no;
END; $$;
REVOKE ALL ON FUNCTION public.create_online_order(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_online_order(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB) TO anon,authenticated;

CREATE OR REPLACE VIEW public.online_catalog WITH (security_invoker=true) AS
SELECT os.store_id,os.slug,os.display_name,os.logo_url,os.display_email,os.display_phone,os.description AS store_description,
       p.id AS product_id,p.name,p.sku,p.category,p.price,p.image_url,op.featured,op.description
FROM public.online_stores os JOIN public.online_products op ON op.store_id=os.store_id JOIN public.products p ON p.id=op.product_id
WHERE os.is_published AND os.setup_completed AND op.enabled AND p.is_active;
GRANT SELECT ON public.online_catalog TO anon,authenticated;

INSERT INTO storage.buckets(id,name,public) VALUES('kudi-store-assets','kudi-store-assets',true) ON CONFLICT(id) DO UPDATE SET public=true;
CREATE POLICY "kudi_assets_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id='kudi-store-assets');
CREATE POLICY "kudi_assets_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='kudi-store-assets' AND public.is_store_owner((storage.foldername(name))[1]::uuid,auth.uid()));
CREATE POLICY "kudi_assets_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='kudi-store-assets' AND public.is_store_owner((storage.foldername(name))[1]::uuid,auth.uid()));

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.online_orders; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
