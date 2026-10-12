import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, HardDrive, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useMediaLibrary } from './useMediaLibrary';
import { ConfirmDialog } from './ConfirmDialog';
import { hasUnsavedChanges } from './AdminDirty';
import { inputCls } from './RecordsEditor';
import { categoryLabel, deleteAssets, formatBytes, MEDIA_CATEGORIES, MediaAsset } from '../../lib/media';

const QUOTA_KEY = 'admin_storage_quota_mb';
const readQuota = () => { try { const n = Number(localStorage.getItem(QUOTA_KEY)); return n > 0 ? n : 1024; } catch { return 1024; } };

export const StorageAdmin: React.FC = () => {
  const { assets, loading, error, tableMissing, reload, usage } = useMediaLibrary();
  const [quotaMb, setQuotaMb] = useState(readQuota);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<'unused' | 'missing' | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const stats = useMemo(() => {
    const files = assets.filter((a) => a.source === 'upload' && !a.missing);
    const bytes = files.reduce((n, a) => n + (a.size ?? 0), 0);
    const byCat = MEDIA_CATEGORIES.map((c) => ({ ...c, bytes: files.filter((a) => a.category === c.id).reduce((n, a) => n + (a.size ?? 0), 0), count: files.filter((a) => a.category === c.id).length })).filter((c) => c.count);
    const unused = files.filter((a) => usage(a).length === 0);
    const used = files.length - unused.length;
    const missing = assets.filter((a) => a.missing);
    const external = assets.filter((a) => a.source === 'external');
    const biggest = [...files].sort((a, b) => (b.size ?? 0) - (a.size ?? 0)).slice(0, 5);
    return { files, bytes, byCat, unused, used, missing, external, biggest };
  }, [assets, usage]);

  const quotaBytes = quotaMb * 1024 * 1024;
  const pct = Math.min(100, (stats.bytes / quotaBytes) * 100);
  const unusedBytes = stats.unused.reduce((n, a) => n + (a.size ?? 0), 0);

  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allPicked = stats.unused.length > 0 && stats.unused.every((a) => picked.has(a.id));
  const pickedAssets = stats.unused.filter((a) => picked.has(a.id));

  const run = async (targets: MediaAsset[]) => {
    setBusy(true); setNotice(null);
    // Final safety net: only files that are STILL unreferenced right now are deleted, whatever was on screen.
    const safe = targets.filter((a) => a.missing || usage(a).length === 0);
    const skipped = targets.length - safe.length;
    const res = await deleteAssets(safe);
    setBusy(false); setConfirm(null); setPicked(new Set());
    const parts = [`Deleted ${res.deleted.length} item${res.deleted.length === 1 ? '' : 's'}.`];
    if (skipped) parts.push(`${skipped} skipped because they are now in use.`);
    if (res.failed.length) parts.push(`${res.failed.length} failed: ${res.failed[0].reason}`);
    setNotice({ ok: res.failed.length === 0, text: parts.join(' ') });
    reload();
  };

  const startUnusedDelete = () => {
    if (hasUnsavedChanges() && !window.confirm('You have unsaved edits elsewhere in the dashboard. An image they would start using may look "unused" here. Continue anyway?')) return;
    setConfirm('unused');
  };

  return (
    <div className="space-y-6">
      {tableMissing && <div role="status" className="text-xs text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-lg p-3">Storage figures are complete, but file details need <code className="px-1 bg-black/40 rounded">migration-004</code> (run once in the Supabase SQL Editor).</div>}
      {error && <div role="alert" className="text-xs text-red-300 border border-red-400/30 bg-red-500/10 rounded-lg p-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}<button onClick={reload} className="underline ml-auto cursor-pointer">Try again</button></div>}
      {notice && <div role="status" className={`text-xs rounded-lg p-3 border ${notice.ok ? 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' : 'text-red-300 border-red-400/30 bg-red-500/10'}`}>{notice.text}</div>}

      {/* usage */}
      <section className="p-4 sm:p-5 rounded-xl border border-white/10 bg-zinc-950 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <HardDrive className="w-5 h-5 text-white" aria-hidden="true" />
          <h3 className="text-sm font-bold text-white mr-auto">Storage used</h3>
          <button type="button" onClick={reload} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/20 rounded-lg text-zinc-200 hover:border-white/50 cursor-pointer disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}Refresh
          </button>
        </div>
        <div>
          <div className="flex items-baseline justify-between text-xs mb-1.5"><span className="text-white font-bold text-lg tabular-nums">{formatBytes(stats.bytes)}</span><span className="text-zinc-500">of {formatBytes(quotaBytes)} ({pct.toFixed(1)}%)</span></div>
          <div role="progressbar" aria-label="Storage used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-300' : 'bg-white'}`} style={{ width: `${pct}%` }} />
          </div>
          <label className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            Your plan’s storage limit (MB):
            <input type="number" min={1} value={quotaMb} onChange={(e) => { const n = Math.max(1, Number(e.target.value) || 1); setQuotaMb(n); try { localStorage.setItem(QUOTA_KEY, String(n)); } catch { /* ignore */ } }} className={`${inputCls} !w-28`} />
            <span>Supabase does not expose your quota to the browser, so enter it yourself (the free plan is 1024 MB). Saved in this browser only.</span>
          </label>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[['Files', stats.files.length], ['In use', stats.used], ['Unused', stats.unused.length], ['External links', stats.external.length]].map(([k, v]) => (
            <div key={k as string} className="p-3 rounded-lg bg-black border border-white/10"><dd className="text-xl font-bold text-white tabular-nums">{v}</dd><dt className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</dt></div>
          ))}
        </dl>
        {stats.byCat.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">By category</div>
            {stats.byCat.map((c) => (
              <div key={c.id} className="flex items-center gap-3 text-xs">
                <span className="w-40 shrink-0 truncate text-zinc-300">{c.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-white/70" style={{ width: `${stats.bytes ? (c.bytes / stats.bytes) * 100 : 0}%` }} /></div>
                <span className="w-24 text-right text-zinc-500 tabular-nums">{formatBytes(c.bytes)} · {c.count}</span>
              </div>
            ))}
          </div>
        )}
        {stats.biggest.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Largest files</div>
            <ul className="space-y-1 text-xs text-zinc-300">{stats.biggest.map((a) => <li key={a.id} className="flex justify-between gap-3"><span className="truncate">{a.filename}</span><span className="tabular-nums text-zinc-500 shrink-0">{formatBytes(a.size)}</span></li>)}</ul>
          </div>
        )}
      </section>

      {/* unused */}
      <section className="p-4 sm:p-5 rounded-xl border border-white/10 bg-zinc-950 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-bold text-white mr-auto">Unused files <span className="text-zinc-500 font-normal">({stats.unused.length} · {formatBytes(unusedBytes)})</span></h3>
          {stats.unused.length > 0 && (
            <>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-white" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(stats.unused.map((a) => a.id)))} />Select all</label>
              <button type="button" disabled={pickedAssets.length === 0} onClick={startUnusedDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-red-400/40 text-red-300 hover:bg-red-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" />Delete selected ({pickedAssets.length})</button>
            </>
          )}
        </div>
        <p className="text-[11px] text-zinc-500">“Unused” = not referenced by any saved content (profile, projects, campaigns, experience, skills, CV…). Files in use are never listed here and are re-checked right before deletion. Unsaved edits in other tabs are not visible to this check.</p>
        {loading && stats.files.length === 0 ? <p className="text-xs text-zinc-500">Scanning…</p>
          : stats.unused.length === 0 ? <p className="flex items-center gap-2 text-xs text-emerald-400"><CheckCircle2 className="w-4 h-4" />Nothing to clean up: every file is in use.</p>
          : (
            <ul className="divide-y divide-white/5 border border-white/10 rounded-lg overflow-hidden">
              {stats.unused.map((a) => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 p-2.5 hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-white shrink-0" checked={picked.has(a.id)} onChange={() => toggle(a.id)} aria-label={`Select ${a.filename}`} />
                    <span className="checkerboard w-10 h-10 rounded shrink-0 overflow-hidden">{/\.pdf$/i.test(a.filename) ? null : <img src={a.url} alt="" loading="lazy" className="w-full h-full object-contain" />}</span>
                    <span className="min-w-0 flex-1"><span className="block text-xs text-white truncate">{a.filename}</span><span className="block text-[10px] text-zinc-500">{categoryLabel(a.category)} · {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</span></span>
                    <span className="text-xs text-zinc-400 tabular-nums shrink-0">{formatBytes(a.size)}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
      </section>

      {/* missing */}
      {stats.missing.length > 0 && (
        <section className="p-4 sm:p-5 rounded-xl border border-amber-400/30 bg-amber-500/5 space-y-3">
          <h3 className="text-sm font-bold text-white">Records without a file ({stats.missing.length})</h3>
          <p className="text-[11px] text-zinc-400">These entries exist in the media table but the file is gone from storage.</p>
          <ul className="space-y-1 text-xs text-zinc-300">{stats.missing.map((a) => <li key={a.id} className="truncate">{a.filename}{usage(a).length ? <span className="text-red-300"> — still referenced by {usage(a).length} place(s)</span> : ''}</li>)}</ul>
          <button type="button" onClick={() => setConfirm('missing')} className="px-3 py-2 text-xs rounded-lg border border-amber-400/40 text-amber-200 hover:bg-amber-500/10 cursor-pointer">Remove these records</button>
        </section>
      )}

      <ConfirmDialog open={confirm === 'unused'} danger busy={busy} title={`Permanently delete ${pickedAssets.length} unused file${pickedAssets.length === 1 ? '' : 's'}?`}
        confirmLabel="Delete permanently" onConfirm={() => run(pickedAssets)} onCancel={() => setConfirm(null)}>
        <p>This frees about <strong className="text-white">{formatBytes(pickedAssets.reduce((n, a) => n + (a.size ?? 0), 0))}</strong> and cannot be undone.</p>
        <ul className="text-xs text-zinc-400 max-h-32 overflow-y-auto space-y-0.5">{pickedAssets.slice(0, 40).map((a) => <li key={a.id} className="truncate">• {a.filename}</li>)}{pickedAssets.length > 40 && <li>…and {pickedAssets.length - 40} more</li>}</ul>
      </ConfirmDialog>
      <ConfirmDialog open={confirm === 'missing'} busy={busy} title="Remove these records?" confirmLabel="Remove records" onConfirm={() => run(stats.missing)} onCancel={() => setConfirm(null)}>
        <p>Only the database records are removed (there is no file to delete).</p>
      </ConfirmDialog>
    </div>
  );
};
