-- System-wide maintenance and platform announcements.
create table if not exists public.platform_announcements (
 id uuid primary key default gen_random_uuid(),
 title text not null check (length(trim(title)) between 3 and 140),
 body text not null check (length(trim(body)) between 3 and 5000),
 kind text not null default 'info' check (kind in ('maintenance','warning','info','success')),
 is_published boolean not null default false,
 starts_at timestamptz not null default now(),
 ends_at timestamptz,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (ends_at is null or ends_at > starts_at)
);
create index if not exists platform_announcements_active_idx on public.platform_announcements(starts_at desc,created_at desc) where is_published=true;
alter table public.platform_announcements enable row level security;
revoke all on public.platform_announcements from anon,authenticated;
grant select,insert,update,delete on public.platform_announcements to authenticated;
drop policy if exists platform_announcements_read_active on public.platform_announcements;
create policy platform_announcements_read_active on public.platform_announcements for select to authenticated using (public.is_platform_admin() or (is_published=true and starts_at<=now() and (ends_at is null or ends_at>now())));
drop policy if exists platform_announcements_admin_insert on public.platform_announcements;
create policy platform_announcements_admin_insert on public.platform_announcements for insert to authenticated with check (public.is_platform_admin() and created_by=(select auth.uid()));
drop policy if exists platform_announcements_admin_update on public.platform_announcements;
create policy platform_announcements_admin_update on public.platform_announcements for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
drop policy if exists platform_announcements_admin_delete on public.platform_announcements;
create policy platform_announcements_admin_delete on public.platform_announcements for delete to authenticated using (public.is_platform_admin());
create table if not exists public.platform_announcement_reads (
 announcement_id uuid not null references public.platform_announcements(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key(announcement_id,user_id)
);
create index if not exists platform_announcement_reads_user_idx on public.platform_announcement_reads(user_id,read_at desc);
alter table public.platform_announcement_reads enable row level security;
revoke all on public.platform_announcement_reads from anon,authenticated;
grant select,insert on public.platform_announcement_reads to authenticated;
drop policy if exists platform_announcement_reads_select_own on public.platform_announcement_reads;
create policy platform_announcement_reads_select_own on public.platform_announcement_reads for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists platform_announcement_reads_insert_own on public.platform_announcement_reads;
create policy platform_announcement_reads_insert_own on public.platform_announcement_reads for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.platform_announcements a where a.id=announcement_id and a.is_published=true and a.starts_at<=now() and (a.ends_at is null or a.ends_at>now())));
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='platform_announcements') then
  alter publication supabase_realtime add table public.platform_announcements;
 end if;
end $$;