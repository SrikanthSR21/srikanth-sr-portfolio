import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { httpUrl } from '../../lib/links';
import { inputCls } from './RecordsEditor';
import { useDirtyFlag, useSaver } from './AdminDirty';
import { ProjectItem } from '../../types';

const uid = () => `proj-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
const hostOf = (u: string) => { try { return new URL(u).host; } catch { return u; } };
const NAME_MAX = 80;
const DESC_MAX = 240;

type Form = { name: string; url: string; desc: string; position: number };

/**
 * Simple manager for "My Own Projects": name + website URL (required), short description (optional).
 * Every action saves straight to the existing Supabase `projects` table (same rows the old editor used), so the
 * public site updates automatically. The list order here IS the order on the website (1st, 2nd, …).
 */
export const ProjectsAdmin: React.FC = () => {
  const c = useContent();
  const projects = c.collections.projects;
  const { state, run } = useSaver();
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm = (position: number): Form => ({ name: '', url: '', desc: '', position });
  const [form, setForm] = useState<Form>(() => emptyForm(projects.length + 1));
  const [touched, setTouched] = useState(false);
  const busy = state.kind === 'saving';

  const editing = editingId ? projects.find((p) => p.id === editingId) : undefined;
  const slots = editing ? projects.length : projects.length + 1;

  const formDirty = useMemo(() => {
    if (editing) {
      return form.name !== editing.title || form.url !== editing.liveUrl || form.desc !== (editing.shortDesc ?? '')
        || form.position !== projects.indexOf(editing) + 1;
    }
    return !!(form.name || form.url || form.desc);
  }, [form, editing, projects]);
  useDirtyFlag(formDirty);

  const nameErr = !form.name.trim() ? 'Project name is required.' : '';
  const urlErr = !form.url.trim() ? 'Website URL is required.' : !httpUrl(form.url) ? 'Enter a valid link starting with http:// or https://' : '';
  const showErr = touched && (nameErr || urlErr);

  const resetForm = (position = projects.length + 1) => { setEditingId(null); setForm(emptyForm(position)); setTouched(false); };

  /** Persist a full, ordered list (array index = order on the site) */
  const persist = (next: ProjectItem[], after?: () => void) => run(async () => { await c.saveCollection('projects', next); after?.(); });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameErr || urlErr || busy) return;
    const url = httpUrl(form.url);
    const next = [...projects];
    if (editing) {
      const idx = next.findIndex((p) => p.id === editing.id);
      const updated: ProjectItem = { ...next[idx], title: form.name.trim(), liveUrl: url, shortDesc: form.desc.trim() };
      next.splice(idx, 1);
      next.splice(Math.min(Math.max(form.position - 1, 0), next.length), 0, updated);
    } else {
      const created: ProjectItem = {
        id: uid(), title: form.name.trim(), liveUrl: url, shortDesc: form.desc.trim(), visible: true,
        // legacy fields kept empty so the shared ProjectItem type (and older saved rows) keep working
        client: '', category: '', role: '', fullDesc: '', heroImage: '', year: '', tags: [], metrics: '',
      };
      next.splice(Math.min(Math.max(form.position - 1, 0), next.length), 0, created);
    }
    persist(next, () => resetForm(next.length + 1));
  };

  const startEdit = (p: ProjectItem) => {
    setEditingId(p.id); setTouched(false);
    setForm({ name: p.title, url: p.liveUrl, desc: p.shortDesc ?? '', position: projects.indexOf(p) + 1 });
    document.getElementById('project-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const remove = (p: ProjectItem) => {
    if (busy || !confirm(`Delete "${p.title}"?\n\nIt is removed from your website permanently.`)) return;
    persist(projects.filter((x) => x.id !== p.id), () => { if (editingId === p.id) resetForm(projects.length); });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (busy || j < 0 || j >= projects.length) return;
    const next = [...projects]; [next[i], next[j]] = [next[j], next[i]];
    persist(next);
  };
  const toggleVisible = (p: ProjectItem) => persist(projects.map((x) => (x.id === p.id ? { ...x, visible: x.visible === false } : x)));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mr-auto">My Own Projects ({projects.length})</h3>
        <div aria-live="polite" className="text-xs">
          {state.kind === 'saving' && <span className="text-zinc-300">Saving…</span>}
          {state.kind === 'saved' && <span className="text-emerald-400">Saved: live on the site</span>}
          {state.kind === 'error' && <span role="alert" className="text-red-400">{state.message}</span>}
        </div>
      </div>
      <p className="text-xs text-zinc-500">Add the websites you built. Each one appears on your site as a card with a “Launch Project ↗” button. The order below is the order visitors see: 1st is shown first. Changes save instantly.</p>

      {/* ---------- Add / Edit form ---------- */}
      <form id="project-form" onSubmit={submit} noValidate className="p-4 sm:p-5 space-y-4 rounded-xl border border-white/15 bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">{editing ? `Edit: ${editing.title}` : 'Add a project'}</h4>
          {editing && (
            <button type="button" onClick={() => resetForm()} className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /> Cancel</button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Project name *</span>
            <input className={inputCls} value={form.name} maxLength={NAME_MAX} placeholder="e.g. Orderbix Storefront" aria-invalid={touched && !!nameErr}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            {touched && nameErr && <span role="alert" className="text-[11px] text-red-400">{nameErr}</span>}
          </label>
          <label className="grid gap-1.5 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Website URL *</span>
            <input className={inputCls} value={form.url} inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://your-project.com" aria-invalid={touched && !!urlErr}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            {touched && urlErr && <span role="alert" className="text-[11px] text-red-400">{urlErr}</span>}
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Short description (optional)</span>
          <textarea rows={3} className={inputCls} value={form.desc} maxLength={DESC_MAX} placeholder="One or two lines about what this project is."
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
          <span className="text-[10px] text-zinc-600 text-right tabular-nums">{form.desc.length}/{DESC_MAX}</span>
        </label>

        <label className="grid gap-1.5 max-w-xs">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Position on the website</span>
          <select className={inputCls} value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) }))}>
            {Array.from({ length: slots }, (_, k) => k + 1).map((n) => (
              <option key={n} value={n}>{n === 1 ? '1st (shown first)' : n === slots ? `${n}${n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} (last)` : `${n}${n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`}</option>
            ))}
          </select>
        </label>

        {showErr && <p role="alert" className="text-xs text-red-400">Please fix the highlighted fields.</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white text-black rounded-lg hover:bg-zinc-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {editing ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}{editing ? 'Save changes' : 'Add project'}
          </button>
          {(formDirty || editing) && (
            <button type="button" onClick={() => resetForm()} className="px-3 py-2 text-xs text-zinc-300 border border-white/20 rounded-lg hover:border-white/50 cursor-pointer">{editing ? 'Cancel' : 'Clear'}</button>
          )}
        </div>
      </form>

      {/* ---------- Ordered list ---------- */}
      {projects.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500 border border-dashed border-white/15 rounded-xl">No projects yet. Add your first one above.</div>
      ) : (
        <ol className="space-y-2">
          {projects.map((p, i) => {
            const hidden = p.visible === false;
            const valid = !!httpUrl(p.liveUrl);
            return (
              <li key={p.id} className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl border bg-zinc-950 ${editingId === p.id ? 'border-white/60' : 'border-white/15'} ${hidden ? 'opacity-70' : ''}`}>
                <span className="shrink-0 w-7 h-7 rounded-lg border border-white/15 flex items-center justify-center text-[11px] font-mono-code text-zinc-300 tabular-nums" aria-label={`Position ${i + 1}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-xs font-semibold text-white">{p.title || '(untitled)'}</span>
                    {hidden && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Hidden</span>}
                  </div>
                  <div className={`truncate text-[11px] font-mono-code ${valid ? 'text-zinc-500' : 'text-red-400'}`}>{valid ? hostOf(httpUrl(p.liveUrl)) : 'Invalid or missing URL: edit to fix'}</div>
                </div>
                <div className="flex items-center shrink-0">
                  <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label={`Move ${p.title} up`} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={busy || i === projects.length - 1} aria-label={`Move ${p.title} down`} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => toggleVisible(p)} disabled={busy} aria-label={hidden ? `Show ${p.title} on the site` : `Hide ${p.title} on the site`} title={hidden ? 'Hidden: click to show' : 'Visible: click to hide'} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30">{hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  <button type="button" onClick={() => startEdit(p)} aria-label={`Edit ${p.title}`} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white cursor-pointer"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={() => remove(p)} disabled={busy} aria-label={`Delete ${p.title}`} className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-400 cursor-pointer disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
