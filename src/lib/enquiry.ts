import { supabase } from './supabase';

export interface EnquiryInput { name: string; email: string; service: string; message: string; website?: string }
export interface EnquiryResult {
  ref: string;
  /** 'sent' only when WhatsApp's API accepted the notification. Anything else ≠ delivered. */
  whatsapp: 'sent' | 'failed' | 'not_configured' | 'unknown';
  via: 'api' | 'direct';
}

export const LIMITS = { name: 120, email: 200, service: 80, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type EnquiryErrors = Partial<Record<'name' | 'email' | 'service' | 'message', string>>;

export function validateEnquiry(v: EnquiryInput): EnquiryErrors {
  const e: EnquiryErrors = {};
  if (!v.name.trim()) e.name = 'Please enter your name.';
  else if (v.name.trim().length > LIMITS.name) e.name = `Name must be ${LIMITS.name} characters or fewer.`;
  if (!v.email.trim()) e.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(v.email.trim()) || v.email.length > LIMITS.email) e.email = 'Please enter a valid email address.';
  if (v.service.length > LIMITS.service) e.service = `Keep this under ${LIMITS.service} characters.`;
  if (!v.message.trim()) e.message = 'Please write a message.';
  else if (v.message.trim().length < 3) e.message = 'Your message is a little short — add a few more words.';
  else if (v.message.length > LIMITS.message) e.message = `Message must be ${LIMITS.message} characters or fewer.`;
  return e;
}

export function newRef(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 7).toUpperCase();
  return `TCK-${code}`;
}

/** Builds the manual-fallback WhatsApp link. Opening it does NOT send anything: the visitor must press send. */
export function whatsappLink(number: string, e: Pick<EnquiryInput, 'name' | 'email' | 'service' | 'message'>) {
  const text = `New Portfolio Message: ${e.name} (${e.email})${e.service ? ` — ${e.service}` : ''}\n${e.message}`;
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}

export class EnquiryError extends Error {
  constructor(message: string, public recoverable = true) { super(message); }
}

/**
 * 1. POST /api/contact (server saves to Supabase, then notifies WhatsApp; secrets stay server-side).
 * 2. If that endpoint is unreachable (local dev, outage) fall back to a direct Supabase insert so the
 *    inbox still receives the enquiry. Both paths use the same ref so a retry can never create a duplicate.
 */
export async function submitEnquiry(input: EnquiryInput, ref = newRef()): Promise<EnquiryResult> {
  const payload = {
    ref, name: input.name.trim(), email: input.email.trim(),
    service: input.service.trim(), message: input.message.trim(), website: input.website ?? '',
  };

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));

    const looksLikeApi = (res.headers.get('content-type') || '').includes('application/json');
    if (looksLikeApi) {
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) return { ref, whatsapp: body.whatsapp ?? 'unknown', via: 'api' };
      if (res.status === 400 || res.status === 429) throw new EnquiryError(body.error || 'Please check the form and try again.');
      // 5xx from our own function → try the direct path below
    }
    // HTML response (SPA rewrite in dev) or server error → direct path
  } catch (e) {
    if (e instanceof EnquiryError) throw e;
    // network error / timeout → direct path
  }

  if (!supabase) throw new EnquiryError('The message service is not available right now. Please email or call instead.');
  const { error } = await supabase.from('tickets').insert({
    ref, client_name: payload.name, client_email: payload.email,
    service: payload.service || null, budget: null, message: payload.message, status: 'New',
  });
  if (error && error.code !== '23505') {
    throw new EnquiryError('Your message could not be saved. Please try again in a moment, or contact me directly.');
  }
  return { ref, whatsapp: 'unknown', via: 'direct' };
}
