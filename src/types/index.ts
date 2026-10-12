export type BackgroundTheme = 'true-black' | 'midnight-black' | 'custom';

export type HeroAnimationMode = 'grid' | 'waterfall' | 'circles';

export interface FontPairOption {
  id: string;
  name: string;
  headlineFont: string;
  headlineClass: string;
  bodyFont: string;
  bodyClass: string;
  description: string;
}

export interface ThemeSettings {
  backgroundMode: BackgroundTheme;
  customBg: string;
  customText: string;
  customAccent: string;
  fontPairId: string;
  heroAnimation: HeroAnimationMode;
  /** Default for first-time visitors. A visitor's own toggle (stored in their browser) always wins. */
  defaultMode?: 'dark' | 'light' | 'system';
}

export interface ProjectItem {
  id: string;
  title: string;
  client: string;
  category: string;
  role: string;
  shortDesc: string;
  fullDesc: string;
  heroImage: string;
  liveUrl: string;
  /** Optional link to the source code (GitHub etc.) */
  sourceUrl?: string;
  year: string;
  /** Skills / technologies used */
  tags: string[];
  metrics: string;
  /** false = hidden on the public site (content is kept). Missing = visible. */
  visible?: boolean;
}

export interface AdCampaignItem {
  id: string;
  title: string;
  clientBrand: string;
  /** Free text so new work types (Social Media, Website Optimization, Reports…) can be added. */
  platform: string;
  /** false = hidden on the public site. Missing = visible. */
  visible?: boolean;
  metricHeadline: string;
  summary: string;
  hasScreenshot: boolean;
  screenshotImage?: string;
  achievements: string[];
  keyStats: {
    label: string;
    value: string;
  }[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  isCurrent?: boolean;
  summary: string;
  achievements: string[];
}

export interface TicketItem {
  id: string;
  clientName: string;
  clientEmail: string;
  message: string;
  /** Enquiry type (selected suggestion or the visitor's own text) */
  service?: string;
  /** Legacy: the old form collected a budget. Kept so historical messages still display it. */
  budget?: string;
  status: 'New' | 'In Review' | 'In Progress' | 'Resolved';
  /** YYYY-MM-DD */
  date: string;
  /** Full ISO timestamp */
  createdAt?: string;
  whatsappStatus?: 'sent' | 'failed' | 'skipped' | null;
}

export interface PortfolioInfo {
  personaName: string;
  realName: string;
  roleTitle: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  linkedin: string;
  githubPortfolioUrl: string;
  instagram?: string;
  resumeUrl?: string;
  aboutBio: string;
  skills: {
    category: string;
    items: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  certifications: string[];
}
