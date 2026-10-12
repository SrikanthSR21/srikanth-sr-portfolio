import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, Check, Copy, ExternalLink, FileText, ImageOff, Link2, Loader2, RefreshCw, Replace, Search, Trash2, Upload, X, Images,
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import {
  addExternalAsset, categoryLabel, deleteAssets, formatBytes, isImageAsset, MEDIA_CATEGORIES, MediaAsset, MediaCategory, MediaError,
  replaceAssetUrl, assetKey, saveAssetMeta, uploadAsset,
} from '../../lib/media';
import { useMediaLibrary } from './useMediaLibrary';
import { ConfirmDialog } from './ConfirmDialog';
import { hasUnsavedChanges, useDirtyFlag } from './AdminDirty';
import { inputCls } from './RecordsEditor';

type Sort = 'newest' | 'oldest' | 'name' | 'size';
type UploadJob = { id: number; name: string; state: 'uploading' | 'done' | 'error'; message?: string };

const label = 'text-[10px] uppercase tracking-wider text-zinc-500';
const btn = 'inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-white/20 text-zinc-100 hover:border-white/50 hover:bg-white/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const typeOf = (a: MediaAsset) => (a.mime ? a.mime.replace('image/', '').replace('application/', '').toUpperCase() : (a.filename.split('.').pop() || '').toUpperCase()) || '—';

// ------------------------------------------------------------------------------------------------ thumbnail

const Thumb: React.FC<{ asset: MediaAsset; onDims?: (id: string, w: number, h: number) => void; className?: string }> = ({ asset, onDims, className = '' }) => {
  const [broken, setBroken] = useState(false);
  if (!isImageAsset(asset) || asset.missing || broken) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-zinc-900 text-zinc-500 text-[10px] text-center p-2 ${className}`}>
        {asset.missing || broken ? <ImageOff className="w-5 h-5 text-red-400" aria-hidden="true" /> : <FileText className="w-5 h-5" aria-hidden="true" />}
        {asset.missing ? 'File missing' : broken ? 'Cannot load' : typeOf(asset)}
      </div>
    );
  }
  return (
    <div className={`checkerboard ${className}`}>
      <img src={asset.url} alt={asset.alt || asset.filename} loading="lazy" decoding="async" referrerPolicy="no-referrer"
        className="w-full h-full object-contain" onError={() => setBroken(true)}
        onLoad={(e) => onDims && onDims(asset.id, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)} />
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ external image form

const ExternalForm: React.FC<{ defaultCategory: MediaCategory; onAdded: (a: MediaAsset) => void; onCancel: () => void }> = ({ defaultCategory, onAdded, onCancel }) => {
  const [v, setV] = useState({ url: '', alt: '', category: defaultCategory, sourceName: '', sourceUrl: '', license: '', attribution: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { onAdded(await addExternalAsset({ ...v, category: v.category as MediaCategory })); }
    catch (x: any) { setErr(x?.message || 'Could not add the image.'); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="p-4 rounded-xl border border-white/15 bg-zinc-950 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white">Add an externally hosted image</h4>
          <p className="text-[11px] text-zinc-500 max-w-xl">Saves a link, not a copy: the file stays on the other site (Unsplash, Pexels…), so it counts as “external” and uses none of your storage. Only use images whose licence allows it, and record the credit below where required.</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Close" className="p-1.5 text-zinc-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 sm:col-span-2"><span className={label}>Direct image URL *</span>
          <input required type="url" value={v.url} onChange={set('url')} placeholder="https://images.unsplash.com/photo-…" className={inputCls} /></label>
        <label className="grid gap-1.5"><span className={label}>Alt text (describes the image)</span><input value={v.alt} onChange={set('alt')} className={inputCls} /></label>
        <label className="grid gap-1.5"><span className={label}>Category</span>
          <select value={v.category} onChange={set('category')} className={inputCls}>{MEDIA_CATEGORIES.filter((c) => c.id !== 'document').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
        <label className="grid gap-1.5"><span className={label}>Source name</span><input value={v.sourceName} onChange={set('sourceName')} placeholder="Unsplash" className={inputCls} /></label>
        <label className="grid gap-1.5"><span className={label}>Source page URL</span><input type="url" value={v.sourceUrl} onChange={set('sourceUrl')} placeholder="https://unsplash.com/photos/…" className={inputCls} /></label>
        <label className="grid gap-1.5"><span className={label}>Licence</span><input value={v.license} onChange={set('license')} placeholder="Unsplash License" className={inputCls} /></label>
        <label className="grid gap-1.5"><span className={label}>Attribution / credit</span><input value={v.attribution} onChange={set('attribution')} placeholder="Photo by Name on Unsplash" className={inputCls} /></label>
      </div>
      {err && <div role="alert" className="flex items-start gap-1.5 text-xs text-red-400"><AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />{err}</div>}
      <button type="submit" disabled={busy || !v.url.trim()} className="px-4 py-2 text-xs font-bold bg-white text-black rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{busy ? 'Checking image…' : 'Add to library'}
      </button>
    </form>
  );
};

// ------------------------------------------------------------------------------------------------ detail panel

interface DetailProps {
  asset: MediaAsset;
  usage: { area: string; label: string; field: string }[];
  mode: 'manage' | 'pick';
  dims?: { w: number; h: number };
  onSaved: (a: MediaAsset) => void;
  onDelete: () => void;
  onReplace: (f: File) => void;
  replacing: boolean;
  onPick?: () => void;
}

const Detail: React.FC<DetailProps> = ({ asset, usage, mode, dims, onSaved, onDelete, onReplace, replacing, onPick }) => {
  const [d, setD] = useState({ alt: asset.alt, category: asset.category, sourceName: asset.sourceName ?? '', sourceUrl: asset.sourceUrl ?? '', license: asset.license ?? '', attribution: asset.attribution ?? '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const w = asset.width ?? dims?.w, h = asset.height ?? dims?.h;

  useEffect(() => {
    setD({ alt: asset.alt, category: asset.category, sourceName: asset.sourceName ?? '', sourceUrl: asset.sourceUrl ?? '', license: asset.license ?? '', attribution: asset.attribution ?? '' });
    setMsg(null);
  }, [asset.id, asset.alt, asset.category, asset.sourceName, asset.sourceUrl, asset.license, asset.attribution]);

  const dirty = d.alt !== asset.alt || d.category !== asset.category || d.sourceName !== (asset.sourceName ?? '') || d.sourceUrl !== (asset.sourceUrl ?? '')
    || d.license !== (asset.license ?? '') || d.attribution !== (asset.attribution ?? '');
  useDirtyFlag(mode === 'manage' && dirty);

  const save = async () => {
    setBusy(true); setMsg(null);
    try { onSaved(await saveAssetMeta(asset, { ...d, width: w, height: h })); setMsg({ ok: true, text: 'Saved.' }); }
    catch (e: any) { setMsg({ ok: false, text: e?.message || 'Could not save.' }); }
    finally { setBusy(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(asset.url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ } };
  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD((p) => ({ ...p, [k]: e.target.value as any }));
  const ro = mode === 'pick';

  return (
    <div className="space-y-4">
      <Thumb asset={asset} className="w-full aspect-video rounded-lg border border-white/15 overflow-hidden" />
      {asset.missing && <div role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg p-2.5">This record points to a file that no longer exists in storage. You can remove the record.</div>}

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-zinc-500">File</dt><dd className="text-zinc-200 break-all">{asset.filename}</dd>
        <dt className="text-zinc-500">Type</dt><dd className="text-zinc-200">{typeOf(asset)}</dd>
        <dt className="text-zinc-500">Size</dt><dd className="text-zinc-200">{asset.source === 'external' ? 'Hosted elsewhere' : formatBytes(asset.size)}</dd>
        <dt className="text-zinc-500">Dimensions</dt><dd className="text-zinc-200">{w && h ? `${w} × ${h}px` : '—'}</dd>
        <dt className="text-zinc-500">Added</dt><dd className="text-zinc-200">{asset.createdAt ? new Date(asset.createdAt).toLocaleString() : '—'}</dd>
        <dt className="text-zinc-500">Storage</dt>
        <dd className="text-zinc-200">{asset.source === 'external' ? <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300">External link</span> : <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">Your Supabase storage</span>}</dd>
      </dl>

      <div className="flex gap-1.5">
        <input readOnly value={asset.url} aria-label="Public URL" onFocus={(e) => e.currentTarget.select()} className={`${inputCls} flex-1 min-w-0 font-mono-code`} />
        <button type="button" onClick={copy} className={btn} aria-label="Copy URL">{copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}</button>
        <a href={asset.url} target="_blank" rel="noreferrer noopener" className={btn} aria-label="Open in new tab"><ExternalLink className="w-3.5 h-3.5" /></a>
      </div>

      <div className="rounded-lg border border-white/10 p-3">
        <div className={`${label} mb-1.5`}>Where it is used</div>
        {usage.length === 0
          ? <p className="text-xs text-amber-300">Not used anywhere on the saved site.</p>
          : <ul className="space-y-1 text-xs text-zinc-200">{usage.map((u, i) => <li key={i}>• <span className="text-zinc-400">{u.area}</span>{u.label ? ` · ${u.label}` : ''} <span className="text-zinc-500">({u.field})</span></li>)}</ul>}
      </div>

      {!ro && (
        <div className="grid gap-3">
          <label className="grid gap-1.5"><span className={label}>Alt text</span><input value={d.alt} onChange={set('alt')} placeholder="Describe the image for screen readers" className={inputCls} /></label>
          <label className="grid gap-1.5"><span className={label}>Category</span>
            <select value={d.category} onChange={set('category')} className={inputCls}>{MEDIA_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <details className="rounded-lg border border-white/10 p-3" open={!!(asset.sourceName || asset.license || asset.attribution)}>
            <summary className="text-xs text-zinc-300 cursor-pointer">Source & licence (optional)</summary>
            <div className="grid gap-3 mt-3">
              <label className="grid gap-1.5"><span className={label}>Source name</span><input value={d.sourceName} onChange={set('sourceName')} placeholder="Unsplash, Pexels, self…" className={inputCls} /></label>
              <label className="grid gap-1.5"><span className={label}>Source page URL</span><input value={d.sourceUrl} onChange={set('sourceUrl')} className={inputCls} /></label>
              <label className="grid gap-1.5"><span className={label}>Licence</span><input value={d.license} onChange={set('license')} className={inputCls} /></label>
              <label className="grid gap-1.5"><span className={label}>Attribution / credit</span><input value={d.attribution} onChange={set('attribution')} className={inputCls} /></label>
            </div>
          </details>
          {msg && <div role="status" className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</div>}
        </div>
      )}
      {ro && (asset.attribution || asset.license) && (
        <p className="text-[11px] text-zinc-500">{[asset.attribution, asset.license && `Licence: ${asset.license}`].filter(Boolean).join(' · ')}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {ro && onPick && <button type="button" onClick={onPick} disabled={asset.missing || !isImageAsset(asset)} className="px-4 py-2 text-xs font-bold bg-white text-black rounded-lg cursor-pointer disabled:opacity-50">Use this image</button>}
        {!ro && (
          <>
            <button type="button" onClick={save} disabled={busy || !dirty} className="px-4 py-2 text-xs font-bold bg-white text-black rounded-lg cursor-pointer disabled:opacity-40 flex items-center gap-1.5">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save details
            </button>
            {asset.source === 'upload' && !asset.missing && (
              <>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={replacing} className={btn}>
                  {replacing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Replace className="w-3.5 h-3.5" />}Replace file
                </button>
                <input ref={fileRef} type="file" hidden accept="image/png,image/webp,image/jpeg,image/gif,image/svg+xml,image/avif"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onReplace(f); if (fileRef.current) fileRef.current.value = ''; }} />
              </>
            )}
            <button type="button" onClick={onDelete} className={`${btn} !border-red-400/40 text-red-300 hover:!border-red-400 hover:!bg-red-500/10`}><Trash2 className="w-3.5 h-3.5" />{asset.source === 'external' || asset.missing ? 'Remove' : 'Delete'}</button>
          </>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ browser

interface BrowserProps {
  mode: 'manage' | 'pick';
  onPick?: (a: MediaAsset) => void;
  defaultCategory?: MediaCategory;
}

export const MediaBrowser: React.FC<BrowserProps> = ({ mode, onPick, defaultCategory }) => {
  const content = useContent();
  const lib = useMediaLibrary();
  const { assets, setAssets, loading, error, tableMissing, reload, usage } = lib;

  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | MediaCategory>('all');
  const [src, setSrc] = useState<'all' | 'upload' | 'external'>('all');
  const [use, setUse] = useState<'all' | 'used' | 'unused'>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dims, setDims] = useState<Record<string, { w: number; h: number }>>({});
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [uploadCat, setUploadCat] = useState<MediaCategory>(defaultCategory ?? 'other');
  const [showExternal, setShowExternal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toDelete, setToDelete] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [replacing, setReplacing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const jobId = useRef(0);

  const onDims = useCallback((id: string, w: number, h: number) => setDims((p) => (p[id] ? p : { ...p, [id]: { w, h } })), []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = assets.filter((a) => {
      if (mode === 'pick' && (!isImageAsset(a) || a.missing)) return false;
      if (cat !== 'all' && a.category !== cat) return false;
      if (src !== 'all' && a.source !== src) return false;
      if (use !== 'all' && (usage(a).length > 0) !== (use === 'used')) return false;
      if (needle && ![a.filename, a.alt, a.sourceName, a.attribution, a.license, categoryLabel(a.category)].some((x) => (x ?? '').toLowerCase().includes(needle))) return false;
      return true;
    });
    const by: Record<Sort, (a: MediaAsset, b: MediaAsset) => number> = {
      newest: (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
      oldest: (a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')),
      name: (a, b) => a.filename.localeCompare(b.filename),
      size: (a, b) => (b.size ?? 0) - (a.size ?? 0),
    };
    return out.sort(by[sort]);
  }, [assets, q, cat, src, use, sort, usage, mode]);

  const selected = assets.find((a) => a.id === selectedId) ?? null;

  // ---- uploads (several files at once, each reported on its own)
  const upload = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setNotice(null);
    await Promise.all(arr.map(async (f) => {
      const id = ++jobId.current;
      setJobs((j) => [...j, { id, name: f.name, state: 'uploading' }]);
      try {
        const { asset } = await uploadAsset(f, { category: uploadCat });
        setAssets((p) => [asset, ...p.filter((x) => x.id !== asset.id)]);
        setJobs((j) => j.map((x) => (x.id === id ? { ...x, state: 'done', message: asset.tracked ? undefined : 'Uploaded (run migration-004 to store details)' } : x)));
        setSelectedId(asset.id);
      } catch (e: any) {
        setJobs((j) => j.map((x) => (x.id === id ? { ...x, state: 'error', message: e instanceof MediaError ? e.message : e?.message || 'Upload failed' } : x)));
      }
    }));
    if (tableMissing === false) reload();
  };

  // ---- replace the file everywhere it is used
  const replace = async (asset: MediaAsset, file: File) => {
    if (hasUnsavedChanges() && !confirm('You have unsaved edits in the dashboard. Replacing updates saved content directly. Continue?')) return;
    const refs = usage(asset);
    if (!confirm(`Replace “${asset.filename}” with “${file.name}”?\n\n${refs.length ? `${refs.length} place(s) that use it will switch to the new file automatically.` : 'It is not used anywhere yet.'}\nThe old file stays in storage (as unused) until you delete it.`)) return;
    setReplacing(true); setNotice(null);
    try {
      const { asset: fresh, meta } = await uploadAsset(file, { category: asset.category, alt: asset.alt });
      const key = assetKey(asset);
      let changedAreas = 0;
      for (const k of ['info', 'images', 'clients', 'skills', 'hero_metrics'] as const) {
        const [next, changed] = replaceAssetUrl((content.settings as any)[k], key, fresh.url);
        if (!changed) continue;
        const withDims = k === 'images' && (next as any).profile === fresh.url && meta ? { ...next, profileWidth: meta.width, profileHeight: meta.height, profileTransparent: meta.hasAlpha } : next;
        await content.saveSetting(k, withDims); changedAreas++;
      }
      for (const k of ['projects', 'ad_campaigns', 'experience'] as const) {
        const [next, changed] = replaceAssetUrl(content.collections[k], key, fresh.url);
        if (changed) { await content.saveCollection(k, next as any); changedAreas++; }
      }
      await reload();
      setSelectedId(fresh.id);
      setNotice({ ok: true, text: `Replaced. ${changedAreas ? `Updated ${changedAreas} content area(s).` : ''} The old file is now unused and can be deleted in Storage Management.` });
    } catch (e: any) {
      setNotice({ ok: false, text: `Replace failed, nothing was switched: ${e?.message || 'unknown error'}` });
    } finally { setReplacing(false); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    // Re-check at the moment of deletion: never trust a stale screen.
    const res = await deleteAssets([toDelete]);
    setDeleting(false);
    if (res.failed.length) setNotice({ ok: false, text: `Could not delete: ${res.failed[0].reason}` });
    else { setNotice({ ok: true, text: 'Deleted.' }); if (selectedId === toDelete.id) setSelectedId(null); }
    setToDelete(null);
    reload();
  };

  const delUsage = toDelete ? usage(toDelete) : [];
  const counts = useMemo(() => ({ total: assets.length, ext: assets.filter((a) => a.source === 'external').length }), [assets]);
  const sel = 'px-2.5 py-2 text-xs bg-black border border-white/15 rounded-lg text-white';

  return (
    <div className="space-y-4">
      {tableMissing && (
        <div role="status" className="text-xs text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-lg p-3">
          <strong>One-time step:</strong> the media details table is not created yet. Files already work, but external images, alt text, categories and attribution need
          <code className="mx-1 px-1 bg-black/40 rounded">supabase/migration-004-media-skills-typography.sql</code> run once in the Supabase SQL Editor.
        </div>
      )}

      {/* upload + actions */}
      <div
        onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragOver(true); } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
        className={`p-3 rounded-xl border border-dashed transition-colors ${dragOver ? 'border-white bg-white/5' : 'border-white/20'}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 text-xs font-bold bg-white text-black rounded-lg cursor-pointer flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" />Upload images</button>
          <input ref={fileRef} type="file" multiple hidden accept="image/png,image/webp,image/jpeg,image/gif,image/svg+xml,image/avif" onChange={(e) => { if (e.target.files) upload(e.target.files); if (fileRef.current) fileRef.current.value = ''; }} />
          <label className="flex items-center gap-2 text-xs text-zinc-400">Save as
            <select value={uploadCat} onChange={(e) => setUploadCat(e.target.value as MediaCategory)} className={sel} aria-label="Category for new uploads">
              {MEDIA_CATEGORIES.filter((c) => c.id !== 'document').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setShowExternal((s) => !s)} className={btn}><Link2 className="w-3.5 h-3.5" />Add external image</button>
          <button type="button" onClick={reload} disabled={loading} className={`${btn} ml-auto`}>{loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}Rescan</button>
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">Drop files here or use the button. PNG, JPG, WebP, GIF, AVIF or SVG up to 15 MB each; large photos are resized automatically.</p>
        {jobs.length > 0 && (
          <ul className="mt-2 space-y-1" aria-live="polite">
            {jobs.slice(-6).map((j) => (
              <li key={j.id} className={`flex items-start gap-2 text-xs ${j.state === 'error' ? 'text-red-400' : j.state === 'done' ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {j.state === 'uploading' ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-px" /> : j.state === 'done' ? <Check className="w-3.5 h-3.5 shrink-0 mt-px" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />}
                <span className="min-w-0 break-words">{j.name}{j.message ? ` — ${j.message}` : j.state === 'done' ? ' — uploaded' : ''}</span>
              </li>
            ))}
            <li><button type="button" onClick={() => setJobs([])} className="text-[11px] text-zinc-500 underline cursor-pointer">Clear</button></li>
          </ul>
        )}
      </div>

      {showExternal && <ExternalForm defaultCategory={uploadCat} onCancel={() => setShowExternal(false)} onAdded={(a) => { setAssets((p) => [a, ...p]); setSelectedId(a.id); setShowExternal(false); setNotice({ ok: true, text: 'External image added.' }); }} />}
      {notice && <div role="status" className={`text-xs rounded-lg p-2.5 border ${notice.ok ? 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' : 'text-red-300 border-red-400/30 bg-red-500/10'}`}>{notice.text}</div>}
      {error && <div role="alert" className="text-xs text-red-300 border border-red-400/30 bg-red-500/10 rounded-lg p-2.5 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}<button type="button" onClick={reload} className="underline ml-auto cursor-pointer">Try again</button></div>}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, alt text, source…" aria-label="Search media" className={`${inputCls} pl-8`} />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value as any)} className={sel} aria-label="Filter by category">
          <option value="all">All categories</option>{MEDIA_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={src} onChange={(e) => setSrc(e.target.value as any)} className={sel} aria-label="Filter by origin">
          <option value="all">Uploaded + external</option><option value="upload">Uploaded by me</option><option value="external">External links</option>
        </select>
        <select value={use} onChange={(e) => setUse(e.target.value as any)} className={sel} aria-label="Filter by usage">
          <option value="all">Used + unused</option><option value="used">In use</option><option value="unused">Unused</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={sel} aria-label="Sort">
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option><option value="size">Largest first</option>
        </select>
      </div>
      <p className="text-[11px] text-zinc-500" aria-live="polite">{loading ? 'Loading…' : `${list.length} of ${counts.total} item${counts.total === 1 ? '' : 's'}${counts.ext ? ` · ${counts.ext} external` : ''}`}</p>

      <div className={`grid gap-4 ${selected ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : ''}`}>
        <div>
          {!loading && list.length === 0 && (
            <div className="p-10 text-center text-sm text-zinc-500 border border-dashed border-white/15 rounded-xl">
              {assets.length === 0 ? 'No media yet. Upload your first image above.' : 'Nothing matches these filters.'}
            </div>
          )}
          <ul className={`grid gap-3 grid-cols-2 sm:grid-cols-3 ${selected ? 'xl:grid-cols-3' : 'lg:grid-cols-4 xl:grid-cols-5'}`}>
            {list.map((a) => {
              const n = usage(a).length; const active = a.id === selectedId; const d = dims[a.id];
              return (
                <li key={a.id}>
                  <button type="button" onClick={() => setSelectedId(active ? null : a.id)} aria-pressed={active}
                    className={`w-full text-left rounded-xl border overflow-hidden bg-zinc-950 cursor-pointer transition-colors ${active ? 'border-white ring-1 ring-white' : 'border-white/15 hover:border-white/40'}`}>
                    <div className="relative">
                      <Thumb asset={a} onDims={onDims} className="aspect-square w-full" />
                      <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${a.source === 'external' ? 'bg-sky-500 text-black' : 'bg-black/80 text-zinc-200'}`}>{a.source === 'external' ? 'EXTERNAL' : 'UPLOADED'}</span>
                      </div>
                      <span className={`absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded font-bold ${n ? 'bg-emerald-400 text-black' : 'bg-amber-300 text-black'}`}>{n ? `USED ×${n}` : 'UNUSED'}</span>
                    </div>
                    <div className="p-2 space-y-0.5">
                      <div className="text-[11px] text-white truncate" title={a.filename}>{a.filename}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{typeOf(a)} · {a.source === 'external' ? 'linked' : formatBytes(a.size)}{(a.width ?? d?.w) ? ` · ${a.width ?? d?.w}×${a.height ?? d?.h}` : ''}</div>
                      <div className="text-[10px] text-zinc-600 truncate">{categoryLabel(a.category)}{a.createdAt ? ` · ${new Date(a.createdAt).toLocaleDateString()}` : ''}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {selected && (
          <aside aria-label="Image details" className="p-4 rounded-xl border border-white/15 bg-zinc-950 lg:sticky lg:top-20 self-start max-h-[calc(100dvh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Details</h3>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Close details" className="p-1 text-zinc-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <Detail asset={selected} usage={usage(selected)} mode={mode} dims={dims[selected.id]} replacing={replacing}
              onSaved={(a) => setAssets((p) => p.map((x) => (x.id === a.id ? { ...x, ...a } : x)))}
              onDelete={() => setToDelete(selected)} onReplace={(f) => replace(selected, f)}
              onPick={onPick ? () => onPick(selected) : undefined} />
          </aside>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete} danger busy={deleting}
        title={toDelete && (toDelete.source === 'external' || toDelete.missing) ? 'Remove this record?' : 'Delete this file permanently?'}
        confirmLabel={delUsage.length ? 'Delete anyway' : 'Delete'}
        requireTyping={delUsage.length ? 'DELETE' : undefined}
        onConfirm={confirmDelete} onCancel={() => setToDelete(null)}
      >
        {toDelete && (
          <>
            <p className="break-all"><strong className="text-white">{toDelete.filename}</strong></p>
            {delUsage.length > 0 ? (
              <div className="text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg p-3 space-y-1.5">
                <p className="font-semibold">Warning: this image is still used on your live site:</p>
                <ul className="text-xs space-y-0.5">{delUsage.map((u, i) => <li key={i}>• {u.area}{u.label ? ` · ${u.label}` : ''} ({u.field})</li>)}</ul>
                <p className="text-xs">Those places will show a broken image until you choose another one.</p>
              </div>
            ) : <p className="text-xs text-zinc-400">It is not used anywhere on the saved site.</p>}
            <p className="text-xs text-zinc-400">{toDelete.source === 'external' ? 'Only the link is removed. The image on the other website is not affected.' : 'This cannot be undone.'}</p>
          </>
        )}
      </ConfirmDialog>
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ picker modal

export const MediaPickerDialog: React.FC<{ onSelect: (a: MediaAsset) => void; onClose: () => void; defaultCategory?: MediaCategory }> = ({ onSelect, onClose, defaultCategory }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center sm:p-6" role="dialog" aria-modal="true" aria-label="Choose an image from the media library">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/85" onClick={onClose} />
      <div className="relative w-full max-w-6xl max-h-full sm:max-h-[92dvh] overflow-y-auto bg-black border border-white/20 sm:rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2"><Images className="w-4 h-4" />Media Library</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-zinc-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <MediaBrowser mode="pick" onPick={onSelect} defaultCategory={defaultCategory} />
      </div>
    </div>
  );
};

export const MediaLibraryAdmin: React.FC = () => (
  <div className="space-y-4">
    <p className="text-xs text-zinc-500 max-w-2xl">Every image you upload lives here once and can be re-used anywhere (projects, profile, experience, skills) via the “Media Library” button. External images (Unsplash, Pexels…) are linked, not copied: record the licence and credit so you always know the terms.</p>
    <MediaBrowser mode="manage" />
  </div>
);
