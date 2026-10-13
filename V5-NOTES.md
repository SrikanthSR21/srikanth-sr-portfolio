# V5: section bands, floating hero cards, text styles

No database migration and no new environment variables. Everything is saved in the existing `site_content` row `typography`,
so Supabase and Vercel setup stay exactly as before. Edit it all at **/admin → Typography & Highlights**.

## What is new
| Feature | Where in admin | Files |
|---|---|---|
| **Section backgrounds**: per-section Black / Soft / Grey / Contrast (white in dark mode, black in light mode) bands, 4 presets, optional fade edge | Section backgrounds | `lib/tone.ts`, `index.css`, every section component |
| **Floating hero cards** for 5,000+ / 4.2x / 4 Clients / 3 Brands: frosted glass / solid / outline, staggered entrance (rise, fade, pop, tilt, none), gentle float, hover lift | Hero cards | `components/MetricCards.tsx`, `index.css` (`.mc-*`) |
| **Text styles** for 10 kinds of text (hero name, role line, hero label, metric numbers, metric labels, section labels, section titles, section subtitles, card titles, paragraphs): font, size, weight, letter case, and a **separate colour for dark and light mode** | Text styles | `lib/typography.ts` (`ROLES`, `rolesToCss`), `components/admin/TextRolesPanel.tsx` |
| **27 fonts** (sans, serif, display, mono). A font is downloaded only when it is actually chosen | Text styles + existing heading/card pickers | `lib/typography.ts` (`FONT_OPTIONS`, `ensureFont`) |
| **Overall text size** 85-130% | Text styles | `applyTypography` |

## How dark / light sync works
* Bands, cards and shadows are built from the theme variables (`--bg-color`, `--text-color`, `--card-border` ...), so they switch with the theme toggle.
* A **Contrast** band re-points the same colour variables the light theme uses, scoped to that section. Every text, border and card inside flips with it.
* Role colours: the dark-mode colour applies in dark mode, the light-mode colour in light mode. Inside a Contrast band the *other* mode's colour is used
  (the band is flipped), so nothing ends up white-on-white. A mode left on "Original" keeps the site's own colour.
* The admin shows a contrast ratio next to each colour (Readable / OK for large text only / Hard to read).

## Defaults and safety
* New installs ship with bands: Hero black, About grey, Skills black, Projects soft, Advertising contrast (white), Branding black, Contact grey, Footer black.
  Choose **Original (no bands)** to go back to the old look. Text roles all default to "Original", so no text changes until you change it.
* Hero metric numbers and labels are still edited under Hero, Contact & Social.
* Visitors with `prefers-reduced-motion` get still cards (no entrance, no float, no hover scale).
* Gradient section headings keep their gradient even if a custom colour is set.
* Sizes: the chosen px value is for desktop; smaller screens scale it down automatically (no overflow on phones).

## Notes
* Contrast bands flip colours, so a bright custom accent that works on black may need checking on the white band. Use the per-mode colour fields.
* Google Fonts load from fonts.googleapis.com (already used by the site).
