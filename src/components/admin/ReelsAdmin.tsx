import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Instagram, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { parseInstagramPost, publicReels } from '../../lib/social';
import { inputCls } from './RecordsEditor';
import { useDirtyFlag, useSaver } from './AdminDirty';
import { ImageUploader } from './ImageUploader';
import { ReelItem } from '../../types';

const uid = () => `reel-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
const label = 'text-[10px] uppercase tracking-wider text-zinc-500';
type Form = { url: string; caption: string; cover: string; position: number };
const emptyForm = (position: number): Form => ({ url: '', caption: '', cover: '', position });
const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;

/**
 * Manager for the Instagram Reels section. Paste a reel link, add a caption (and an optional cover image), save.
 * The public site shows the section ONLY while at least one visible reel has a valid link; delete or hide them all and the section
 * and its menu link disappear by themselves. Every action saves instantly (site_content → reels).
 */
export const ReelsAdmin: React.FC = () => {
  const c = useContent();
  const reels = c.settings.reels;
  const { state, run } = useSaver();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(() => emptyForm(reels.length + 1));
  const [touched, setTouched] = useState(false);
  const busy = state.kind === 'saving';

  const editing = editingId ? reels.find((r) => r.id === editingId) : undefined;
  const slots = editing ? reels.length : reels.length + 1;
  const parsed = parseInstagramPost(form.url);

  const formDirty = useMemo(() => (editing
    ? form.url !== editing.url || form.caption !== editing.caption || form.cover !== editing.cover || form.position !== reels.indexOf(editing) + 1
    : !!(form.url || form.caption || form.cover)), [form, editing, reels]);
  useDirtyFlag(formDirty);

  const urlErr = !form.url.trim() ? 'Paste the Instagram reel link.'
    : !parsed ? 'This is not a reel or post link. Open the reel on Instagram → Share → Copy link (it looks like instagram.com/reel/…).'
    : reels.some((r) => r.id !== editing?.id && parseInstagramPost(r.url)?.code === parsed.code) ? 'This reel is already in your list.' : '';
  const showErr = touched && urlErr;

  const resetForm = (position = reels.length + 1) => { setEditingId(null); setForm(emptyForm(position)); setTouched(false); };
  const persist = (next: ReelItem[], after?: () => void) => run(async () => { await c.saveSetting('reels', next); after?.(); });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (urlErr || !parsed || busy) return;
    const item: ReelItem = { id: editing?.id ?? uid(), url: parsed.canonical, caption: form.caption.trim(), cover: form.cover.trim(), visible: editing ? editing.visible !== false : true };
    const next = reels.filter((r) => r.id !== item.id);
    next.splice(Math.min(Math.max(form.position - 1, 0), next.length), 0, item);
    persist(next, () => resetForm(next.length + 1));
  };

  const startEdit = (r: ReelItem) => {
    setEditingId(r.id); setTouched(false);
    setForm({ url: r.url, caption: r.caption, cover: r.cover, position: reels.indexOf(r) + 1 });
    document.getElementById('reel-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const remove = (r: ReelItem) => {
    if (busy || !confirm('Delete this reel?\n\nIt is removed from your website permanently.')) return;
    persist(reels.filter((x) => x.id !== r.id), () => { if (editingId === r.id) resetForm(reels.length); });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (busy || j < 0 || j >= reels.length) return;
    const next = [...reels]; [next[i], next[j]] = [next[j], next[i]];
    persist(next);
  };
  const toggleVisible = (r: ReelItem) => persist(reels.map((x) => (x.id === r.id ? { ...x, visible: x.visible === false } : x)));

  const liveCount = publicReels(reels).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mr-auto">Instagram Reels ({reels.length})</h3>
        <div aria-live="polite" className="text-xs">
          {state.kind === 'saving' && <span className="text-zinc-300">Saving…</span>}
          {state.kind === 'saved' && <span className="text-emerald-400">Saved: live on the site</span>}
          {state.kind === 'error' && <span role="alert" className="text-red-400">{state.message}</span>}
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Paste a reel link from Instagram. On your site each reel is a tappable card that plays right there. Only public reels can play.
        With no visible reels, the whole Reels section and its menu link are hidden automatically.
      </p>
      <p className={`text-xs ${liveCount ? 'text-emerald-400' : 'text-amber-300'}`}>
        {liveCount ? `${liveCount} reel${liveCount === 1 ? '' : 's'} showing on the public site.` : 'No visible reels, so this section and its menu link are hidden on the public site.'}
      </p>

      <form id="reel-form" onSubmit={submit} noValidate className="p-4 sm:p-5 space-y-4 rounded-xl border border-white/15 bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">{editing ? 'Edit reel' : 'Add a reel'}</h4>
          {editing && <button type="button" onClick={() => resetForm()} className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /> Cancel</button>}
        </div>

        <label className="grid gap-1.5 min-w-0">
          <span className={label}>Instagram reel link *</span>
          <input className={inputCls} value={form.url} inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://www.instagram.com/reel/AbC123xyz/" aria-invalid={touched && !!urlErr}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
          {touched && urlErr && <span role="alert" className="text-[11px] text-red-400">{urlErr}</span>}
          {!urlErr && parsed && <span className="text-[11px] text-emerald-400">Link recognised: {parsed.kind === 'reel' ? 'reel' : 'post'} {parsed.code}</span>}
        </label>

        <label className="grid gap-1.5">
          <span className={label}>Caption (optional)</span>
          <input className={inputCls} value={form.caption} maxLength={160} placeholder="Shown on the card, e.g. Diwali launch teaser for 6thLoom" onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} />
        </label>

        <div className="grid gap-1.5">
          <span className={label}>Cover image (optional)</span>
          <ImageUploader value={form.cover} onChange={(url) => setForm((f) => ({ ...f, cover: url }))} folder="social" allowClear />
          <span className="text-[10px] text-zinc-600">Instagram does not hand out thumbnails, so upload a screenshot of the reel for a nicer card. Without one the card shows a plain Instagram tile. Portrait (9:16) works best.</span>
        </div>

        <label className="grid gap-1.5 max-w-xs">
          <span className={label}>Position on the website</span>
          <select className={inputCls} value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) }))}>
            {Array.from({ length: slots }, (_, k) => k + 1).map((n) => <option key={n} value={n}>{n === 1 ? '1st (shown first)' : n === slots ? `${ord(n)} (last)` : ord(n)}</option>)}
          </select>
        </label>

        {showErr && <p role="alert" className="text-xs text-red-400">Please fix the highlighted field.</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white text-black rounded-lg hover:bg-zinc-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {editing ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}{editing ? 'Save changes' : 'Add reel'}
          </button>
          {(formDirty || editing) && <button type="button" onClick={() => resetForm()} className="px-3 py-2 text-xs text-zinc-300 border border-white/20 rounded-lg hover:border-white/50 cursor-pointer">{editing ? 'Cancel' : 'Clear'}</button>}
        </div>
      </form>

      {reels.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500 border border-dashed border-white/15 rounded-xl">No reels yet. The Reels section stays hidden on your site until you add one.</div>
      ) : (
        <ol className="space-y-2">
          {reels.map((r, i) => {
            const hidden = r.visible === false;
            const p = parseInstagramPost(r.url);
            return (
              <li key={r.id} className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl border bg-zinc-950 ${editingId === r.id ? 'border-white/60' : 'border-white/15'} ${hidden ? 'opacity-70' : ''}`}>
                <span className="shrink-0 w-7 h-7 rounded-lg border border-white/15 flex items-center justify-center text-[11px] font-mono-code text-zinc-300 tabular-nums" aria-label={`Position ${i + 1}`}>{i + 1}</span>
                <span className="shrink-0 w-9 h-12 rounded-md overflow-hidden border border-white/15 bg-black flex items-center justify-center">
                  {r.cover ? <img src={r.cover} alt="" className="w-full h-full object-cover" /> : <Instagram className="w-4 h-4 text-zinc-500" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-xs font-semibold text-white">{r.caption || '(no caption)'}</span>
                    {hidden && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Hidden</span>}
                  </div>
                  <div className={`truncate text-[11px] font-mono-code ${p ? 'text-zinc-500' : 'text-red-400'}`}>{p ? `instagram.com/${p.kind}/${p.code}` : 'Invalid link: edit to fix (not shown on the site)'}</div>
                </div>
                <div className="flex items-center shrink-0">
                  {p && <a href={p.canonical} target="_blank" rel="noopener noreferrer" aria-label="Open on Instagram" title="Open on Instagram" className="p-1.5 sm:p-2 text-zinc-400 hover:text-white"><ExternalLink className="w-4 h-4" /></a>}
                  <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label="Move up" className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={busy || i === reels.length - 1} aria-label="Move down" className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => toggleVisible(r)} disabled={busy} aria-label={hidden ? 'Show on the site' : 'Hide on the site'} title={hidden ? 'Hidden: click to show' : 'Visible: click to hide'} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30">{hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  <button type="button" onClick={() => startEdit(r)} aria-label="Edit reel" className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={() => remove(r)} disabled={busy} aria-label="Delete reel" className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-400 cursor-pointer disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
