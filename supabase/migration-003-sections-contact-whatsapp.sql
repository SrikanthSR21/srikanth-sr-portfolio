-- ============================================================================
-- Migration 003 — dynamic sections, simplified contact form, WhatsApp status
-- Run ONCE in Supabase → SQL Editor, AFTER schema.sql and migration-002.
-- Safe to re-run. Nothing is dropped or deleted; existing tickets, IDs and content are untouched.
-- ============================================================================

-- 1) Tickets: track WhatsApp delivery. (service = enquiry type; budget stays for historical rows.)
alter table public.tickets add column if not exists whatsapp_status  text;
alter table public.tickets add column if not exists whatsapp_error   text;
alter table public.tickets add column if not exists whatsapp_sent_at timestamptz;
alter table public.tickets add column if not exists updated_at       timestamptz not null default now();

-- Widen `service` so a visitor's own "Other" answer fits (was unbounded text already; add a sane cap).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'tickets_service_len') then
    alter table public.tickets add constraint tickets_service_len check (service is null or char_length(service) <= 80) not valid;
  end if;
end $$;
-- NOT VALID = applies to new rows only, so old rows with longer legacy values never block the migration.

-- 2) Public may still INSERT a ticket, but cannot pre-fill the server-managed WhatsApp columns.
--    SELECT / UPDATE / DELETE remain admin-only (unchanged).
drop policy if exists "anyone can submit" on public.tickets;
create policy "anyone can submit" on public.tickets for insert to anon, authenticated
  with check (status = 'New' and whatsapp_status is null and whatsapp_error is null and whatsapp_sent_at is null);

-- 3) Realtime for the admin inbox (RLS still applies: only the admin receives rows).
do $$ begin
  alter publication supabase_realtime add table public.tickets;
exception when duplicate_object then null; end $$;

-- 4) Section layout, enquiry-type suggestions and everything else new is stored in the existing
--    public.site_content table under the keys 'layout' and 'enquiry_types' — no new table needed.
--    Public read / admin-only write policies already cover them. Nothing to create here.

-- 5) Verify (optional): the anonymous role must NOT be able to read tickets.
--    select * from public.tickets;   -- run via the API with the anon key → must return [] / permission error
