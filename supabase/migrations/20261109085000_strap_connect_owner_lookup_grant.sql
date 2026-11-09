-- The owner UUID is needed for an authenticated user's own-profile lookup only.
-- It is intentionally not granted to anon/public visitors.
grant select (owner_id) on table public.connect_vendors to authenticated;
