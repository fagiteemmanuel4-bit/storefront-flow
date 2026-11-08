create table if not exists public.store_feedback (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('rating', 'report')),
  rating smallint null check (rating between 1 and 5),
  reason text not null default '',
  message text not null default '',
  contact_email text not null default '',
  created_at timestamptz not null default now(),
  constraint store_feedback_kind_rating_rule check (
    (feedback_type = 'rating' and rating is not null and reason = '') or
    (feedback_type = 'report' and rating is null)
  )
);

create index if not exists store_feedback_store_created_idx
  on public.store_feedback(store_id, created_at desc);

alter table public.store_feedback enable row level security;

drop policy if exists "Anyone can submit store feedback" on public.store_feedback;
create policy "Anyone can submit store feedback"
  on public.store_feedback
  for insert
  to anon, authenticated
  with check (
    length(message) <= 2000
    and length(contact_email) <= 320
    and length(reason) <= 120
  );

revoke select, update, delete on public.store_feedback from anon, authenticated;
grant insert on public.store_feedback to anon, authenticated;
