import React, { useId, useRef, useState } from 'react';
import { Send, MessageSquare, CheckCircle, Mail, Phone, Loader2, AlertCircle } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { FontPairOption } from '../types';
import { EnquiryErrors, EnquiryError, EnquiryResult, LIMITS, newRef, submitEnquiry, validateEnquiry, whatsappLink } from '../lib/enquiry';

interface ContactSectionProps {
  fontPair: FontPairOption;
  whatsappNumber: string;
  email: string;
  phone: string;
  location: string;
}

const OTHER = '__other__';
const COOLDOWN_MS = 20_000;
const LAST_KEY = 'contact_last_submit';

const field = 'w-full px-4 py-3.5 rounded-xl bg-zinc-950 border text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white transition-colors';
const label = 'text-xs uppercase font-mono-code tracking-wider text-zinc-300 block';

export const ContactSection: React.FC<ContactSectionProps> = ({ fontPair, whatsappNumber, email, phone, location }) => {
  const { t, settings } = useContent();
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;

  const [form, setForm] = useState({ name: '', email: '', choice: '', custom: '', message: '', website: '' });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ result: EnquiryResult; snapshot: { name: string; email: string; service: string; message: string } } | null>(null);
  // One ref per attempt-series: a retry after a network hiccup re-sends the SAME ref, so it can never double-save.
  const refRef = useRef<string>(newRef());
  const customRef = useRef<HTMLInputElement>(null);

  const service = form.choice === OTHER ? form.custom.trim() : form.choice;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k as keyof EnquiryErrors]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onChoice = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((f) => ({ ...f, choice: e.target.value }));
    if (e.target.value === OTHER) setTimeout(() => customRef.current?.focus(), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return; // no duplicate submissions
    setSubmitError('');

    const v = validateEnquiry({ name: form.name, email: form.email, service, message: form.message });
    if (form.choice === OTHER && !form.custom.trim()) v.service = 'Please type your enquiry type, or pick one from the list.';
    setErrors(v);
    if (Object.keys(v).length) {
      const first = (['name', 'email', 'service', 'message'] as const).find((k) => v[k]);
      if (first) document.getElementById(id(first === 'service' ? (form.choice === OTHER ? 'custom' : 'type') : first))?.focus();
      return;
    }

    try {
      const last = Number(localStorage.getItem(LAST_KEY) || 0);
      if (Date.now() - last < COOLDOWN_MS) {
        setSubmitError('Please wait a few seconds before sending another message.');
        return;
      }
    } catch { /* storage unavailable: skip cooldown */ }

    setBusy(true);
    try {
      const result = await submitEnquiry({ name: form.name, email: form.email, service, message: form.message, website: form.website }, refRef.current);
      try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch { /* ignore */ }
      setDone({ result, snapshot: { name: form.name.trim(), email: form.email.trim(), service, message: form.message.trim() } });
    } catch (err) {
      // Entered data is kept so the visitor can simply press send again.
      setSubmitError(err instanceof EnquiryError ? err.message : 'Something went wrong while sending your message. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setForm({ name: '', email: '', choice: '', custom: '', message: '', website: '' });
    setErrors({}); setSubmitError(''); setDone(null);
    refRef.current = newRef();
  };

  const errProps = (k: keyof EnquiryErrors, fieldId: string) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `${fieldId}-err` : undefined,
  });
  const border = (k: keyof EnquiryErrors) => (errors[k] ? 'border-red-400' : 'border-white/20');
  const Err = ({ k, fieldId }: { k: keyof EnquiryErrors; fieldId: string }) =>
    errors[k] ? <p id={`${fieldId}-err`} className="text-xs text-red-400 flex items-start gap-1.5" role="alert"><AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden="true" />{errors[k]}</p> : null;

  return (
    <section id="contact" className="py-16 sm:py-24 px-5 sm:px-6 border-b border-white/10 relative">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <div className="text-xs font-mono-code uppercase tracking-widest text-zinc-400 mb-2">{t('contact.eyebrow')}</div>
          <h2 className={`text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight mb-4 break-words ${fontPair.headlineClass}`}>
            {t('contact.title')}
          </h2>
          {t('contact.subtitle') && <p className="text-sm font-mono-code text-zinc-400">{t('contact.subtitle')}</p>}
        </div>

        <div className="p-5 sm:p-12 rounded-[24px] bg-black border border-white/20 shadow-2xl relative">
          {done ? (
            <div className="py-6 sm:py-8 text-center space-y-6" role="status">
              <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-[0_0_30px_rgb(var(--fg-rgb)/0.4)]">
                <CheckCircle className="w-8 h-8" aria-hidden="true" />
              </div>
              <div>
                <h3 className={`text-2xl sm:text-3xl font-bold text-white uppercase mb-2 ${fontPair.headlineClass}`}>{t('contact.successTitle')}</h3>
                <p className="text-sm text-zinc-300 max-w-md mx-auto">
                  Thanks, {done.snapshot.name.split(' ')[0]}! Your enquiry has been saved to my inbox as{' '}
                  <span className="font-mono-code text-white font-bold">{done.result.ref}</span>
                  {done.result.whatsapp === 'sent' ? ' and delivered to my WhatsApp.' : '.'} I will reply to {done.snapshot.email}.
                </p>
              </div>

              {done.result.whatsapp !== 'sent' && whatsappNumber && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/15 max-w-md mx-auto text-left">
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    Want a faster reply? You can also send this on WhatsApp. This only opens WhatsApp with the message ready: you still need to press send there.
                  </p>
                  <a
                    href={whatsappLink(whatsappNumber, done.snapshot)}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full min-h-11 py-3 px-4 bg-white text-black text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" aria-hidden="true" />
                    <span>Open WhatsApp</span>
                  </a>
                </div>
              )}

              <button onClick={reset} className="text-xs font-mono-code text-zinc-400 hover:text-white underline underline-offset-4 cursor-pointer">
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate aria-busy={busy} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 min-w-0">
                  <label htmlFor={id('name')} className={label}>{t('contact.nameLabel')} *</label>
                  <input id={id('name')} type="text" autoComplete="name" maxLength={LIMITS.name + 20} required value={form.name} onChange={set('name')}
                    placeholder="e.g. Morgan Maxwell" className={`${field} ${border('name')}`} {...errProps('name', id('name'))} />
                  <Err k="name" fieldId={id('name')} />
                </div>
                <div className="space-y-2 min-w-0">
                  <label htmlFor={id('email')} className={label}>{t('contact.emailLabel')} *</label>
                  <input id={id('email')} type="email" inputMode="email" autoComplete="email" required value={form.email} onChange={set('email')}
                    placeholder="e.g. hello@agency.com" className={`${field} ${border('email')}`} {...errProps('email', id('email'))} />
                  <Err k="email" fieldId={id('email')} />
                </div>
              </div>

              {/* Enquiry type: pick a suggestion, or choose "Other" and type your own */}
              <div className="space-y-2">
                <label htmlFor={id('type')} className={label}>{t('contact.typeLabel')}</label>
                <select id={id('type')} value={form.choice} onChange={onChoice}
                  className={`${field} ${border('service')} cursor-pointer`}>
                  <option value="">Select an option…</option>
                  {settings.enquiry_types.map((o) => <option key={o} value={o}>{o}</option>)}
                  <option value={OTHER}>Other / Enter your own answer…</option>
                </select>
                {form.choice === OTHER && (
                  <>
                    <label htmlFor={id('custom')} className="sr-only">Your enquiry type</label>
                    <input id={id('custom')} ref={customRef} type="text" maxLength={LIMITS.service} value={form.custom} onChange={set('custom')}
                      placeholder="Type your own, e.g. Brand strategy" className={`${field} ${border('service')}`} {...errProps('service', id('custom'))} />
                  </>
                )}
                <Err k="service" fieldId={form.choice === OTHER ? id('custom') : id('type')} />
              </div>

              <div className="space-y-2">
                <label htmlFor={id('message')} className={label}>{t('contact.messageLabel')} *</label>
                <textarea id={id('message')} required rows={5} maxLength={LIMITS.message} value={form.message} onChange={set('message')}
                  placeholder={t('contact.messagePlaceholder')} className={`${field} ${border('message')} resize-y min-h-32`} {...errProps('message', id('message'))} />
                <Err k="message" fieldId={id('message')} />
              </div>

              {/* Honeypot: invisible to people, tempting to bots */}
              <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label>
              </div>

              {submitError && (
                <div role="alert" className="flex items-start gap-2 p-3 rounded-xl border border-red-400/40 bg-red-500/10 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /><span>{submitError}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button type="submit" disabled={busy}
                  className="w-full sm:w-auto min-h-12 px-8 py-4 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
                  <span>{busy ? 'SENDING…' : t('contact.submit')}</span>
                </button>
                {t('contact.hint') && <div className="text-[11px] font-mono-code text-zinc-500">{t('contact.hint')}</div>}
              </div>
            </form>
          )}

          {/* Direct channels */}
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-x-6 gap-y-3 text-xs font-mono-code text-zinc-400">
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 min-w-0">
              <a href={`mailto:${email}`} className="hover:text-white transition-colors flex items-center gap-1.5 min-w-0">
                <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /><span className="break-all">{email}</span>
              </a>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /><span>{phone}</span>
              </a>
            </div>
            {location && <div className="text-zinc-500 break-words">Location: {location}</div>}
          </div>
        </div>
      </div>
    </section>
  );
};
