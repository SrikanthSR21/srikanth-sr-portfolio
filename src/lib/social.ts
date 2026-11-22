// Everything about social profiles + Instagram reels that is NOT React: platform list, URL checks, safe read-time clean-up.
// Data is stored in the existing `site_content` table (keys `social_profiles`, `reels`), so no database migration is needed.

import { Facebook, Globe, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReelItem, SocialPlatform, SocialProfile } from '../types';
import { httpUrl } from './links';

export const PLATFORMS: { id: SocialPlatform; label: string; hosts: string[]; icon: LucideIcon; example: string }[] = [
  { id: 'instagram', label: 'Instagram', hosts: ['instagram.com'], icon: Instagram, example: 'https://www.instagram.com/brandname/' },
  { id: 'linkedin', label: 'LinkedIn', hosts: ['linkedin.com'], icon: Linkedin, example: 'https://www.linkedin.com/company/brandname/' },
  { id: 'facebook', label: 'Facebook', hosts: ['facebook.com', 'fb.com'], icon: Facebook, example: 'https://www.facebook.com/brandname' },
  { id: 'youtube', label: 'YouTube', hosts: ['youtube.com', 'youtu.be'], icon: Youtube, example: 'https://www.youtube.com/@brandname' },
  { id: 'x', label: 'X (Twitter)', hosts: ['x.com', 'twitter.com'], icon: Twitter, example: 'https://x.com/brandname' },
  { id: 'other', label: 'Other', hosts: [], icon: Globe, example: 'https://…' },
];
export const platformMeta = (id: string) => PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[PLATFORMS.length - 1];

const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./i, '').toLowerCase(); } catch { return ''; } };

/** true when the link belongs to the chosen platform ("other" accepts any web link) */
export function urlMatchesPlatform(url: string, platform: SocialPlatform): boolean {
  const meta = platformMeta(platform);
  if (!meta.hosts.length) return true;
  const h = hostOf(url);
  return meta.hosts.some((x) => h === x || h.endsWith(`.${x}`));
}

export const cleanHandle = (v: string) => v.trim().replace(/^@+/, '').replace(/\s+/g, '').slice(0, 60);
export const isImageUrl = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//i.test(v.trim());
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/** "2026-11-21" → "21 Nov 2026"; anything else → '' */
export function formatAsOf(v: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return '';
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Anything read from the database → a safe, complete list. Bad rows are dropped, never rendered. */
export function normalizeProfiles(raw: unknown): SocialProfile[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: SocialProfile[] = [];
  for (const r of raw as any[]) {
    if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id || seen.has(r.id)) continue;
    seen.add(r.id);
    const platform = PLATFORMS.some((p) => p.id === r.platform) ? (r.platform as SocialPlatform) : 'other';
    out.push({
      id: r.id, platform, name: str(r.name, 80), handle: cleanHandle(str(r.handle, 80)), url: str(r.url, 500),
      image: isImageUrl(r.image) ? r.image.trim() : '', niche: str(r.niche, 80), role: str(r.role, 120),
      followers: str(r.followers, 24), growth: str(r.growth, 60), asOf: /^\d{4}-\d{2}-\d{2}$/.test(r.asOf ?? '') ? r.asOf : '',
      visible: r.visible !== false,
    });
  }
  return out;
}
export function normalizeReels(raw: unknown): ReelItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: ReelItem[] = [];
  for (const r of raw as any[]) {
    if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push({ id: r.id, url: str(r.url, 500), caption: str(r.caption, 160), cover: isImageUrl(r.cover) ? r.cover.trim() : '', visible: r.visible !== false });
  }
  return out;
}

/** What the public site actually shows. One definition used by the site, the nav and the admin status line. */
export const publicProfiles = (list: SocialProfile[]) =>
  list.filter((p) => p.visible !== false && p.name.trim() && httpUrl(p.url)).map((p) => ({ profile: p, url: httpUrl(p.url) }));

export interface ParsedReel { kind: 'reel' | 'p' | 'tv'; code: string; canonical: string; embed: string }
/** Accepts instagram.com/reel/CODE, /reels/CODE, /p/CODE, /tv/CODE (with or without a username in front, and with any ?query).
 *  Returns null for profile links, the Reels tab, other sites, or anything that is not a real post link. */
export function parseInstagramPost(raw: string | undefined | null): ParsedReel | null {
  const u = httpUrl(raw);
  if (!u) return null;
  let url: URL;
  try { url = new URL(u); } catch { return null; }
  const host = url.hostname.toLowerCase();
  if (host !== 'instagram.com' && !host.endsWith('.instagram.com')) return null;
  const seg = url.pathname.split('/').filter(Boolean);
  const at = ['reel', 'reels', 'p', 'tv'].includes(seg[0]) ? 0 : ['reel', 'reels', 'p', 'tv'].includes(seg[1]) ? 1 : -1;
  if (at < 0) return null;
  const code = seg[at + 1];
  if (!code || !/^[A-Za-z0-9_-]{5,}$/.test(code)) return null;
  const kind = seg[at] === 'reels' ? 'reel' : (seg[at] as 'reel' | 'p' | 'tv');
  const canonical = `https://www.instagram.com/${kind}/${code}/`;
  return { kind, code, canonical, embed: `${canonical}embed/` };
}

export const publicReels = (list: ReelItem[]) =>
  list.filter((r) => r.visible !== false).flatMap((r) => { const parsed = parseInstagramPost(r.url); return parsed ? [{ reel: r, parsed }] : []; });
