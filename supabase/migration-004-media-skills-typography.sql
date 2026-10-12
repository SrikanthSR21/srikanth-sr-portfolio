-- ============================================================================
-- Migration 004 (V4): Media Library metadata
-- Run ONCE in Supabase → SQL Editor, AFTER schema.sql and migrations 002/003. Safe to re-run.
-- Nothing is dropped, renamed or overwritten: existing content, tickets, storage files and policies are untouched.
-- ============================================================================

-- 1) Media metadata. The FILES stay in the existing public storage bucket `portfolio` (no change).
--    This table adds: category, alt text, dimensions, and attribution/licence for externally hosted images
--    (Unsplash, Pexels … — those images are only LINKED, never copied into your storage).
create table if not exists public.media_assets (
  id           text primary key,                                   -- client-generated uuid
  source       text not null default 'upload' check (source in ('upload', 'external')),
  url          text not null,
  storage_path text unique,                                        -- null for external images
  filename     text not null,
  mime_type    text,
  size_bytes   bigint,
  width        int,
  height       int,
  has_alpha    boolean,
  category     text not null default 'other',
  alt_text     text,
  source_name  text,                                               -- e.g. "Unsplash"
  source_url   text,                                               -- page the image came from
  license      text,                                               -- e.g. "Unsplash License"
  attribution  text,                                               -- e.g. "Photo by … on Unsplash"
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists media_assets_category_idx on public.media_assets (category);
create index if not exists media_assets_url_idx      on public.media_assets (url);

-- 2) Admin-only. Visitors cannot read or change media records; the files themselves remain publicly viewable by URL
--    (required for the website to display them), and only the admin can upload / replace / delete files (schema.sql policies).
alter table public.media_assets enable row level security;
drop policy if exists "admin manages media" on public.media_assets;
create policy "admin manages media" on public.media_assets
  for all using (public.is_admin()) with check (public.is_admin());

-- 3) New site settings in V4 need NO new tables. They are stored in the existing public.site_content table under the keys
--       'skills'       → skill categories + skills (when absent, the old info.skills are shown unchanged)
--       'typography'   → headings / highlight / radius settings (when absent, the original design is used)
--    and the editable section headings continue to use the existing 'texts' and 'layout' keys.
--    Existing rows are never modified by this migration.
