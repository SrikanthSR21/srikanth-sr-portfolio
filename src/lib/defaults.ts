// Every string that used to be hard-coded in JSX now has a default here.
// The database overrides these; if the DB is empty/unreachable the site looks exactly as before.

import type { ThemeSettings } from '../types';
import { DEFAULT_LAYOUT } from './sections';

export interface NavItem {
  id: string;
  label: string;
  href: string;            // "#about", "https://…", "/page"
  kind: 'link' | 'resume'; // "resume" opens the CV modal (the underlined "Resume (Download)" item)
  visible: boolean;
}
export interface HeroMetric { id: string; value: string; label: string }
export interface ClientLogo { id: string; name: string; symbol: string }
export interface SiteImages {
  profile: string;
  /** Set by the uploader when the portrait has a transparent background */
  profileTransparent?: boolean;
  /** auto = cut-out layout for transparent images, framed arch otherwise */
  profileDisplay?: 'auto' | 'framed' | 'cutout';
}

export const DEFAULT_ENQUIRY_TYPES: string[] = [
  'Website Development', 'SEO', 'Google Ads', 'Meta Ads', 'Social Media Marketing', 'Portfolio Website',
];
export { DEFAULT_LAYOUT };

export const DEFAULT_NAV: NavItem[] = [
  { id: 'n1', label: 'Home',        href: '#home',        kind: 'link',   visible: true },
  { id: 'n2', label: 'About',       href: '#about',       kind: 'link',   visible: true },
  { id: 'n3', label: 'Projects',    href: '#projects',    kind: 'link',   visible: true },
  { id: 'n4', label: 'Advertising', href: '#advertising', kind: 'link',   visible: true },
  { id: 'n5', label: 'Experience',  href: '#experience',  kind: 'link',   visible: true },
  { id: 'n6', label: 'Branding',    href: '#branding',    kind: 'link',   visible: true },
  { id: 'n7', label: 'Contact',     href: '#contact',     kind: 'link',   visible: true },
  { id: 'n8', label: 'Resume (Download)', href: '', kind: 'resume', visible: true },
];

export const DEFAULT_HERO_METRICS: HeroMetric[] = [
  { id: 'm1', value: '5,000+',   label: 'Giveaway Viral Followers' },
  { id: 'm2', value: '4.2x',     label: 'Blended Meta ROAS' },
  { id: 'm3', value: '4 Clients', label: 'Ranked #1 on Google' },
  { id: 'm4', value: '3 Brands', label: 'CyberBix In-House GTM' },
];

export const DEFAULT_THEME: ThemeSettings = {
  backgroundMode: 'true-black',
  customBg: '#000000',
  customText: '#ffffff',
  customAccent: '#ffffff',
  fontPairId: 'anton-jakarta',
  heroAnimation: 'grid',
  defaultMode: 'dark',
};

export const DEFAULT_IMAGES: SiteImages = { profile: '' }; // '' = use the bundled portrait

// Flat key → text map. Add a key here + use t('key') in a component and it appears in the admin automatically.
export const DEFAULT_TEXTS: Record<string, string> = {
  'seo.title': 'Morgan Maxwell | Creative Developer & Ads Strategist Portfolio',
  'seo.description': 'Portfolio featuring live project cards, advertising case studies, branding and direct WhatsApp routing.',


  'hero.eyebrow': 'PORTFOLIO 2026',
  'hero.viewAsReal': 'View as: Srikanth SR',
  'hero.viewAsPersona': 'View as: Morgan Maxwell',
  'hero.ctaPrimary': 'EXPLORE MY WORK',
  'hero.ctaSecondary': 'DOWNLOAD FULL CV',
  'hero.scroll': 'Scroll',

  'about.eyebrow': '01 // BIOGRAPHY & EXECUTIVE PROFILE',
  'about.title': 'ABOUT ME',
  'about.subtitle': '',
  'about.skillsLabel': 'CORE CAPABILITIES',
  'about.educationLabel': 'Academic Background',
  'about.certLabel': 'Specialist Certification',
  'about.relocationTag': 'Open to UAE & Global Relocation',
  'about.cvButton': 'DOWNLOAD FULL CV',

  'projects.eyebrow': '02 // WEBSITES & PRODUCTS I HAVE BUILT',
  'projects.title': 'MY OWN PROJECTS',
  'projects.subtitle': 'LIVE CARD GALLERY · VIBRANT FULL-COLOR HERO PREVIEWS ON MATTE BLACK',
  'projects.viewSite': 'VIEW SITE',
  'projects.sourceCode': 'Source code',

  'ads.eyebrow': '03 // PAID MEDIA, ROAS & SEARCH ENGINE AUDITS',
  'ads.title': 'ADVERTISING PORTFOLIO',
  'ads.subtitle': '',

  'branding.eyebrow': '04 // BRANDING & PRODUCTION TIMELINE',
  'branding.title': 'BRANDING & WORK EXPERIENCE',
  'branding.subtitle': '',
  'branding.brandsLabel': "BRANDS I'VE HANDLED",
  'branding.brandsMeta': '10+ VENTURES · MONOCHROME TICKER',
  'branding.historyLabel': 'WORK HISTORY',
  'branding.historyMeta': '2025 — PRESENT (CHRONOLOGICAL)',
  'branding.frameTitle': 'CYBERFIX',
  'branding.frameKicker': 'CYBERBIX IN-HOUSE VENTURES',
  'branding.frameBody': 'Spearheading comprehensive brand architectures, AI-assisted visual guidelines, and direct growth engines for high-impact social commerce.',
  'branding.frameStat1Label': 'Brands Built',
  'branding.frameStat1Value': 'Orderbix · 6thLoom',
  'branding.frameStat2Label': 'Active Status',
  'branding.frameStat2Value': 'Current Role',

  'contact.eyebrow': '06 // DIRECT ROUTING & CLIENT INTAKE',
  'contact.title': "LET'S BUILD SOMETHING AMAZING",
  'contact.subtitle': 'Or reach out on social.',
  'contact.nameLabel': 'Your Name',
  'contact.emailLabel': 'Your Email',
  'contact.typeLabel': 'Enquiry Type (optional)',
  'contact.messageLabel': 'Message',
  'contact.messagePlaceholder': 'Tell me what you need, your timeline, or anything else that helps…',
  'contact.submit': 'SEND MESSAGE',
  'contact.successTitle': 'MESSAGE SENT',
  'contact.hint': 'Goes straight to my admin inbox',

  'footer.tagline': '',
  'footer.linksTitle': 'EXPLORE',
  'footer.contactTitle': 'CONTACT',
  'footer.arch': '2026 ARCHITECTURE',
  'footer.top': 'BACK TO TOP',
  'footer.cv': 'VIEW CV',
};
