-- Keep the internal account owner UUID out of public supplier profile reads.
revoke select on table public.connect_vendors from anon, authenticated;
grant select (
  id, business_name, slug, description, category, country, state, city,
  whatsapp_number, logo_url, is_published, created_at, updated_at
) on table public.connect_vendors to anon, authenticated;
