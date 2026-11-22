import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { httpUrl } from '../../lib/links';
import { cleanHandle, formatAsOf, platformMeta, PLATFORMS, publicProfiles, todayISO, urlMatchesPlatform } from '../../lib/social';
import { inputCls } from './RecordsEditor';
import { useDirtyFlag, useSaver } from './AdminDirty';
import { ImageUploader } from './ImageUploader';
import { SocialPlatform, SocialProfile } from '../../types';

const uid = () => `sp-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
const label = 'text-[10px] uppercase tracking-wider text-zinc-500';

type Form = { platform: SocialPlatform; name: string; handle: string; url: string; image: string; niche: string; role: string; followers: string; growth: string; asOf: string; position: number };
const emptyForm = (position: number): Form => ({ platform: 'instagram', name: '', handle: '', url: '', image: '', niche: '', role: '', followers: '', growth: '', asOf: '', position });
const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;

/**
 * Manager for "Profiles I have managed". Every action saves straight to the database (site_content → social_profiles),
 * so the public site updates by itself (live, via Supabase realtime). The list order here IS the order on the website.
 * Follower numbers are typed by you: Instagram / LinkedIn do not allow reading client accounts, so the site shows them as
 * "Figures as of <date>" instead of pretending they are live.
 */
export const SocialProfilesAdmin: React.FC = () => {
  const c = useContent();
  const profiles = c.settings.social_profiles;
  const { state, run } = useSaver();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(() => emptyForm(profiles.length + 1));
  const [asOfTouched, setAsOfTouched] = useState(false);
  const [touched, setTouched] = useState(false);
  const busy = state.kind === 'saving';

  const editing = editingId ? profiles.find((p) => p.id === editingId) : undefined;
  const slots = editing ? profiles.length : profiles.length + 1;
  const meta = platformMeta(form.platform);

  const formDirty = useMemo(() => {
    if (editing) {
      return form.platform !== editing.platform || form.name !== editing.name || form.handle !== editing.handle || form.url !== editing.url || form.image !== editing.image
        || form.niche !== editing.niche || form.role !== editing.role || form.followers !== editing.followers || form.growth !== editing.growth
        || form.asOf !== editing.asOf || form.position !== profiles.indexOf(editing) + 1;
    }
    return !!(form.name || form.handle || form.url || form.image || form.niche || form.role || form.followers || form.growth);
  }, [form, editing, profiles]);
  useDirtyFlag(formDirty);

  const nameErr = !form.name.trim() ? 'Account name is required.' : '';
  const urlErr = !form.url.trim() ? 'Profile link is required.'
    : !httpUrl(form.url) ? 'Enter a valid link starting with http:// or https://'
    : !urlMatchesPlatform(httpUrl(form.url), form.platform) ? `This does not look like a ${meta.label} link. Pick the right platform, or choose “Other”.` : '';
  const dateErr = form.asOf && !/^\d{4}-\d{2}-\d{2}$/.test(form.asOf) ? 'Pick a valid date.' : '';
  const showErr = touched && (nameErr || urlErr || dateErr);

  const resetForm = (position = profiles.length + 1) => { setEditingId(null); setForm(emptyForm(position)); setTouched(false); setAsOfTouched(false); };
  const persist = (next: SocialProfile[], after?: () => void) => run(async () => { await c.saveSetting('social_profiles', next); after?.(); });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameErr || urlErr || dateErr || busy) return;
    const hasStats = !!(form.followers.trim() || form.growth.trim());
    const statsChanged = !editing || form.followers.trim() !== editing.followers || form.growth.trim() !== editing.growth;
    // New or changed numbers get today's date automatically (unless you picked a date yourself); no numbers = no date.
    const asOf = !hasStats ? '' : statsChanged && !asOfTouched ? todayISO() : form.asOf || todayISO();
    const item: SocialProfile = {
      id: editing?.id ?? uid(), platform: form.platform, name: form.name.trim(), handle: cleanHandle(form.handle), url: httpUrl(form.url),
      image: form.image.trim(), niche: form.niche.trim(), role: form.role.trim(), followers: form.followers.trim(), growth: form.growth.trim(), asOf,
      visible: editing ? editing.visible !== false : true,
    };
    const next = profiles.filter((p) => p.id !== item.id);
    next.splice(Math.min(Math.max(form.position - 1, 0), next.length), 0, item);
    persist(next, () => resetForm(next.length + 1));
  };

  const startEdit = (p: SocialProfile) => {
    setEditingId(p.id); setTouched(false); setAsOfTouched(false);
    setForm({ platform: p.platform, name: p.name, handle: p.handle, url: p.url, image: p.image, niche: p.niche, role: p.role, followers: p.followers, growth: p.growth, asOf: p.asOf, position: profiles.indexOf(p) + 1 });
    document.getElementById('social-profile-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const remove = (p: SocialProfile) => {
    if (busy || !confirm(`Delete “${p.name || 'this profile'}”?\n\nIt is removed from your website permanently.`)) return;
    persist(profiles.filter((x) => x.id !== p.id), () => { if (editingId === p.id) resetForm(profiles.length); });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (busy || j < 0 || j >= profiles.length) return;
    const next = [...profiles]; [next[i], next[j]] = [next[j], next[i]];
    persist(next);
  };
  const toggleVisible = (p: SocialProfile) => persist(profiles.map((x) => (x.id === p.id ? { ...x, visible: x.visible === false } : x)));

  const liveCount = publicProfiles(profiles).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mr-auto">Managed Profiles ({profiles.length})</h3>
        <div aria-live="polite" className="text-xs">
          {state.kind === 'saving' && <span className="text-zinc-300">Saving…</span>}
          {state.kind === 'saved' && <span className="text-emerald-400">Saved: live on the site</span>}
          {state.kind === 'error' && <span role="alert" className="text-red-400">{state.message}</span>}
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Add the Instagram, LinkedIn or other accounts you have managed. They appear on your site under “Profiles I have managed”, in the order below.
        Follower numbers are entered by you and shown as “Figures as of &lt;date&gt;”. Changes save instantly.
      </p>
      <p className={`text-xs ${liveCount ? 'text-emerald-400' : 'text-amber-300'}`}>
        {liveCount ? `${liveCount} profile${liveCount === 1 ? '' : 's'} showing on the public site.` : 'Nothing to show yet, so this section and its menu link are hidden on the public site.'}
      </p>

      {/* ---------- Add / Edit form ---------- */}
      <form id="social-profile-form" onSubmit={submit} noValidate className="p-4 sm:p-5 space-y-4 rounded-xl border border-white/15 bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">{editing ? `Edit: ${editing.name}` : 'Add a profile'}</h4>
          {editing && <button type="button" onClick={() => resetForm()} className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /> Cancel</button>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 min-w-0">
            <span className={label}>Platform *</span>
            <select className={inputCls} value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as SocialPlatform }))}>
              {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 min-w-0">
            <span className={label}>Account / brand name *</span>
            <input className={inputCls} value={form.name} maxLength={80} placeholder="e.g. 6thLoom" aria-invalid={touched && !!nameErr} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            {touched && nameErr && <span role="alert" className="text-[11px] text-red-400">{nameErr}</span>}
          </label>
          <label className="grid gap-1.5 min-w-0 sm:col-span-2">
            <span className={label}>Profile link *</span>
            <input className={inputCls} value={form.url} inputMode="url" autoCapitalize="none" spellCheck={false} placeholder={meta.example} aria-invalid={touched && !!urlErr} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            {touched && urlErr && <span role="alert" className="text-[11px] text-red-400">{urlErr}</span>}
          </label>
          <label className="grid gap-1.5 min-w-0">
            <span className={label}>Handle (optional)</span>
            <input className={inputCls} value={form.handle} maxLength={60} autoCapitalize="none" spellCheck={false} placeholder="@brandname" onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))} />
          </label>
          <label className="grid gap-1.5 min-w-0">
            <span className={label}>Client type / niche (optional)</span>
            <input className={inputCls} value={form.niche} maxLength={80} placeholder="e.g. Fashion · E-commerce" onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))} />
          </label>
          <label className="grid gap-1.5 min-w-0 sm:col-span-2">
            <span className={label}>What you did (optional)</span>
            <input className={inputCls} value={form.role} maxLength={120} placeholder="e.g. Content planning, Reels and Meta Ads" onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
          </label>
          <label className="grid gap-1.5 min-w-0">
            <span className={label}>Followers (optional)</span>
            <input className={inputCls} value={form.followers} maxLength={24} placeholder="e.g. 12.4K" onChange={(e) => setForm((f) => ({ ...f, followers: e.target.value }))} />
          </label>
          <label className="grid gap-1.5 min-w-0">
            <span className={label}>Growth (optional)</span>
            <input className={inputCls} value={form.growth} maxLength={60} placeholder="e.g. +3.2K in 90 days" onChange={(e) => setForm((f) => ({ ...f, growth: e.target.value }))} />
          </label>
          {(form.followers.trim() || form.growth.trim()) && (
            <label className="grid gap-1.5 min-w-0">
              <span className={label}>Numbers checked on</span>
              <input type="date" className={inputCls} value={form.asOf} max={todayISO()} onChange={(e) => { setAsOfTouched(true); setForm((f) => ({ ...f, asOf: e.target.value })); }} />
              <span className="text-[10px] text-zinc-600">{form.asOf ? `Shown as “Figures as of ${formatAsOf(form.asOf)}”.` : 'Left empty = today’s date when you save.'}</span>
              {dateErr && <span role="alert" className="text-[11px] text-red-400">{dateErr}</span>}
            </label>
          )}
        </div>

        <div className="grid gap-1.5">
          <span className={label}>Profile picture / logo (optional)</span>
          <ImageUploader value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} folder="social" allowClear />
        </div>

        <label className="grid gap-1.5 max-w-xs">
          <span className={label}>Position on the website</span>
          <select className={inputCls} value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) }))}>
            {Array.from({ length: slots }, (_, k) => k + 1).map((n) => <option key={n} value={n}>{n === 1 ? '1st (shown first)' : n === slots ? `${ord(n)} (last)` : ord(n)}</option>)}
          </select>
        </label>

        {showErr && <p role="alert" className="text-xs text-red-400">Please fix the highlighted fields.</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white text-black rounded-lg hover:bg-zinc-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {editing ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}{editing ? 'Save changes' : 'Add profile'}
          </button>
          {(formDirty || editing) && <button type="button" onClick={() => resetForm()} className="px-3 py-2 text-xs text-zinc-300 border border-white/20 rounded-lg hover:border-white/50 cursor-pointer">{editing ? 'Cancel' : 'Clear'}</button>}
        </div>
      </form>

      {/* ---------- Ordered list ---------- */}
      {profiles.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500 border border-dashed border-white/15 rounded-xl">No profiles yet. Add your first one above.</div>
      ) : (
        <ol className="space-y-2">
          {profiles.map((p, i) => {
            const hidden = p.visible === false;
            const Icon = platformMeta(p.platform).icon;
            const valid = !!httpUrl(p.url);
            return (
              <li key={p.id} className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl border bg-zinc-950 ${editingId === p.id ? 'border-white/60' : 'border-white/15'} ${hidden ? 'opacity-70' : ''}`}>
                <span className="shrink-0 w-7 h-7 rounded-lg border border-white/15 flex items-center justify-center text-[11px] font-mono-code text-zinc-300 tabular-nums" aria-label={`Position ${i + 1}`}>{i + 1}</span>
                <span className="shrink-0 w-9 h-9 rounded-full overflow-hidden border border-white/15 bg-black flex items-center justify-center">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Icon className="w-4 h-4 text-zinc-400" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-xs font-semibold text-white">{p.name || '(unnamed)'}</span>
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{platformMeta(p.platform).label}</span>
                    {hidden && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Hidden</span>}
                  </div>
                  <div className={`truncate text-[11px] font-mono-code ${valid ? 'text-zinc-500' : 'text-red-400'}`}>{valid ? [p.handle && `@${p.handle}`, p.followers && `${p.followers} followers`, p.asOf && `as of ${formatAsOf(p.asOf)}`].filter(Boolean).join(' · ') || httpUrl(p.url) : 'Invalid or missing link: edit to fix (not shown on the site)'}</div>
                </div>
                <div className="flex items-center shrink-0">
                  <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label={`Move ${p.name} up`} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={busy || i === profiles.length - 1} aria-label={`Move ${p.name} down`} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => toggleVisible(p)} disabled={busy} aria-label={hidden ? `Show ${p.name} on the site` : `Hide ${p.name} on the site`} title={hidden ? 'Hidden: click to show' : 'Visible: click to hide'} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30">{hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  <button type="button" onClick={() => startEdit(p)} aria-label={`Edit ${p.name}`} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={() => remove(p)} disabled={busy} aria-label={`Delete ${p.name}`} className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-400 cursor-pointer disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
