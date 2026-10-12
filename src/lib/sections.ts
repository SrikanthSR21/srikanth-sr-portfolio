// Section registry: the ONLY place that knows which sections exist.
// The public page renders whatever order/visibility is saved in site_content.layout,
// but only ids listed here are ever rendered, so stored data can never inject arbitrary code.

export type SectionId = 'hero' | 'about' | 'projects' | 'advertising' | 'branding' | 'contact' | 'footer';

export interface SectionConfig {
  id: SectionId;
  /** Name shown in the admin (and used as an accessible label). */
  label: string;
  visible: boolean;
}

export interface SectionTextField { key: string; label: string; multiline?: boolean }
export interface SectionMeta {
  defaultLabel: string;
  description: string;
  /** Editable texts (keys live in DEFAULT_TEXTS / site_content.texts) */
  textFields: SectionTextField[];
  /** URL hashes that point inside this section (used to hide nav links to hidden sections) */
  anchors: string[];
}

export const SECTION_REGISTRY: Record<SectionId, SectionMeta> = {
  hero: {
    defaultLabel: 'Hero',
    description: 'Top banner: name, role, buttons and headline metrics. The heading and sub-text are edited under Hero, Contact & Social.',
    textFields: [
      { key: 'hero.eyebrow', label: 'Eyebrow' },
      { key: 'hero.ctaPrimary', label: 'Primary button' },
      { key: 'hero.ctaSecondary', label: 'Secondary button' },
    ],
    anchors: ['home'],
  },
  about: {
    defaultLabel: 'About Me',
    description: 'Portrait, biography, education and skills.',
    textFields: [
      { key: 'about.eyebrow', label: 'Eyebrow' },
      { key: 'about.title', label: 'Title' },
      { key: 'about.subtitle', label: 'Subtitle', multiline: true },
    ],
    anchors: ['about'],
  },
  projects: {
    defaultLabel: 'My Own Projects',
    description: 'Websites and products you built yourself (Admin → Projects).',
    textFields: [
      { key: 'projects.eyebrow', label: 'Eyebrow' },
      { key: 'projects.title', label: 'Title' },
      { key: 'projects.subtitle', label: 'Subtitle', multiline: true },
    ],
    anchors: ['projects'],
  },
  advertising: {
    defaultLabel: 'Advertising Portfolio',
    description: 'Work done for companies and clients: SEO, Google Ads, Meta Ads, reports… (Admin → Advertising).',
    textFields: [
      { key: 'ads.eyebrow', label: 'Eyebrow' },
      { key: 'ads.title', label: 'Title' },
      { key: 'ads.subtitle', label: 'Subtitle', multiline: true },
    ],
    anchors: ['advertising'],
  },
  branding: {
    defaultLabel: 'Branding & Work Experience',
    description: 'Brand ticker, in-house ventures frame and work-history timeline.',
    textFields: [
      { key: 'branding.eyebrow', label: 'Eyebrow' },
      { key: 'branding.title', label: 'Title' },
      { key: 'branding.subtitle', label: 'Subtitle', multiline: true },
      { key: 'branding.brandsLabel', label: 'Brand ticker heading' },
      { key: 'branding.brandsMeta', label: 'Brand ticker note' },
      { key: 'branding.historyLabel', label: 'Work-history heading' },
    ],
    anchors: ['branding', 'experience'],
  },
  contact: {
    defaultLabel: 'Contact',
    description: 'Enquiry form. Messages land in Admin → Inbox and are forwarded to WhatsApp when configured.',
    textFields: [
      { key: 'contact.eyebrow', label: 'Eyebrow' },
      { key: 'contact.title', label: 'Title' },
      { key: 'contact.subtitle', label: 'Subtitle', multiline: true },
    ],
    anchors: ['contact'],
  },
  footer: {
    defaultLabel: 'Footer',
    description: 'Closing block with links and contact details.',
    textFields: [
      { key: 'footer.tagline', label: 'Tagline (empty = hero sub-text)', multiline: true },
      { key: 'footer.linksTitle', label: 'Links heading' },
      { key: 'footer.contactTitle', label: 'Contact heading' },
      { key: 'footer.arch', label: 'Copyright / signature line' },
      { key: 'footer.top', label: '"Back to top" label' },
      { key: 'footer.cv', label: '"View CV" label' },
    ],
    anchors: [],
  },
};

export const SECTION_IDS = Object.keys(SECTION_REGISTRY) as SectionId[];

export const DEFAULT_LAYOUT: SectionConfig[] = [
  'hero', 'about', 'projects', 'advertising', 'branding', 'contact', 'footer',
].map((id) => ({ id: id as SectionId, label: SECTION_REGISTRY[id as SectionId].defaultLabel, visible: true }));

/** Accepts anything read from the database and returns a safe, complete layout:
 *  unknown ids dropped, duplicates removed, sections missing from the saved data appended (visible). */
export function normalizeLayout(raw: unknown): SectionConfig[] {
  const seen = new Set<SectionId>();
  const out: SectionConfig[] = [];
  if (Array.isArray(raw)) {
    for (const r of raw) {
      const id = (r as any)?.id as SectionId;
      if (!SECTION_IDS.includes(id) || seen.has(id)) continue;
      seen.add(id);
      const label = typeof (r as any).label === 'string' && (r as any).label.trim()
        ? (r as any).label.trim().slice(0, 80) : SECTION_REGISTRY[id].defaultLabel;
      out.push({ id, label, visible: (r as any).visible !== false });
    }
  }
  for (const d of DEFAULT_LAYOUT) if (!seen.has(d.id)) out.push({ ...d });
  return out;
}

/** "#projects" → "projects"; returns the section that owns this link, if any */
export function sectionForHref(href: string): SectionId | null {
  const hash = href.startsWith('#') ? href.slice(1) : '';
  if (!hash) return null;
  return SECTION_IDS.find((id) => SECTION_REGISTRY[id].anchors.includes(hash)) ?? null;
}
