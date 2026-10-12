# Portfolio V4: what changed and how to set it up

## One-time setup (≈2 minutes)
1. Supabase → SQL Editor → run `supabase/migration-004-media-skills-typography.sql` (safe to re-run; creates only the `media_assets` table, admin-only).
2. No new environment variables. `npm install && npm run build` as before.
3. Open `/admin` → **Dashboard** shows a setup checklist (it turns the "Media details table" line green once step 1 is done).

Without step 1 the site and admin still work (skills, headings, typography, experience images, upload, delete all work);
only external-image records, alt text/category/attribution and per-file details in the Media Library need the table.

## Features
| # | Feature | Where |
|---|---|---|
| 2 | Dedicated **Skills** section (cards / tags / progress bars), in navbar + body between About and Projects, categories, icons, levels, per-skill and per-category hide, reorder, whole-section toggle | Admin → Skills |
| 3 | About: clean rectangular, borderless, uncropped portrait with reserved aspect ratio; cleaner text hierarchy; skills moved out | Admin → About Portrait |
| 4 | Optional image on each Work Experience entry (upload / library / remove, position, size, fit, alt, caption, privacy hint) | Admin → Work Experience |
| 5 | Central heading editor (eyebrow/title/subtitle per section, per-field and global reset). Section ids never change | Admin → Section Headings |
| 6 | Media Library (grid, search, filter, sort, upload, replace-everywhere, delete, usage tracking, external URLs with licence/attribution) + Storage Management (usage, quota, unused files, safe bulk delete) | Admin → Media Library / Storage Management |
| 7 | Morgan flash fixed (see below) | `ContentContext.tsx`, `App.tsx`, `defaults.ts`, `portfolioData.ts`, `index.html` |
| 8 | Projects: 3 columns on laptop/desktop (≥1024px), 2 on tablet (≥640px), 1 on phones | `ProjectPortfolio.tsx` |
| 9 | Typography & highlights with live preview, presets, per-section effects, reset | Admin → Typography & Highlights |
| 10 | Admin regrouped (Overview, Profile & About, Portfolio content, Media & storage, Site settings, Messages & system) | `AdminPage.tsx` |

## Root cause of the "Morgan" flash
* `INITIAL_PORTFOLIO_INFO.personaName` was `'MORGANDEMAXWEL'`, and `DEFAULT_TEXTS`, `index.html` and the contact placeholder said "Morgan Maxwell". `ContentProvider` rendered those built-in defaults until Supabase answered, then swapped in your saved name.
* A second bug: if the Supabase request *failed* (offline / slow mobile), `load()` replaced the screen with the built-in defaults.

Fix: defaults now carry the right identity; every successful load stores a snapshot in `localStorage` (`site_snapshot_v4`) and later visits start from it (correct name from the first render, no flash, no revert after refresh); a failed request never resets what is on screen; a first-ever visit with no snapshot shows a neutral splash (max 2.5 s, then the page renders with correct defaults). `/admin` never uses the snapshot, so you always edit fresh data. Nothing is written to the database at startup.

## Data safety
* No tables are altered. New settings use the existing `site_content` keys `skills` and `typography`; headings reuse `texts`.
* Until you save from Admin → Skills, the public site derives skills from your existing `info.skills`, so nothing disappears. The printable CV uses the same skills.
* Saved layouts and navigation from before V4 get **Skills** inserted after About at read time (database untouched).
  To remove the navbar link, switch it off under Admin → Navbar Links (deleting it would make it reappear).
* Media deletion: files referenced by saved content (projects, campaigns, experience, portrait, CV, skill icons…) show a red warning and require typing DELETE. Bulk delete lists only unreferenced files and re-checks right before deleting.
* "Replace file" uploads the new file, repoints every reference, and leaves the old file as unused.

## Known limitations / manual steps
* Supabase does not expose your storage quota to the browser: enter your plan's limit on the Storage page (default 1024 MB; kept in that browser only).
* The unused check only sees **saved** content, not unsaved edits in other tabs.
* Navbar breakpoint moved from 1024px to 1280px so the extra Skills link fits; between 1024 and 1279px the hamburger menu is used.
* Advertising cards stay at 2 columns on desktop (4-stat cards get too cramped at 3).
* A single accent colour is used for light and dark themes: pick one that reads well on both.
* Anton/Cinzel only ship a few weights, so some weight choices look identical there.
