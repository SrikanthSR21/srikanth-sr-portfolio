> **V4:** read [V4-NOTES.md](V4-NOTES.md) first: one new SQL migration (`supabase/migration-004-media-skills-typography.sql`) and the list of new admin features.

# imsrikanth — Stitch design + Supabase backend + Admin panel

Design, fonts and animations are preserved; see the v3 section at the end for the latest changes.
Only the *data source* changed: hard-coded strings/arrays → Supabase (with the old values kept as fallback).

## Stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React 19 + Tailwind 4 (as-is) | Switching to Next.js would risk the design; not needed |
| DB + Auth + Storage | **Supabase** (Postgres) | One free service for data, login and images; Row Level Security protects writes |
| Hosting | Vercel (static Vite build) | `vercel.json` included |

## Setup (≈ 15 min)
1. **Supabase**: supabase.com → New project. Save the DB password somewhere.
2. **SQL**: SQL Editor → paste `supabase/schema.sql` → replace `YOUR_ADMIN_EMAIL` → Run.
3. **Admin user**: Authentication → Users → Add user (that email + strong password, tick "Auto confirm").
4. **Disable signups**: Authentication → Sign In / Providers → turn OFF "Allow new users to sign up".
5. **Keys**: Project Settings → API → copy *Project URL* and *anon public* key.
6. **Local run**:
   ```bash
   cp .env.example .env      # paste the two values
   npm install
   npm run dev
   ```
7. Click **Admin** → log in → **Site Content → Setup → "Publish built-in content to database"** (one time).
   This copies all current text + uploads the bundled images to Supabase Storage.
8. **Vercel**: push to GitHub → vercel.com → Add New Project → import repo → Environment Variables:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → Deploy. (Add your Vercel URL under Supabase → Authentication → URL Configuration → Site URL.)

## What is editable now
- Navbar items: label, link, order, show/hide, add/delete (incl. the "Resume (Download)" item)
- Brand name / real name / role / bio / skills / contact / socials → *Info Editor* tab (now saved to the DB)
- Every UI label (hero buttons, section eyebrows & titles, footer, "Type / True Black / Admin"…) → *Texts*
- Hero metric bar, Projects, Advertising campaigns, Experience, Brand ticker, profile portrait
- Contact-form messages arrive in the *Client Tickets* tab (stored in DB, only you can read them)

## Adding a new editable text
1. Add `'section.key': 'Default text'` to `DEFAULT_TEXTS` in `src/lib/defaults.ts`
2. In the component: `const { t } = useContent();` then `{t('section.key')}`
It shows up in Admin → Texts automatically.

## Folder structure (new/changed only)
```
supabase/schema.sql              tables, RLS policies, storage bucket
vercel.json
.env.example
src/
  lib/supabase.ts                client
  lib/defaults.ts                default nav / texts / metrics (old hard-coded values)
  lib/seed.ts                    one-time image migration helper
  context/ContentContext.tsx     loads DB → React, save functions, admin session
  components/admin/
    ContentAdmin.tsx             tabs: Navigation, Texts, Hero stats, Projects, …
    RecordsEditor.tsx            reusable add/edit/reorder/delete list editor
    ImageUploader.tsx            resize → WebP → Supabase Storage
  components/AdminPanelModal.tsx real login (replaces 'admin123')
  components/Navbar.tsx, HeroSection.tsx, *Section.tsx   text/data now from context
  main.tsx, App.tsx              wrapped in <ContentProvider>
```

## Security notes
- The old `admin123` passcode lived in the browser bundle (anyone could read it). It's gone; login is now Supabase Auth.
- Write access is enforced in the database (`is_admin()` + RLS), not in the UI.
- The anon key is public by design. **Never** put the `service_role` key in this project.


---
## v2 — Public site vs `/admin`
- **Public site (`/`)**: no Type / True Black / Admin buttons, no animation switcher, no admin link in the footer.
  Theme, typography and hero animation are read from the database (`site_content.theme`).
- **Admin (`/admin`)**: login form → dashboard with 4 tabs
  - *Appearance*: theme (True Black / Midnight / Custom colours), typography pair, hero animation (Grid / Code / Pulse)
  - *Hero, Contact & Social*: hero heading + sub-text, real name, email, phone, WhatsApp, Instagram, LinkedIn, bio, skills, education, CV upload
  - *Site Content*: navigation (add/edit/reorder/hide), texts, hero stats, projects, ad campaigns, experience, brand ticker, portrait
  - *Inbox*: contact-form messages
- Every change saves instantly. Open visitor tabs update live once you run `supabase/migration-002-realtime.sql` once;
  otherwise visitors see changes on their next refresh or when they return to the tab.
- `/admin` is loaded as a separate JS chunk (visitors never download it) and is marked `noindex`.

## Environment variables (Vercel)
Only two are needed: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. There is no `ADMIN_SECRET_KEY` / `DATABASE_URL`:
this is a static site, and anything secret placed in a `VITE_` variable would be public. Admin identity lives in Supabase Auth + the `is_admin()` rule.

---
## v3 — Responsive fixes, Sections & Layout, light/dark mode, contact → Inbox + WhatsApp

### Run SQL once
Supabase → SQL Editor → run `supabase/migration-003-sections-contact-whatsapp.sql` (safe to re-run; deletes nothing).
It adds WhatsApp-status columns to `tickets`, tightens the public insert policy and enables realtime for the inbox.
Section layout and enquiry suggestions live in the existing `site_content` table (keys `layout`, `enquiry_types`), so no new table.

### Admin dashboard (`/admin`)
Sidebar (drawer on mobile): **Sections & Layout** (drag/arrows to reorder, show/hide, rename headings, saved to Supabase),
Appearance (now includes the *default* light/dark mode for new visitors), Hero/Contact/Social, My Own Projects, Advertising Work,
Work Experience, Brand Ticker, Hero Metrics, Images, Navigation, All Texts, Inbox, Contact Form, Setup.
Editors warn about unsaved changes, confirm deletes, and show Saving / Saved / Error states.
Projects and Advertising records have an eye icon to hide them without deleting.

### Light / dark mode
Navbar toggle (sun/moon). The visitor's choice is stored in their browser (`site_color_mode`); the admin setting is only the default.
Light mode re-points Tailwind's monochrome colour variables in `src/index.css` (`:root[data-theme='light']`), so photos, logos and
accent colours are untouched. No `filter: invert`. `/admin` stays dark.

### WhatsApp notifications (secure, server-side)
`api/contact.ts` (Vercel Function) validates → saves to Supabase → calls the official WhatsApp Cloud API. If WhatsApp fails or is not
configured the enquiry is still in the Inbox, and the visitor is offered a prefilled `wa.me` link (opening it does NOT send anything; they must press send).
If `/api/contact` is unreachable (e.g. `npm run dev`), the form falls back to a direct Supabase insert with the same reference id (no duplicates).

Setup: Meta Business account → WhatsApp → API setup → add a sending number, create a System User + permanent token (permission `whatsapp_business_messaging`),
note the Phone Number ID. Create a **Utility template** (e.g. `portfolio_enquiry`, English) with body:
`New portfolio enquiry from {{1}} ({{2}}). Type: {{3}}. Message: {{4}}. Received: {{5}}` and set `WHATSAPP_TEMPLATE_NAME`.
Without a template, free-form text only reaches you if you messaged the business number in the last 24 hours (Meta rule).
Add the env vars from `.env.example` in Vercel → Settings → Environment Variables → redeploy.

### About portrait & transparent PNG
Uploads keep PNG/WebP bytes unchanged (≤ 4 MB, ≤ 1800 px); larger transparent images are resized to PNG, never JPEG. Transparency is detected and
shown as a free cut-out (no frame, no fill, `object-contain`). The admin preview uses a checkerboard. Admin → Images lets you force framed/cut-out.
