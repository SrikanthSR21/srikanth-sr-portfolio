// Vercel Function: POST /api/contact
//
//  1. validates the enquiry (+ honeypot, + rate limits)
//  2. saves it to Supabase  → this is the source of truth and never depends on step 3
//  3. notifies the owner on WhatsApp through the official Cloud API (server-side secrets only)
//
// Environment variables (Vercel → Settings → Environment Variables; NONE of these may start with VITE_):
//   SUPABASE_URL                  (falls back to VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY     optional but recommended: lets us record WhatsApp status and rate-limit by email.
//                                 Without it the function inserts with the public anon key.
//   WHATSAPP_ACCESS_TOKEN         permanent System-User token from Meta
//   WHATSAPP_PHONE_NUMBER_ID      the *sending* number's ID from WhatsApp Manager
//   WHATSAPP_RECIPIENT            your number, digits with country code, e.g. 917825025164
//   WHATSAPP_TEMPLATE_NAME        approved template with 5 body variables (see README). If unset, a plain text
//                                 message is sent — Meta only delivers that inside the 24-hour customer-service window.
//   WHATSAPP_TEMPLATE_LANG        default "en"
//   WHATSAPP_GRAPH_VERSION        default "v21.0"

const env = (k: string) => (process.env[k] || '').trim();
const SUPABASE_URL = () => (env('SUPABASE_URL') || env('VITE_SUPABASE_URL')).replace(/\/+$/, '');
const SERVICE_KEY = () => env('SUPABASE_SERVICE_ROLE_KEY');
const API_KEY = () => SERVICE_KEY() || env('VITE_SUPABASE_ANON_KEY');

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

// Best-effort per-instance limiter (serverless instances are not shared, so this only stops bursts).
const hits = new Map<string, number[]>();
function tooMany(ip: string, max = 5, windowMs = 10 * 60_000) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return recent.length > max;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REF_RE = /^TCK-[A-Z0-9]{4,12}$/;

function sbHeaders(extra: Record<string, string> = {}) {
  return { apikey: API_KEY(), Authorization: `Bearer ${API_KEY()}`, 'Content-Type': 'application/json', ...extra };
}

async function recentCountByEmail(email: string): Promise<number> {
  if (!SERVICE_KEY()) return 0; // anon key cannot read tickets (by design)
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const url = `${SUPABASE_URL()}/rest/v1/tickets?select=ref&client_email=eq.${encodeURIComponent(email)}&created_at=gte.${encodeURIComponent(since)}`;
  const r = await fetch(url, { headers: sbHeaders() });
  return r.ok ? ((await r.json()) as unknown[]).length : 0;
}

async function setWhatsappStatus(ref: string, status: 'sent' | 'failed', error?: string) {
  if (!SERVICE_KEY()) return;
  await fetch(`${SUPABASE_URL()}/rest/v1/tickets?ref=eq.${encodeURIComponent(ref)}`, {
    method: 'PATCH', headers: sbHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ whatsapp_status: status, whatsapp_error: error ? error.slice(0, 300) : null, whatsapp_sent_at: status === 'sent' ? new Date().toISOString() : null }),
  }).catch(() => undefined);
}

// WhatsApp template parameters may not contain newlines, tabs or 4+ consecutive spaces.
const flat = (s: string, max: number) => (s || '-').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, max) || '-';

async function notifyWhatsapp(t: { name: string; email: string; service: string; message: string; createdAt: string }):
  Promise<{ status: 'sent' } | { status: 'failed'; reason: string } | { status: 'not_configured' }> {
  const token = env('WHATSAPP_ACCESS_TOKEN');
  const phoneId = env('WHATSAPP_PHONE_NUMBER_ID');
  const to = env('WHATSAPP_RECIPIENT').replace(/[^0-9]/g, '');
  if (!token || !phoneId || !to) return { status: 'not_configured' };

  const when = new Date(t.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
  const template = env('WHATSAPP_TEMPLATE_NAME');
  const body = template
    ? {
        messaging_product: 'whatsapp', to, type: 'template',
        template: {
          name: template, language: { code: env('WHATSAPP_TEMPLATE_LANG') || 'en' },
          components: [{ type: 'body', parameters: [
            flat(t.name, 100), flat(t.email, 100), flat(t.service || 'Not specified', 80), flat(t.message, 900), flat(when, 40),
          ].map((text) => ({ type: 'text', text })) }],
        },
      }
    : {
        messaging_product: 'whatsapp', to, type: 'text',
        text: { body: `New portfolio enquiry\nName: ${t.name}\nEmail: ${t.email}\nType: ${t.service || 'Not specified'}\nTime: ${when}\n\n${t.message}`.slice(0, 3900) },
      };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(`https://graph.facebook.com/${env('WHATSAPP_GRAPH_VERSION') || 'v21.0'}/${phoneId}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: ctrl.signal,
    });
    if (r.ok) return { status: 'sent' };
    const err = (await r.json().catch(() => ({}))) as { error?: { code?: number; type?: string } };
    // Log only codes: never the token, the recipient or the visitor's data.
    return { status: 'failed', reason: `HTTP ${r.status} / Meta code ${err.error?.code ?? 'n/a'}` };
  } catch (e) {
    return { status: 'failed', reason: (e as Error).name === 'AbortError' ? 'timeout' : 'network error' };
  } finally { clearTimeout(timer); }
}

export async function POST(request: Request): Promise<Response> {
  if (!SUPABASE_URL() || !API_KEY()) return json(503, { ok: false, error: 'Backend not configured.' });

  let b: Record<string, unknown>;
  try { b = (await request.json()) as Record<string, unknown>; } catch { return json(400, { ok: false, error: 'Invalid request.' }); }

  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (typeof b.website === 'string' && b.website.trim()) return json(200, { ok: true, whatsapp: 'not_configured' });

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const ref = str(b.ref), name = str(b.name), email = str(b.email), service = str(b.service), message = str(b.message);
  if (!REF_RE.test(ref)) return json(400, { ok: false, error: 'Invalid request.' });
  if (!name || name.length > 120) return json(400, { ok: false, error: 'Please enter your name.' });
  if (!EMAIL_RE.test(email) || email.length > 200) return json(400, { ok: false, error: 'Please enter a valid email address.' });
  if (service.length > 80) return json(400, { ok: false, error: 'Enquiry type is too long.' });
  if (message.length < 3 || message.length > 4000) return json(400, { ok: false, error: 'Please write a message (up to 4000 characters).' });

  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (tooMany(ip) || (await recentCountByEmail(email).catch(() => 0)) >= 3) {
    return json(429, { ok: false, error: 'Too many messages in a short time. Please try again in a few minutes.' });
  }

  // 1. Save. ignore-duplicates makes a retried request with the same ref harmless.
  const ins = await fetch(`${SUPABASE_URL()}/rest/v1/tickets`, {
    method: 'POST', headers: sbHeaders({ Prefer: 'resolution=ignore-duplicates,return=minimal' }),
    body: JSON.stringify({ ref, client_name: name, client_email: email, service: service || null, budget: null, message, status: 'New' }),
  }).catch(() => null);
  if (!ins || !ins.ok) {
    console.error('contact: supabase insert failed', ins?.status);
    return json(502, { ok: false, error: 'Could not save your message.' });
  }

  // 2. Notify. A failure here must never fail the request: the enquiry is already in the inbox.
  const result = await notifyWhatsapp({ name, email, service, message, createdAt: new Date().toISOString() });
  if (result.status === 'sent') await setWhatsappStatus(ref, 'sent');
  else if (result.status === 'failed') { console.error('contact: whatsapp failed', result.reason); await setWhatsappStatus(ref, 'failed', result.reason); }

  return json(200, { ok: true, ref, whatsapp: result.status });
}
