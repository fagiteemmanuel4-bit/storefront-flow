-- Require a usable supplier location and phone before a profile can be publicly listed.
alter table public.connect_vendors
  add constraint connect_vendors_publish_requirements
  check (
    not is_published
    or (
      char_length(btrim(state)) > 0
      and char_length(btrim(city)) > 0
      and whatsapp_number ~ '^[0-9]{8,20}$'
    )
  );
