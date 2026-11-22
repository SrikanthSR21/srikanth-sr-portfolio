# V7: Managed Profiles + Instagram Reels

No database migration, no new environment variables. Both features are stored in the existing `site_content` table
(keys `social_profiles` and `reels`), so realtime updates, the visitor cache and RLS (public read / admin write) already cover them.

## Admin (/admin → Portfolio content)
* **Managed Profiles**: platform (Instagram, LinkedIn, Facebook, YouTube, X, Other), name, link, handle, niche, what you did,
  followers, growth, picture. Add, edit, delete, reorder, hide. The link must match the chosen platform.
  Follower numbers are typed by you and shown as "Figures as of <date>" (today's date is filled automatically when the numbers change).
* **Instagram Reels**: paste a reel / post link (tracking parameters are stripped), optional caption and cover image.
  Duplicates and non-reel links (profile links, the Reels tab, other sites) are rejected. Add, edit, delete, reorder, hide.
* Each page shows a live status line: how many items the public site is actually showing.

## Public site
* **Profiles I Have Managed**: cards with avatar, platform, niche, role, numbers and a "View profile" link; platform filter chips appear when there is more than one platform.
* **Instagram Reels**: portrait cards; tapping one opens the real reel in a player (the Instagram embed is only loaded on tap).
* **No data = no section.** With no visible, valid profile / reel the section renders nothing and its navbar + footer link disappear. No empty heading, no sample data.
* Changes you save appear on open visitor tabs within about a second (Supabase realtime).

## Also updated
Section Visibility & Order, Section Headings and All Texts list the two new sections; Dashboard shows their counts; the Media Library / Storage
Management count profile pictures and reel covers as "in use" (so clean-up never deletes them) and Replace updates them too.
Existing saved layouts and navbars get the new sections / links inserted next to Advertising automatically.

## New files
`src/lib/social.ts`, `src/components/ProfilesSection.tsx`, `src/components/ReelsSection.tsx`,
`src/components/admin/SocialProfilesAdmin.tsx`, `src/components/admin/ReelsAdmin.tsx`

## Changed files
`src/types/index.ts`, `src/context/ContentContext.tsx`, `src/App.tsx`, `src/pages/AdminPage.tsx`, `src/lib/sections.ts`, `src/lib/defaults.ts`,
`src/lib/typography.ts`, `src/lib/media.ts`, `src/components/admin/{LayoutAdmin,DashboardAdmin,MediaLibrary}.tsx`
