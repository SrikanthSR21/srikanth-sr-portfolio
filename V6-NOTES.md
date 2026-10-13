# V6: custom background colour for every section

Built on V5. No database migration, no new environment variables: the colours are saved inside the existing `typography` row.

## What is new
In **/admin → Typography & Highlights → Section backgrounds**, every section now has a fifth choice, **Custom**, next to Page background / Soft / Grey / Contrast.

* Two colours per section: one for **dark mode**, one for **light mode** (colour picker + hex field).
* One-click black / grey / white chips (`#000000 … #ffffff`) for the black-grey-white theme.
* "Use the dark-mode colour in both modes" button, if you want one colour everywhere.
* When you first choose Custom, it starts from the colours the section has right now, so nothing jumps.
* The swatch on the button shows both of your chosen colours (dark half / light half).

## How it stays readable and in sync
* The theme toggle swaps between the section's dark-mode colour and light-mode colour automatically.
* For each colour the site picks white or black text by contrast (`bandFg`) and re-points the same palette variables the Contrast band uses,
  so headings, paragraphs, borders, cards, buttons and the floating hero cards all follow. The admin shows the contrast ratio under each colour.
* Your **Text styles** colours are respected: where a band flips the palette (e.g. a white band in dark mode) the colour you set for the *other* mode is used.
* "Fade into page" applies to custom bands only when the band is on the same light/dark side as the page; otherwise it stays solid.
* Saving is blocked with a clear message if a custom colour is not a full hex value.

## Files changed
`src/lib/typography.ts` (Tone 'custom', `sectionCustom`, `bandFg`, `customBandsCss`), `src/lib/tone.ts`, `src/index.css` (`--page-bg`),
`src/components/admin/SectionTonesPanel.tsx`, `src/components/admin/TypographyAdmin.tsx`.
