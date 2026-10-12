// Typography & text-highlight settings (Admin → Typography & Highlights).
// Styling is applied with CSS variables + data-attributes (never per-element inline styles), and the matching
// rules live in index.css. With the defaults below NO attribute is set, so the site looks exactly as before.

import type { SectionId } from './sections';

export type HeadingFont = 'theme' | 'anton' | 'syne' | 'space' | 'cinzel' | 'jakarta' | 'mono';
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
}

export const DEFAULT_SECTION_TYPO: SectionTypography = { color: 'global', underline: true, highlight: true };

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  headingFont: 'theme', headingWeight: 0, headingSize: 'default', headingCase: 'theme', headingColor: 'default',
  accent: '#7c9cff', gradientFrom: '#7c9cff', gradientTo: '#c084fc', gradientAngle: 90,
  underline: 'none', underlineWidth: 'short', highlightStyle: 'accent',
  cardFont: 'theme', cardWeight: 0, cardSize: 'default', cardColor: 'default',
  radius: 20, perSection: {},
};

export const FONT_OPTIONS: { id: HeadingFont; label: string; stack: string }[] = [
  { id: 'theme', label: 'Follow the theme font pair', stack: '' },
  { id: 'anton', label: 'Anton (condensed display)', stack: "'Anton', sans-serif" },
  { id: 'syne', label: 'Syne (avant-garde)', stack: "'Syne', sans-serif" },
  { id: 'space', label: 'Space Grotesk', stack: "'Space Grotesk', sans-serif" },
  { id: 'cinzel', label: 'Cinzel (editorial serif)', stack: "'Cinzel', serif" },
  { id: 'jakarta', label: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', sans-serif" },
  { id: 'mono', label: 'JetBrains Mono', stack: "'JetBrains Mono', monospace" },
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

export function applyTypography(el: HTMLElement, t: TypographySettings) {
  const { attrs, vars } = typographyToDom(t);
  ALL_ATTRS.forEach((a) => (a in attrs ? el.setAttribute(a, attrs[a]) : el.removeAttribute(a)));
  ALL_VARS.forEach((v) => (v in vars ? el.style.setProperty(v, vars[v]) : el.style.removeProperty(v)));
}

/** Per-heading attributes (colour mode / underline / highlight) resolved from the global + per-section settings. */
export function headingAttrs(t: TypographySettings, id: SectionId) {
  const s = sectionTypo(t, id);
  const color = s.color === 'global' ? t.headingColor : s.color;
  return { color, underline: s.underline, highlight: s.highlight };
}
