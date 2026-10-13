// Typography & text-highlight settings (Admin → Typography & Highlights).
// Styling is applied with CSS variables + data-attributes (never per-element inline styles), and the matching
// rules live in index.css. With the defaults below NO attribute is set, so the site looks exactly as before.

import type { SectionId } from './sections';

/** Font id from FONT_OPTIONS ('theme' = keep the original font) */
export type HeadingFont = string;
export type HeadingSize = 'default' | 'sm' | 'lg' | 'xl';
export type HeadingCase = 'theme' | 'uppercase' | 'capitalize' | 'none';
export type ColorMode = 'default' | 'accent' | 'gradient';
export type UnderlineStyle = 'none' | 'solid' | 'gradient' | 'animated';
export type HighlightStyle = 'accent' | 'gradient' | 'background';

export interface SectionTypography {
  /** global = follow the setting above; otherwise override for this section only */
  color: 'global' | ColorMode;
  underline: boolean;
  highlight: boolean;
}

// ---- Section background tones -------------------------------------------------------------------------------------
// A tone is a *relative* background, so it follows the dark / light switch automatically:
//   soft    = barely lifted from the page background   (dark mode: charcoal   | light mode: soft white)
//   mid     = a clear grey band                        (dark mode: graphite   | light mode: light grey)
//   inverse = the opposite palette, text flips too     (dark mode: white band | light mode: black band)
export type Tone = 'none' | 'soft' | 'mid' | 'inverse' | 'custom';
export const TONES: { id: Tone; label: string; hint: string }[] = [
  { id: 'none', label: 'Page background', hint: 'No band (original look)' },
  { id: 'soft', label: 'Soft', hint: 'Charcoal / soft white' },
  { id: 'mid', label: 'Grey', hint: 'Graphite / light grey' },
  { id: 'inverse', label: 'Contrast', hint: 'White band in dark mode, black in light' },
  { id: 'custom', label: 'Custom', hint: 'Pick your own colour for dark and light mode' },
];
/** What each tone looks like in each mode (used by the admin swatches; the real colours live in index.css) */
export const TONE_SWATCH: Record<Tone, { dark: [string, string]; light: [string, string] }> = {
  none: { dark: ['#000000', '#ffffff'], light: ['#ffffff', '#0a0a0a'] },
  soft: { dark: ['#0e0e11', '#ffffff'], light: ['#f6f6f7', '#0a0a0a'] },
  mid: { dark: ['#1c1c20', '#ffffff'], light: ['#e8e8ec', '#0a0a0a'] },
  inverse: { dark: ['#ffffff', '#0a0a0a'], light: ['#0a0a0a', '#fafafa'] },
  custom: { dark: ['#1c1c20', '#ffffff'], light: ['#e8e8ec', '#0a0a0a'] }, // placeholder: the admin shows the section's own colours
};
/** A custom band: its own background colour in dark mode and in light mode (full #rrggbb). Text and cards flip automatically for contrast. */
export interface CustomBand { dark: string; light: string }
export type SectionCustom = Partial<Record<SectionId, CustomBand>>;
export type SectionTones = Partial<Record<SectionId, Tone>>;
/** Shipped by default: black hero, then grey / black / white bands so the sections are easy to tell apart. */
export const DEFAULT_SECTION_TONES: SectionTones = { hero: 'none', about: 'mid', skills: 'none', projects: 'soft', advertising: 'inverse', branding: 'none', contact: 'mid', footer: 'none' };
export const TONE_PRESETS: { name: string; hint: string; tones: SectionTones }[] = [
  { name: 'Black · Grey · White', hint: 'Recommended: all three bands', tones: DEFAULT_SECTION_TONES },
  { name: 'Subtle bands', hint: 'Alternating black and charcoal', tones: { hero: 'none', about: 'soft', skills: 'none', projects: 'soft', advertising: 'none', branding: 'soft', contact: 'none', footer: 'none' } },
  { name: 'Grey rhythm', hint: 'Black and grey, no white', tones: { hero: 'none', about: 'mid', skills: 'none', projects: 'mid', advertising: 'none', branding: 'mid', contact: 'none', footer: 'none' } },
  { name: 'Original (no bands)', hint: 'Plain page background everywhere', tones: {} },
];

// ---- Hero metric cards ---------------------------------------------------------------------------------------------
export interface MetricCardSettings {
  style: 'glass' | 'solid' | 'outline';
  entrance: 'rise' | 'fade' | 'scale' | 'flip' | 'none';
  /** Slow, gentle up-and-down drift */
  float: boolean;
  /** Lift + glow on hover */
  hover: boolean;
}
export const DEFAULT_METRIC_CARDS: MetricCardSettings = { style: 'glass', entrance: 'rise', float: true, hover: true };

// ---- Text roles: font, size, weight, case and a colour per theme for every kind of text -----------------------------
export type RoleId = 'heroEyebrow' | 'heroName' | 'heroSub' | 'metricValue' | 'metricLabel' | 'eyebrow' | 'secHeading' | 'secSub' | 'cardHeading' | 'body';
export type RoleCase = 'theme' | 'uppercase' | 'lowercase' | 'capitalize' | 'none';
export interface RoleStyle {
  font: string;
  /** Desktop size in px. 0 = original size. Smaller screens scale down automatically. */
  size: number;
  /** 0 = original weight */
  weight: number;
  case: RoleCase;
  /** '' = original colour. Dark-mode and light-mode colours are separate so the text stays readable in both. */
  colorD: string;
  colorL: string;
}
export const DEFAULT_ROLE: RoleStyle = { font: 'theme', size: 0, weight: 0, case: 'theme', colorD: '', colorL: '' };

export interface RoleDef {
  id: RoleId; label: string; hint: string; selector: string;
  /** Slider range and the approximate original size, in px. No `size` = this role is sized by the overall text-size slider. */
  size?: { min: number; max: number; def: number };
  sample: string; sampleClass: string;
}
export const ROLES: RoleDef[] = [
  { id: 'heroName', label: 'Hero name', hint: 'The big name at the top of the page', selector: '.tx-heroName', size: { min: 32, max: 160, def: 112 }, sample: 'Srikanth SR', sampleClass: 'text-4xl font-black tracking-tighter text-white' },
  { id: 'heroSub', label: 'Hero role line', hint: 'The line under the name', selector: '.tx-heroSub', size: { min: 12, max: 44, def: 24 }, sample: 'Digital marketing executive', sampleClass: 'text-lg font-medium tracking-widest uppercase text-zinc-300' },
  { id: 'heroEyebrow', label: 'Hero small label', hint: 'Small line above the name', selector: '.tx-heroEyebrow', size: { min: 9, max: 22, def: 12 }, sample: 'PORTFOLIO 2026', sampleClass: 'text-xs font-mono-code text-zinc-400' },
  { id: 'metricValue', label: 'Metric numbers', hint: '5,000+ · 4.2x · 4 Clients · 3 Brands', selector: '.tx-metricValue', size: { min: 16, max: 72, def: 30 }, sample: '4.2x', sampleClass: 'text-3xl font-extrabold text-white tabular-nums' },
  { id: 'metricLabel', label: 'Metric labels', hint: 'Giveaway viral followers · Blended Meta ROAS …', selector: '.tx-metricLabel', size: { min: 8, max: 20, def: 12 }, sample: 'Blended Meta ROAS', sampleClass: 'text-xs text-zinc-400 uppercase tracking-wider' },
  { id: 'eyebrow', label: 'Section small labels', hint: 'The small line above each section title', selector: '.tx-eyebrow', size: { min: 9, max: 22, def: 12 }, sample: '02 // WEBSITES & PRODUCTS', sampleClass: 'text-xs font-mono-code uppercase tracking-widest text-zinc-400' },
  { id: 'secHeading', label: 'Section titles', hint: 'ABOUT ME, SKILLS, MY OWN PROJECTS …', selector: '.sec-heading', size: { min: 20, max: 110, def: 48 }, sample: 'About me', sampleClass: 'text-4xl font-black uppercase tracking-tight text-white' },
  { id: 'secSub', label: 'Section subtitles', hint: 'The grey line under a section title', selector: '.tx-secSub', size: { min: 10, max: 28, def: 14 }, sample: 'A short line that explains this section', sampleClass: 'text-sm font-mono-code text-zinc-400' },
  { id: 'cardHeading', label: 'Card titles', hint: 'Project, campaign and skill-category titles', selector: '.card-heading', size: { min: 12, max: 44, def: 18 }, sample: 'Orderbix storefront', sampleClass: 'text-lg font-bold uppercase tracking-tight text-white' },
  { id: 'body', label: 'Paragraph text', hint: 'Bio, project and campaign descriptions. Size follows the overall text-size slider.', selector: '.tx-body', sample: 'Paragraph text used for the bio and descriptions across the page.', sampleClass: 'text-sm leading-relaxed text-zinc-300' },
];
export const ROLE_IDS = ROLES.map((r) => r.id);
export const roleStyle = (t: TypographySettings, id: RoleId): RoleStyle => ({ ...DEFAULT_ROLE, ...t.roles[id] });

export interface TypographySettings {
  headingFont: HeadingFont;
  /** 0 = use the font pair's own weight */
  headingWeight: number;
  headingSize: HeadingSize;
  headingCase: HeadingCase;
  headingColor: ColorMode;
  accent: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  underline: UnderlineStyle;
  underlineWidth: 'short' | 'full';
  highlightStyle: HighlightStyle;
  cardFont: HeadingFont;
  cardWeight: number;
  cardSize: 'default' | 'sm' | 'lg';
  cardColor: 'default' | 'accent';
  /** Card corner radius in px (site default: 20) */
  radius: number;
  perSection: Partial<Record<SectionId, SectionTypography>>;
  /** Background band per section (follows dark / light mode) */
  sectionTone: SectionTones;
  /** Colours for sections whose tone is 'custom' */
  sectionCustom: SectionCustom;
  /** flat = solid band; fade = band melts into the page background towards the bottom */
  toneStyle: 'flat' | 'fade';
  metricCards: MetricCardSettings;
  /** Per-text-type font / size / weight / case / colour */
  roles: Partial<Record<RoleId, RoleStyle>>;
  /** Overall text size in % (100 = original). Scales every rem-based size on the page. */
  baseScale: number;
}

export const DEFAULT_SECTION_TYPO: SectionTypography = { color: 'global', underline: true, highlight: true };

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  headingFont: 'theme', headingWeight: 0, headingSize: 'default', headingCase: 'theme', headingColor: 'default',
  accent: '#7c9cff', gradientFrom: '#7c9cff', gradientTo: '#c084fc', gradientAngle: 90,
  underline: 'none', underlineWidth: 'short', highlightStyle: 'accent',
  cardFont: 'theme', cardWeight: 0, cardSize: 'default', cardColor: 'default',
  radius: 20, perSection: {},
  sectionTone: DEFAULT_SECTION_TONES, sectionCustom: {}, toneStyle: 'flat', metricCards: DEFAULT_METRIC_CARDS, roles: {}, baseScale: 100,
};

export interface FontOption { id: string; label: string; stack: string; /** Google Fonts family spec. Absent = already loaded by index.html (or a system font) */ google?: string; group: 'Current site fonts' | 'Sans-serif' | 'Serif' | 'Display' | 'Monospace' }

export const FONT_OPTIONS: FontOption[] = [
  { id: 'theme', label: 'Follow the theme font pair', stack: '', group: 'Current site fonts' },
  { id: 'anton', label: 'Anton (condensed display)', stack: "'Anton', sans-serif", group: 'Current site fonts' },
  { id: 'syne', label: 'Syne (avant-garde)', stack: "'Syne', sans-serif", group: 'Current site fonts' },
  { id: 'space', label: 'Space Grotesk', stack: "'Space Grotesk', sans-serif", group: 'Current site fonts' },
  { id: 'cinzel', label: 'Cinzel (editorial serif)', stack: "'Cinzel', serif", group: 'Current site fonts' },
  { id: 'jakarta', label: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', sans-serif", group: 'Current site fonts' },
  { id: 'mono', label: 'JetBrains Mono', stack: "'JetBrains Mono', monospace", group: 'Current site fonts' },

  { id: 'inter', label: 'Inter', stack: "'Inter', sans-serif", google: 'Inter:wght@400;500;600;700;800;900', group: 'Sans-serif' },
  { id: 'poppins', label: 'Poppins', stack: "'Poppins', sans-serif", google: 'Poppins:wght@400;500;600;700;800;900', group: 'Sans-serif' },
  { id: 'montserrat', label: 'Montserrat', stack: "'Montserrat', sans-serif", google: 'Montserrat:wght@400;500;600;700;800;900', group: 'Sans-serif' },
  { id: 'manrope', label: 'Manrope', stack: "'Manrope', sans-serif", google: 'Manrope:wght@400;500;600;700;800', group: 'Sans-serif' },
  { id: 'sora', label: 'Sora', stack: "'Sora', sans-serif", google: 'Sora:wght@400;500;600;700;800', group: 'Sans-serif' },
  { id: 'outfit', label: 'Outfit', stack: "'Outfit', sans-serif", google: 'Outfit:wght@400;500;600;700;800;900', group: 'Sans-serif' },
  { id: 'urbanist', label: 'Urbanist', stack: "'Urbanist', sans-serif", google: 'Urbanist:wght@400;500;600;700;800;900', group: 'Sans-serif' },
  { id: 'dmsans', label: 'DM Sans', stack: "'DM Sans', sans-serif", google: 'DM+Sans:wght@400;500;600;700;800;900', group: 'Sans-serif' },
  { id: 'lexend', label: 'Lexend', stack: "'Lexend', sans-serif", google: 'Lexend:wght@400;500;600;700;800', group: 'Sans-serif' },
  { id: 'system', label: 'System UI (fastest)', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", group: 'Sans-serif' },

  { id: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', serif", google: 'Playfair+Display:wght@400;500;600;700;800;900', group: 'Serif' },
  { id: 'dmserif', label: 'DM Serif Display', stack: "'DM Serif Display', serif", google: 'DM+Serif+Display', group: 'Serif' },
  { id: 'fraunces', label: 'Fraunces', stack: "'Fraunces', serif", google: 'Fraunces:wght@400;600;700;900', group: 'Serif' },
  { id: 'cormorant', label: 'Cormorant Garamond', stack: "'Cormorant Garamond', serif", google: 'Cormorant+Garamond:wght@400;500;600;700', group: 'Serif' },
  { id: 'lora', label: 'Lora', stack: "'Lora', serif", google: 'Lora:wght@400;500;600;700', group: 'Serif' },
  { id: 'merriweather', label: 'Merriweather', stack: "'Merriweather', serif", google: 'Merriweather:wght@400;700;900', group: 'Serif' },

  { id: 'bebas', label: 'Bebas Neue (tall caps)', stack: "'Bebas Neue', sans-serif", google: 'Bebas+Neue', group: 'Display' },
  { id: 'oswald', label: 'Oswald (condensed)', stack: "'Oswald', sans-serif", google: 'Oswald:wght@400;500;600;700', group: 'Display' },
  { id: 'archivoblack', label: 'Archivo Black (heavy)', stack: "'Archivo Black', sans-serif", google: 'Archivo+Black', group: 'Display' },

  { id: 'firacode', label: 'Fira Code', stack: "'Fira Code', monospace", google: 'Fira+Code:wght@400;500;700', group: 'Monospace' },
  { id: 'spacemono', label: 'Space Mono', stack: "'Space Mono', monospace", google: 'Space+Mono:wght@400;700', group: 'Monospace' },
];
const stackOf = (id: HeadingFont) => FONT_OPTIONS.find((f) => f.id === id)?.stack ?? '';

export const GRADIENT_PRESETS: { name: string; from: string; to: string }[] = [
  { name: 'Ocean', from: '#38bdf8', to: '#6366f1' },
  { name: 'Sunset', from: '#fb923c', to: '#ec4899' },
  { name: 'Emerald', from: '#34d399', to: '#22d3ee' },
  { name: 'Violet', from: '#a78bfa', to: '#f472b6' },
  { name: 'Silver', from: '#ffffff', to: '#9ca3af' },
  { name: 'Gold', from: '#fde68a', to: '#f59e0b' },
];
export const ACCENT_PRESETS = ['#7c9cff', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#c084fc', '#ffffff'];

const HEX = /^#[0-9a-f]{6}$/i;
const pick = <T extends string>(v: unknown, allowed: readonly T[], fb: T): T => (allowed.includes(v as T) ? (v as T) : fb);
const hex = (v: unknown, fb: string) => (typeof v === 'string' && HEX.test(v) ? v : fb);
const num = (v: unknown, lo: number, hi: number, fb: number) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : fb; };
const WEIGHTS = [0, 400, 500, 600, 700, 800, 900];
const FONT_IDS = FONT_OPTIONS.map((f) => f.id);

const TONE_IDS: Tone[] = ['none', 'soft', 'mid', 'inverse', 'custom'];
/** No saved value yet (older save) = the shipped default bands. Saved but a section missing = no band for it. */
function normalizeTones(raw: unknown): SectionTones {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SECTION_TONES };
  const out: SectionTones = {};
  for (const [k, v] of Object.entries<any>(raw as Record<string, any>)) if (TONE_IDS.includes(v)) out[k as SectionId] = v;
  return out;
}
function normalizeCustom(raw: unknown): SectionCustom {
  const out: SectionCustom = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries<any>(raw as Record<string, any>)) {
    if (v && typeof v === 'object' && HEX.test(v.dark) && HEX.test(v.light)) out[k as SectionId] = { dark: v.dark.toLowerCase(), light: v.light.toLowerCase() };
  }
  return out;
}
function normalizeMetricCards(raw: unknown): MetricCardSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const d = DEFAULT_METRIC_CARDS;
  return {
    style: pick(r.style, ['glass', 'solid', 'outline'] as const, d.style),
    entrance: pick(r.entrance, ['rise', 'fade', 'scale', 'flip', 'none'] as const, d.entrance),
    float: typeof r.float === 'boolean' ? r.float : d.float,
    hover: typeof r.hover === 'boolean' ? r.hover : d.hover,
  };
}
function normalizeRoles(raw: unknown): TypographySettings['roles'] {
  const out: TypographySettings['roles'] = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const def of ROLES) {
    const v = (raw as Record<string, any>)[def.id];
    if (!v || typeof v !== 'object') continue;
    const w = Number(v.weight);
    out[def.id] = {
      font: FONT_IDS.includes(v.font) ? v.font : 'theme',
      size: def.size ? num(v.size, 0, def.size.max, 0) : 0,
      weight: WEIGHTS.includes(w) ? w : 0,
      case: pick(v.case, ['theme', 'uppercase', 'lowercase', 'capitalize', 'none'] as const, 'theme'),
      colorD: hex(v.colorD, ''), colorL: hex(v.colorL, ''),
    };
  }
  return out;
}

/** Accepts anything from the database; unknown/invalid values fall back to the defaults. */
export function normalizeTypography(raw: unknown): TypographySettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const d = DEFAULT_TYPOGRAPHY;
  const perSection: TypographySettings['perSection'] = {};
  if (r.perSection && typeof r.perSection === 'object') {
    for (const [k, v] of Object.entries<any>(r.perSection)) {
      if (!v || typeof v !== 'object') continue;
      perSection[k as SectionId] = {
        color: pick(v.color, ['global', 'default', 'accent', 'gradient'] as const, 'global'),
        underline: v.underline !== false, highlight: v.highlight !== false,
      };
    }
  }
  const w = Number(r.headingWeight), cw = Number(r.cardWeight);
  const sectionCustom = normalizeCustom(r.sectionCustom);
  const sectionTone = normalizeTones(r.sectionTone);
  // a 'custom' tone without usable colours falls back to the plain page background
  for (const k of Object.keys(sectionTone) as SectionId[]) if (sectionTone[k] === 'custom' && !sectionCustom[k]) delete sectionTone[k];
  return {
    headingFont: pick(r.headingFont, FONT_IDS, d.headingFont),
    headingWeight: WEIGHTS.includes(w) ? w : 0,
    headingSize: pick(r.headingSize, ['default', 'sm', 'lg', 'xl'] as const, 'default'),
    headingCase: pick(r.headingCase, ['theme', 'uppercase', 'capitalize', 'none'] as const, 'theme'),
    headingColor: pick(r.headingColor, ['default', 'accent', 'gradient'] as const, 'default'),
    accent: hex(r.accent, d.accent), gradientFrom: hex(r.gradientFrom, d.gradientFrom), gradientTo: hex(r.gradientTo, d.gradientTo),
    gradientAngle: num(r.gradientAngle, 0, 360, d.gradientAngle),
    underline: pick(r.underline, ['none', 'solid', 'gradient', 'animated'] as const, 'none'),
    underlineWidth: pick(r.underlineWidth, ['short', 'full'] as const, 'short'),
    highlightStyle: pick(r.highlightStyle, ['accent', 'gradient', 'background'] as const, 'accent'),
    cardFont: pick(r.cardFont, FONT_IDS, d.cardFont),
    cardWeight: WEIGHTS.includes(cw) ? cw : 0,
    cardSize: pick(r.cardSize, ['default', 'sm', 'lg'] as const, 'default'),
    cardColor: pick(r.cardColor, ['default', 'accent'] as const, 'default'),
    radius: num(r.radius, 0, 40, d.radius),
    perSection,
    sectionTone, sectionCustom,
    toneStyle: pick(r.toneStyle, ['flat', 'fade'] as const, 'flat'),
    metricCards: normalizeMetricCards(r.metricCards),
    roles: normalizeRoles(r.roles),
    baseScale: num(r.baseScale, 85, 130, 100),
  };
}

export const sectionTypo = (t: TypographySettings, id: SectionId): SectionTypography => ({ ...DEFAULT_SECTION_TYPO, ...t.perSection[id] });

/** data-attributes + CSS variables for a root (or preview) element. Absent attribute = "keep the original look". */
export function typographyToDom(t: TypographySettings): { attrs: Record<string, string>; vars: Record<string, string> } {
  const attrs: Record<string, string> = {};
  const vars: Record<string, string> = {
    '--t-accent': t.accent, '--t-grad-from': t.gradientFrom, '--t-grad-to': t.gradientTo,
    '--t-grad-angle': `${t.gradientAngle}deg`, '--radius-card': `${t.radius}px`,
    '--t-ul-w': t.underlineWidth === 'full' ? '100%' : '3.5rem',
  };
  if (t.headingFont !== 'theme') { attrs['data-t-font'] = '1'; vars['--t-font'] = stackOf(t.headingFont); }
  if (t.headingWeight) { attrs['data-t-weight'] = '1'; vars['--t-weight'] = String(t.headingWeight); }
  if (t.headingSize !== 'default') attrs['data-t-size'] = t.headingSize;
  if (t.headingCase !== 'theme') { attrs['data-t-case'] = '1'; vars['--t-case'] = t.headingCase; }
  if (t.underline !== 'none') attrs['data-t-ul'] = t.underline;
  attrs['data-t-hl'] = t.highlightStyle;
  if (t.cardFont !== 'theme') { attrs['data-c-font'] = '1'; vars['--c-font'] = stackOf(t.cardFont); }
  if (t.cardWeight) { attrs['data-c-weight'] = '1'; vars['--c-weight'] = String(t.cardWeight); }
  if (t.cardSize !== 'default') attrs['data-c-size'] = t.cardSize;
  if (t.cardColor === 'accent') attrs['data-c-color'] = 'accent';
  return { attrs, vars };
}

const ALL_ATTRS = ['data-t-font', 'data-t-weight', 'data-t-size', 'data-t-case', 'data-t-ul', 'data-t-hl', 'data-c-font', 'data-c-weight', 'data-c-size', 'data-c-color'];
const ALL_VARS = ['--t-accent', '--t-grad-from', '--t-grad-to', '--t-grad-angle', '--radius-card', '--t-ul-w', '--t-font', '--t-weight', '--t-case', '--c-font', '--c-weight'];

// ---- Google font loading: only fonts that are actually chosen are downloaded -------------------------------------------
const loadedFonts = new Set<string>();
export function ensureFont(id: string) {
  if (typeof document === 'undefined' || loadedFonts.has(id)) return;
  const f = FONT_OPTIONS.find((o) => o.id === id);
  if (!f?.google) return;
  loadedFonts.add(id);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
  link.dataset.siteFont = id;
  document.head.appendChild(link);
}
export function ensureFontsFor(t: TypographySettings) {
  [t.headingFont, t.cardFont, ...ROLE_IDS.map((r) => roleStyle(t, r).font)].forEach((id) => id !== 'theme' && ensureFont(id));
}

// ---- Colour contrast (WCAG) so a colour that is unreadable on the page is flagged in the admin -----------------------
const lum = (h: string) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export function contrastRatio(a: string, b: string): number {
  if (!HEX.test(a) || !HEX.test(b)) return 0;
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/**
 * The CSS for the per-role text styles. Only values that differ from the original produce a rule, so with the defaults
 * this returns an empty string and the original design is untouched.
 *  - scope ':root'  : the public site. Dark colour applies in dark mode, light colour in light mode.
 *                     Inside a "contrast" band the palette is flipped, so the other mode's colour is used there.
 *  - other scope    : admin preview. `mode` picks which of the two colours that preview box shows.
 */
export function rolesToCss(t: TypographySettings, scope: string = ':root', mode: 'site' | 'dark' | 'light' = 'site'): string {
  const out: string[] = [];
  for (const def of ROLES) {
    const r = roleStyle(t, def.id);
    const sel = `${scope} ${def.selector}`;
    const decl: string[] = [];
    if (r.font !== 'theme') decl.push(`font-family:${stackOf(r.font)}`);
    if (r.weight) decl.push(`font-weight:${r.weight}`);
    // The hero name has an inline clamp(), so it needs !important. Small screens scale the size down automatically.
    if (r.size && def.size) {
      // Site: small screens scale the size down. Admin previews: scale to the preview box instead (container units).
      const fit = mode === 'site' ? `calc(${(r.size * 0.5).toFixed(1)}px + 4vw)` : '11cqw';
      decl.push(`font-size:min(${r.size}px, ${fit})${def.id === 'heroName' ? ' !important' : ''}`);
    }
    if (r.case !== 'theme') decl.push(`text-transform:${r.case}`);
    if (decl.length) out.push(`${sel}{${decl.join(';')}}`);

    const guard = def.id === 'secHeading' ? ":not([data-hc='gradient'])" : ''; // gradient headings keep their transparent fill
    if (mode === 'dark' && r.colorD) out.push(`${sel}${guard}{color:${r.colorD}}`);
    else if (mode === 'light' && r.colorL) out.push(`${sel}${guard}{color:${r.colorL}}`);
    else if (mode === 'site' && (r.colorD || r.colorL)) {
      const dk = ":root:not([data-theme='light'])", lt = ":root[data-theme='light']";
      if (r.colorD) out.push(`${dk} ${def.selector}${guard}{color:${r.colorD}}`);
      if (r.colorL) out.push(`${lt} ${def.selector}${guard}{color:${r.colorL}}`);
      // "Contrast" bands flip the palette, so the colour made for the opposite mode is the readable one there.
      out.push(`${dk} [data-tone='inverse'] ${def.selector}${guard}{color:${r.colorL || 'revert-layer'}}`);
      out.push(`${lt} [data-tone='inverse'] ${def.selector}${guard}{color:${r.colorD || 'revert-layer'}}`);
    }
  }
  return out.join('\n');
}

// ---- Custom section backgrounds ------------------------------------------------------------------------------------
// The two palettes the site already uses (same values as index.css). A custom band picks one of them from its own colour,
// so every text / border / card colour inside the band stays readable whatever colour was chosen.
const PAL_DARK = "color-scheme:dark;--text-color:#fafafa;--card-bg:#09090b;--card-border:rgba(255,255,255,.12);--accent-btn:#ffffff;--accent-btn-text:#000000;--fg-rgb:255 255 255;--color-white:#ffffff;--color-black:#000000;--color-zinc-50:#fafafa;--color-zinc-100:#f4f4f5;--color-zinc-200:#e4e4e7;--color-zinc-300:#d4d4d8;--color-zinc-400:#9f9fa9;--color-zinc-500:#71717b;--color-zinc-600:#52525c;--color-zinc-700:#3f3f47;--color-zinc-800:#27272a;--color-zinc-900:#18181b;--color-zinc-950:#09090b;";
const PAL_LIGHT = "color-scheme:light;--text-color:#0a0a0a;--card-bg:#f4f4f5;--card-border:rgba(10,10,10,.14);--accent-btn:#0a0a0a;--accent-btn-text:#ffffff;--fg-rgb:10 10 10;--color-white:#0a0a0a;--color-black:#ffffff;--color-zinc-50:#09090b;--color-zinc-100:#18181b;--color-zinc-200:#27272a;--color-zinc-300:#3f3f46;--color-zinc-400:#52525b;--color-zinc-500:#6b6b76;--color-zinc-600:#8a8a94;--color-zinc-700:#c4c4cc;--color-zinc-800:#e4e4e7;--color-zinc-900:#f0f0f2;--color-zinc-950:#f8f8f9;";

/** Which text palette is readable on this background: 'light' = white-ish text, 'dark' = black-ish text */
export function bandFg(bg: string): 'light' | 'dark' {
  return contrastRatio(bg, '#fafafa') >= contrastRatio(bg, '#0a0a0a') ? 'light' : 'dark';
}

/** CSS for every section whose tone is 'custom'. Scoped by theme, so dark and light mode each get their own colour. */
export function customBandsCss(t: TypographySettings): string {
  const out: string[] = [];
  const dk = ":root:not([data-theme='light'])", lt = ":root[data-theme='light']";
  for (const id of Object.keys(t.sectionCustom) as SectionId[]) {
    const c = t.sectionCustom[id];
    if (!c || t.sectionTone[id] !== 'custom') continue;
    for (const [mode, hexv] of [['dark', c.dark], ['light', c.light]] as const) {
      const pref = mode === 'dark' ? dk : lt;
      const fg = bandFg(hexv);
      const sel = `${pref} [data-tone='custom'][data-tone-id='${id}']`;
      // fade only when the band shares the page's light/dark side; otherwise the band stays solid so text never sits on the wrong colour
      const fade = t.toneStyle === 'fade' && ((mode === 'dark' && fg === 'light') || (mode === 'light' && fg === 'dark'));
      out.push(`${sel}{background-color:${hexv};color:${fg === 'light' ? '#fafafa' : '#0a0a0a'};--bg-color:${hexv};${fg === 'light' ? PAL_DARK : PAL_LIGHT}${fade ? `background-image:linear-gradient(180deg,${hexv} 0%,var(--page-bg) 100%);` : ''}}`);
      // custom text colours are per mode: where the band flips the palette, use the colour made for the other mode
      const flipped = (mode === 'dark' && fg === 'dark') || (mode === 'light' && fg === 'light');
      if (!flipped) continue;
      for (const def of ROLES) {
        const r = roleStyle(t, def.id);
        if (!r.colorD && !r.colorL) continue;
        const guard = def.id === 'secHeading' ? ":not([data-hc='gradient'])" : '';
        const want = mode === 'dark' ? r.colorL : r.colorD;
        out.push(`${sel} ${def.selector}${guard}{color:${want || 'revert-layer'}}`);
      }
    }
  }
  return out.join('\n');
}

const STYLE_ID = 'site-typography-roles';

export function applyTypography(el: HTMLElement, t: TypographySettings) {
  const { attrs, vars } = typographyToDom(t);
  ALL_ATTRS.forEach((a) => (a in attrs ? el.setAttribute(a, attrs[a]) : el.removeAttribute(a)));
  ALL_VARS.forEach((v) => (v in vars ? el.style.setProperty(v, vars[v]) : el.style.removeProperty(v)));
  el.style.fontSize = t.baseScale === 100 ? '' : `${t.baseScale}%`;

  ensureFontsFor(t);
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) { style = document.createElement('style'); style.id = STYLE_ID; document.head.appendChild(style); }
  style.textContent = rolesToCss(t) + '\n' + customBandsCss(t);
}

/** Per-heading attributes (colour mode / underline / highlight) resolved from the global + per-section settings. */
export function headingAttrs(t: TypographySettings, id: SectionId) {
  const s = sectionTypo(t, id);
  const color = s.color === 'global' ? t.headingColor : s.color;
  return { color, underline: s.underline, highlight: s.highlight };
}
