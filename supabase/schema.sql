-- ============================================================
-- Run this ONCE in Supabase → SQL Editor → New query → Run
-- 1) Replace YOUR_ADMIN_EMAIL below with the email you will log in with.
-- 2) Then: Authentication → Users → "Add user" (that same email + a strong password)
-- 3) Then: Authentication → Sign In / Providers → turn OFF "Allow new users to sign up"
-- ============================================================

-- Who is the admin? Only this email can write anything.
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'YOUR_ADMIN_EMAIL'
$$;

-- Single-value content: info, nav, texts, hero_metrics, clients, images
create table if not exists public.site_content (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Ordered lists. `data` holds the whole item, so your TypeScript types stay unchanged
-- and you can add new fields later without a database migration.
create table if not exists public.projects (
  id text primary key, sort_order int not null default 0, data jsonb not null,
  updated_at timestamptz not null default now());
create table if not exists public.ad_campaigns (like public.projects including all);
create table if not exists public.experience   (like public.projects including all);

-- Contact-form inbox
create table if not exists public.tickets (
  ref          text primary key,
  client_name  text not null check (char_length(client_name)  between 1 and 120),
  client_email text not null check (char_length(client_email) between 3 and 200),
  service      text,
  budget       text,
  message      text not null check (char_length(message) between 1 and 4000),
  status       text not null default 'New',
  created_at   timestamptz not null default now()
);

-- ---------- Row Level Security ----------
alter table public.site_content enable row level security;
alter table public.projects     enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.experience   enable row level security;
alter table public.tickets      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['site_content','projects','ad_campaigns','experience'] loop
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('create policy "admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Visitors may submit the contact form; only you can read or manage the inbox.
create policy "anyone can submit" on public.tickets for insert to anon, authenticated
  with check (status = 'New');
create policy "admin reads"   on public.tickets for select using (public.is_admin());
create policy "admin updates" on public.tickets for update using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes" on public.tickets for delete using (public.is_admin());

-- ---------- Image storage ----------
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy "portfolio public read"   on storage.objects for select
  using (bucket_id = 'portfolio');
create policy "portfolio admin insert"  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and public.is_admin());
create policy "portfolio admin update"  on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and public.is_admin());
create policy "portfolio admin delete"  on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and public.is_admin());
