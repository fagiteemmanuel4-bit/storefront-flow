create or replace function public.ensure_unique_online_store_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 1;
begin
  base_slug := lower(trim(coalesce(new.slug, '')));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');
  base_slug := left(coalesce(nullif(base_slug, ''), 'my-store'), 48);

  -- Serialize slug generation for the same base so two simultaneous signups
  -- cannot both select the same available suffix.
  perform pg_advisory_xact_lock(hashtext(base_slug)::bigint);

  candidate := base_slug;
  loop
    exit when not exists (
      select 1
      from public.online_stores existing
      where existing.slug = candidate
        and existing.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    );
    suffix := suffix + 1;
    candidate := left(base_slug, 48 - length(suffix::text) - 1) || '-' || suffix::text;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists online_stores_ensure_unique_slug on public.online_stores;
create trigger online_stores_ensure_unique_slug
before insert or update of slug on public.online_stores
for each row
execute function public.ensure_unique_online_store_slug();
