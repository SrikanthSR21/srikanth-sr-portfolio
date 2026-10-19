// Vercel Function: GET /api/embed-check?url=https://example.com
//
// Tells the Projects section whether a site may be shown inside an <iframe>. Browsers hide the reason a frame
// was refused from the embedding page, so this reads the site's own response headers instead:
//   • X-Frame-Options: DENY | SAMEORIGIN
//   • Content-Security-Policy: frame-ancestors …   (anything other than * / https: / a list containing our origin)
// It only REPORTS the result. Nothing is proxied or rewritten, so no restriction is bypassed.
//
// Returns { embeddable: boolean, reason?: 'x-frame-options' | 'csp-frame-ancestors' | 'unreachable' }

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });

/** Refuse loopback / private / link-local targets so this endpoint cannot be used to probe internal networks. */
function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')) return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateIp(mapped[1]) : false;
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

async function isSafeTarget(u: URL): Promise<boolean> {
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  if (u.hostname === 'localhost') return false;
  try {
    const addrs = await lookup(u.hostname, { all: true });
    return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
  } catch { return false; }
}

/** true when `frame-ancestors` in this CSP forbids embedding from `origin`. */
function cspBlocks(csp: string, origin: string): boolean {
  for (const policy of csp.split(',')) {
    const directive = policy.split(';').map((d) => d.trim()).find((d) => /^frame-ancestors\s/i.test(d));
    if (!directive) continue;
    const sources = directive.split(/\s+/).slice(1).map((s) => s.toLowerCase());
    if (sources.includes("'none'") || sources.length === 0) return true;
    const host = (() => { try { return new URL(origin).host.toLowerCase(); } catch { return ''; } })();
    const allowed = sources.some((s) =>
      s === '*' || s === 'https:' || s === 'http:' || s === origin.toLowerCase() || s === host ||
      (s.startsWith('*.') && host.endsWith(s.slice(1))));
    if (!allowed) return true; // 'self' only, or other origins only
  }
  return false;
}

export async function GET(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const raw = reqUrl.searchParams.get('url') || '';
  let target: URL;
  try { target = new URL(raw); } catch { return json(400, { embeddable: false, reason: 'invalid-url' }); }

  const origin = request.headers.get('origin') || request.headers.get('referer') || reqUrl.origin;
  const ourOrigin = (() => { try { return new URL(origin).origin; } catch { return reqUrl.origin; } })();

  try {
    // Follow a few redirects by hand so every hop is checked against the private-network rule.
    for (let hop = 0; hop < 5; hop++) {
      if (!(await isSafeTarget(target))) return json(200, { embeddable: false, reason: 'unreachable' });
      const res = await fetch(target, {
        method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(7000),
        headers: { 'User-Agent': 'PortfolioEmbedCheck/1.0', Accept: 'text/html' },
      });
      res.body?.cancel().catch(() => {}); // headers are all we need
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        target = new URL(res.headers.get('location')!, target);
        continue;
      }
      const xfo = (res.headers.get('x-frame-options') || '').toLowerCase();
      if (/\b(deny|sameorigin)\b/.test(xfo)) return json(200, { embeddable: false, reason: 'x-frame-options' });
      const csp = res.headers.get('content-security-policy') || '';
      if (csp && cspBlocks(csp, ourOrigin)) return json(200, { embeddable: false, reason: 'csp-frame-ancestors' });
      if (res.status >= 400) return json(200, { embeddable: false, reason: 'unreachable' });
      return json(200, { embeddable: true });
    }
    return json(200, { embeddable: false, reason: 'unreachable' });
  } catch {
    return json(200, { embeddable: false, reason: 'unreachable' });
  }
}
