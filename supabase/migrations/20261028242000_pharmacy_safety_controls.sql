-- Pharmacy metadata, recall quarantine and prescription verification.
create table if not exists public.pharmacy_product_details (
 id uuid primary key default gen_random_uuid(),
 store_id uuid not null references public.stores(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 active_ingredient text not null default '',
 strength text not null default '',
 dosage_form text not null default '',
 manufacturer text not null default '',
 registration_number text not null default '',
 prescription_required boolean not null default false,
 controlled_schedule text not null default '',
 notes text not null default '',
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint pharmacy_product_details_store_product_key unique(store_id,product_id)
);
create index if not exists pharmacy_product_details_rx_idx on public.pharmacy_product_details(store_id,product_id,prescription_required);

create table if not exists public.pharmacy_recalls (
 id uuid primary key default gen_random_uuid(),
 store_id uuid not null references public.stores(id) on delete cascade,
 branch_id uuid not null references public.branches(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete restrict,
 batch_id uuid references public.inventory_batches(id) on delete set null,
 batch_number text not null,
 recall_reference text not null,
 reason text not null,
 status text not null default 'open' check(status in ('open','resolved')),
 recalled_by uuid not null references auth.users(id),
 recalled_at timestamptz not null default now(),
 resolution_note text not null default '',
 resolved_by uuid references auth.users(id),
 resolved_at timestamptz
);
create unique index if not exists pharmacy_recalls_one_open_batch_idx on public.pharmacy_recalls(batch_id) where status='open' and batch_id is not null;
create index if not exists pharmacy_recalls_store_status_idx on public.pharmacy_recalls(store_id,branch_id,status,recalled_at desc);

alter table public.inventory_batches drop constraint if exists inventory_batches_status_check;
alter table public.inventory_batches add constraint inventory_batches_status_check check(status in ('active','expired','hold','closed','recalled'));
alter table public.sale_items add column if not exists pharmacy_prescription_verified boolean not null default false;
alter table public.sale_items add column if not exists pharmacy_prescription_reference text not null default '';

alter table public.pharmacy_product_details enable row level security;
alter table public.pharmacy_recalls enable row level security;
drop policy if exists "Store members can view pharmacy product details" on public.pharmacy_product_details;
create policy "Store members can view pharmacy product details" on public.pharmacy_product_details for select to authenticated
using(public.is_store_member(store_id,(select auth.uid())));
drop policy if exists "Managers can manage pharmacy product details" on public.pharmacy_product_details;
create policy "Managers can manage pharmacy product details" on public.pharmacy_product_details for all to authenticated
using(public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
with check(
 public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
 and exists(select 1 from public.products p where p.id=pharmacy_product_details.product_id and p.store_id=pharmacy_product_details.store_id)
);
drop policy if exists "Store members can view pharmacy recalls" on public.pharmacy_recalls;
create policy "Store members can view pharmacy recalls" on public.pharmacy_recalls for select to authenticated
using(public.is_store_member(store_id,(select auth.uid())));
drop policy if exists "Managers can resolve pharmacy recalls" on public.pharmacy_recalls;
create policy "Managers can resolve pharmacy recalls" on public.pharmacy_recalls for update to authenticated
using(public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
with check(public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]));

create or replace function public.mark_pharmacy_batch_recall(
 _store_id uuid,_branch_id uuid,_batch_id uuid,_recall_reference text,_reason text
)
returns uuid language plpgsql security definer set search_path=public as $function$
declare v_user_id uuid:=auth.uid(); v_batch record; v_recall_id uuid;
begin
 if v_user_id is null then raise exception 'Not authenticated'; end if;
 if not public.has_store_role(_store_id,v_user_id,array['owner','manager']::public.store_role[]) then raise exception 'Only a store owner or manager can quarantine a recalled batch'; end if;
 if length(btrim(coalesce(_recall_reference,'')))<2 then raise exception 'Enter the recall reference'; end if;
 if length(btrim(coalesce(_reason,'')))<5 then raise exception 'Enter the recall reason'; end if;
 select * into v_batch from public.inventory_batches where id=_batch_id and store_id=_store_id and branch_id=_branch_id for update;
 if not found then raise exception 'Batch not found'; end if;
 if v_batch.status='recalled' then raise exception 'This batch is already recalled'; end if;
 update public.inventory_batches set status='recalled',updated_at=now() where id=_batch_id;
 insert into public.pharmacy_recalls(store_id,branch_id,product_id,batch_id,batch_number,recall_reference,reason,recalled_by)
 values(_store_id,_branch_id,v_batch.product_id,v_batch.id,v_batch.batch_number,btrim(_recall_reference),btrim(_reason),v_user_id)
 returning id into v_recall_id;
 return v_recall_id;
end;
$function$;

create or replace function public.resolve_pharmacy_recall(_store_id uuid,_recall_id uuid,_resolution_note text)
returns void language plpgsql security definer set search_path=public as $function$
declare v_user_id uuid:=auth.uid();
begin
 if v_user_id is null then raise exception 'Not authenticated'; end if;
 if not public.has_store_role(_store_id,v_user_id,array['owner','manager']::public.store_role[]) then raise exception 'Only a store owner or manager can resolve recalls'; end if;
 if length(btrim(coalesce(_resolution_note,'')))<3 then raise exception 'Enter a resolution note'; end if;
 update public.pharmacy_recalls set status='resolved',resolution_note=btrim(_resolution_note),resolved_by=v_user_id,resolved_at=now()
 where id=_recall_id and store_id=_store_id and status='open';
 if not found then raise exception 'Open recall not found'; end if;
 -- Resolution never makes a recalled batch sellable again; use a documented disposal/replacement process.
end;
$function$;
