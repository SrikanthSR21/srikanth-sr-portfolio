/** Turns an admin-typed link into a safe href, or '' when it is empty / not allowed (e.g. "javascript:").
 *  Accepts: https://…, http://…, mailto:, tel:, #section, /page. A bare "example.com/x" becomes https://example.com/x. */
export function safeHref(raw: string | undefined | null): string {
  const v = (raw ?? '').trim();
  if (!v) return '';
  if (/^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return ''; // any other scheme (javascript:, data:, …) is refused
  if (/^[\w-]+(\.[\w-]+)+(\/|$|\?|#)/.test(v)) return `https://${v}`;
  return '';
}

/** Props for an <a> pointing at `href`: external links open in a new tab, in-page links stay put. */
export function linkProps(href: string): { href: string; target?: string; rel?: string } {
  return /^https?:\/\//i.test(href) ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href };
}

/** The CYBERBIX frame parts that can be switched off from the admin (stored as a comma list in texts['branding.frameHidden']). */
export const FRAME_PARTS = [
  { id: 'emblem', label: 'Square emblem / icon' },
  { id: 'title', label: 'Big title' },
  { id: 'kicker', label: 'Small line under the title' },
  { id: 'body', label: 'Description paragraph' },
  { id: 'stat1', label: 'Left stat box' },
  { id: 'stat2', label: 'Right stat box' },
  { id: 'caption', label: 'Caption under the card' },
] as const;
export type FramePartId = (typeof FRAME_PARTS)[number]['id'];

export const parseHidden = (raw: string | undefined): Set<string> =>
  new Set((raw ?? '').split(',').map((s) => s.trim()).filter(Boolean));
