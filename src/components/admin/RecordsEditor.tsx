import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { SaveBar } from './SaveBar';
import { useDraft, useSaver } from './AdminDirty';

type Base = { key: string; label: string; hint?: string };
export type Field =
  | (Base & { type: 'text' | 'textarea' | 'bool' })
  | (Base & { type: 'image'; folder: string })
  | (Base & { type: 'select'; options: string[] })
  | (Base & { type: 'combo'; options: string[] })   // free text with suggestions
  | (Base & { type: 'lines' })   // string[]: one per line
  | (Base & { type: 'tags' })    // string[]: comma separated
  | (Base & { type: 'pairs' });  // {label,value}[]: "label | value" per line

export const inputCls = 'w-full px-3 py-2 text-xs bg-black border border-white/15 rounded-lg text-white placeholder-zinc-600 focus:border-white/50 outline-none';

function FieldControl({ f, value, onChange, id }: { f: Field; value: any; onChange: (v: any) => void; id: string }) {
  switch (f.type) {
    case 'textarea':
      return <textarea id={id} rows={4} className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'bool':
      return <input id={id} type="checkbox" className="w-4 h-4 accent-white" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
    case 'image':
      return <ImageUploader value={value ?? ''} onChange={(url) => onChange(url)} folder={f.folder} />;
    case 'select':
      return (
        <select id={id} className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {f.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      );
    case 'combo':
      return (
        <>
          <input id={id} list={`${id}-list`} className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
          <datalist id={`${id}-list`}>{f.options.map((o) => <option key={o} value={o} />)}</datalist>
        </>
      );
    case 'lines':
      return <textarea id={id} rows={4} className={inputCls} value={(value ?? []).join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} />;
    case 'tags':
      return <input id={id} className={inputCls} value={(value ?? []).join(', ')} onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trimStart()))} />;
    case 'pairs':
      return <textarea id={id} rows={3} className={inputCls} placeholder="Label | Value (one per line)"
        value={(value ?? []).map((p: any) => `${p.label} | ${p.value}`).join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n').map((l) => {
          const [label, ...rest] = l.split('|'); return { label: label.trim(), value: rest.join('|').trim() };
        }))} />;
    default:
      return <input id={id} className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** Strip empty lines / blank tags right before saving (and before comparing, so they never count as "changes") */
const clean = (items: any[], fields: Field[]) => items.map((it) => {
  const o = { ...it };
  fields.forEach((f) => {
    if (f.type === 'lines' || f.type === 'tags') o[f.key] = (o[f.key] ?? []).map((s: string) => s.trim()).filter(Boolean);
    if (f.type === 'pairs') o[f.key] = (o[f.key] ?? []).filter((p: any) => p.label || p.value);
  });
  return o;
});

interface Props<T extends { id: string }> {
  title: string;
  description?: string;
  items: T[];
  fields: Field[];
  titleKey: keyof T;
  blank: () => T;
  onSave: (items: T[]) => Promise<void>;
  /** Key of a boolean that hides the record on the public site without deleting it (e.g. "visible") */
  visibleKey?: string;
  emptyText?: string;
  addLabel?: string;
}

export function RecordsEditor<T extends { id: string }>({
  title, description, items, fields, titleKey, blank, onSave, visibleKey, emptyText = 'Nothing here yet.', addLabel = 'Add',
}: Props<T>) {
  const { draft, setDraft, dirty, discard } = useDraft<T[]>(items, (v) => clean(v, fields));
  const [open, setOpen] = useState<string | null>(null);
  const { state, run } = useSaver();

  const patch = (i: number, k: string, v: any) => setDraft((d) => d.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const move = (i: number, dir: -1 | 1) => setDraft((d) => {
    const n = [...d]; const j = i + dir; if (j < 0 || j >= n.length) return d;
    [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  const save = () => run(() => onSave(clean(draft, fields) as T[]));
  const isVisible = (it: T) => (visibleKey ? (it as any)[visibleKey] !== false : true);

  return (
    <div className="space-y-4">
      <SaveBar title={`${title} (${draft.length})`} dirty={dirty} state={state} onSave={save} onDiscard={discard}>
        <button type="button" onClick={() => { const b = blank(); setDraft((d) => [...d, b]); setOpen(b.id); }}
          className="flex items-center gap-1 px-3 py-2 text-xs border border-white/20 rounded-lg text-white hover:bg-white/10 cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </button>
      </SaveBar>
      {description && <p className="text-xs text-zinc-500 max-w-2xl">{description}</p>}

      {draft.length === 0 && (
        <div className="p-8 text-center text-sm text-zinc-500 border border-dashed border-white/15 rounded-xl">{emptyText}</div>
      )}

      {draft.map((it, i) => {
        const name = String(it[titleKey] || '(untitled)');
        const expanded = open === it.id;
        return (
          <div key={it.id} className={`border rounded-xl bg-zinc-950 ${isVisible(it) ? 'border-white/15' : 'border-white/10 opacity-70'}`}>
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5">
              <button type="button" aria-expanded={expanded} className="flex-1 min-w-0 flex items-center gap-2 text-left text-xs text-white cursor-pointer py-2"
                onClick={() => setOpen(expanded ? null : it.id)}>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                <span className="truncate">{name}</span>
                {!isVisible(it) && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Hidden</span>}
              </button>
              {visibleKey && (
                <button type="button" onClick={() => patch(i, visibleKey, !isVisible(it))}
                  aria-label={isVisible(it) ? `Hide ${name} on the site` : `Show ${name} on the site`} title={isVisible(it) ? 'Visible: click to hide' : 'Hidden: click to show'}
                  className="p-2 text-zinc-400 hover:text-white cursor-pointer">
                  {isVisible(it) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              )}
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${name} up`} className="p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === draft.length - 1} aria-label={`Move ${name} down`} className="p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
              <button type="button" aria-label={`Delete ${name}`}
                onClick={() => confirm(`Delete "${name}"?\n\nIt is removed from the site permanently once you press Save.`) && setDraft((d) => d.filter((_, j) => j !== i))}
                className="p-2 text-zinc-500 hover:text-red-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
            {expanded && (
              <div className="px-3 sm:px-4 pb-4 grid gap-4 border-t border-white/10 pt-4">
                {fields.map((f) => {
                  const fid = `${it.id}-${f.key}`;
                  return f.type === 'bool' ? (
                    <label key={f.key} htmlFor={fid} className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                      <FieldControl id={fid} f={f} value={(it as any)[f.key]} onChange={(v) => patch(i, f.key, v)} />
                      {f.label}
                    </label>
                  ) : (
                    <div key={f.key} className="grid gap-1.5 min-w-0">
                      <label htmlFor={fid} className="text-[10px] uppercase tracking-wider text-zinc-500">{f.label}</label>
                      <FieldControl id={fid} f={f} value={(it as any)[f.key]} onChange={(v) => patch(i, f.key, v)} />
                      {f.hint && <span className="text-[10px] text-zinc-600">{f.hint}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
