create policy stores_public_online_read on public.stores for select using (exists (select 1 from public.online_stores os where os.store_id = stores.id and os.is_published and os.setup_completed));
