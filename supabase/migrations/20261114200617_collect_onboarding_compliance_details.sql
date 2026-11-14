alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists country text;

alter table public.profiles
  drop constraint if exists profiles_date_of_birth_adult_check;
alter table public.profiles
  add constraint profiles_date_of_birth_adult_check
  check (date_of_birth is null or (date_of_birth >= date '1900-01-01' and date_of_birth <= (current_date - interval '18 years')::date));

create table if not exists public.store_compliance_profiles (
  store_id uuid primary key references public.stores(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  registration_status text not null default 'not_registered'
    check (registration_status in ('registered', 'not_registered', 'in_progress')),
  registration_number text,
  declared_branch_count text not null default '1'
    check (declared_branch_count in ('1', '2-5', '6-20', '20+')),
  business_country text not null,
  business_state text not null,
  business_city text not null,
  business_street text not null,
  business_landmark text,
  business_postcode text,
  website_status text not null default 'none'
    check (website_status in ('existing', 'strap', 'none')),
  website_url text,
  wants_strap_website boolean not null default false,
  business_profile_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_compliance_registration_number_required
    check (registration_status <> 'registered' or nullif(trim(registration_number), '') is not null)
);

create index if not exists store_compliance_profiles_owner_idx
  on public.store_compliance_profiles(owner_id);

alter table public.store_compliance_profiles enable row level security;

drop policy if exists store_compliance_owner_select on public.store_compliance_profiles;
create policy store_compliance_owner_select
  on public.store_compliance_profiles
  for select to authenticated
  using (owner_id = (select auth.uid()) and (select private.is_store_owner(store_id, (select auth.uid()))));

drop policy if exists store_compliance_owner_insert on public.store_compliance_profiles;
create policy store_compliance_owner_insert
  on public.store_compliance_profiles
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select private.is_store_owner(store_id, (select auth.uid()))));

drop policy if exists store_compliance_owner_update on public.store_compliance_profiles;
create policy store_compliance_owner_update
  on public.store_compliance_profiles
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select private.is_store_owner(store_id, (select auth.uid()))))
  with check (owner_id = (select auth.uid()) and (select private.is_store_owner(store_id, (select auth.uid()))));

grant select, insert, update on public.store_compliance_profiles to authenticated;
grant select, insert, update on public.store_compliance_profiles to service_role;
grant update (date_of_birth, country) on public.profiles to authenticated;