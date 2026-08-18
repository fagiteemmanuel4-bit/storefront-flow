CREATE OR REPLACE VIEW public.online_catalog WITH (security_invoker=true) AS
SELECT os.store_id,os.slug,os.display_name,os.logo_url,os.display_email,os.display_phone,
       os.description AS store_description,s.currency,p.id AS product_id,p.name,p.sku,p.category,p.price,p.image_url,op.featured,op.description
FROM public.online_stores os
JOIN public.stores s ON s.id=os.store_id
JOIN public.online_products op ON op.store_id=os.store_id
JOIN public.products p ON p.id=op.product_id
WHERE os.is_published AND os.setup_completed AND op.enabled AND p.is_active;
GRANT SELECT ON public.online_catalog TO anon,authenticated;
