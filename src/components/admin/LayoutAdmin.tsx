import React, { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, EyeOff, GripVertical, RotateCcw } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { DEFAULT_LAYOUT, SECTION_REGISTRY, SectionConfig, SectionId } from '../../lib/sections';
import { DEFAULT_TEXTS } from '../../lib/defaults';
import { SaveBar } from './SaveBar';
import { useDraft, useSaver } from './AdminDirty';
import { inputCls } from './RecordsEditor';

interface Props { onNavigate: (page: string) => void }

type Draft = { layout: SectionConfig[]; texts: Record<string, string> };

/** Sections & Layout: order, visibility, labels and the headings of every section, saved together. */
export const LayoutAdmin: React.FC<Props> = ({ onNavigate }) => {
  const { settings, saveSetting } = useContent();

  // Only the text keys that belong to sections are edited here; everything else in `texts` is merged back untouched on save.
  const textKeys = useMemo(() => Array.from(new Set(Object.values(SECTION_REGISTRY).flatMap((m) => m.textFields.map((f) => f.key)))), []);
  const source = useMemo<Draft>(() => ({
    layout: settings.layout,
    texts: Object.fromEntries(textKeys.map((k) => [k, settings.texts[k] ?? DEFAULT_TEXTS[k] ?? ''])),
  }), [settings.layout, settings.texts, textKeys]);

  const { draft, setDraft, dirty, discard } = useDraft<Draft>(source);
  const { state, run } = useSaver();
  const [open, setOpen] = useState<SectionId | null>(null);
  const dragId = useRef<SectionId | null>(null);
  const [overId, setOverId] = useState<SectionId | null>(null);

  const setLayout = (fn: (l: SectionConfig[]) => SectionConfig[]) => setDraft((d) => ({ ...d, layout: fn(d.layout) }));
  const move = (i: number, dir: -1 | 1) => setLayout((l) => {
    const j = i + dir; if (j < 0 || j >= l.length) return l;
    const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  const patchSection = (id: SectionId, p: Partial<SectionConfig>) => setLayout((l) => l.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const setText = (k: string, v: string) => setDraft((d) => ({ ...d, texts: { ...d.texts, [k]: v } }));

  const drop = (targetId: SectionId) => {
    const from = dragId.current; dragId.current = null; setOverId(null);
    if (!from || from === targetId) return;
    setLayout((l) => {
      const n = [...l]; const a = n.findIndex((s) => s.id === from); const b = n.findIndex((s) => s.id === targetId);
      if (a < 0 || b < 0) return l;
      const [item] = n.splice(a, 1); n.splice(b, 0, item); return n;
    });
  };

  const save = () => run(async () => {
    // layout first, then texts merged onto the LATEST saved texts so unrelated edits are never overwritten
    await saveSetting('layout', draft.layout);
    await saveSetting('texts', { ...settings.texts, ...draft.texts });
  });

  const reset = () => {
    if (confirm('Reset section order, visibility and labels to the defaults? (Your texts and content are not touched. Press Save to apply.)')) {
      setLayout(() => DEFAULT_LAYOUT.map((s) => ({ ...s })));
    }
  };

  const hiddenCount = draft.layout.filter((s) => !s.visible).length;

  return (
    <div className="space-y-5">
      <SaveBar title="Sections & Layout" dirty={dirty} state={state} onSave={save} onDiscard={discard}>
        <button type="button" onClick={reset} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-white/20 rounded-lg text-zinc-200 hover:bg-white/10 cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </SaveBar>

      <p className="text-xs text-zinc-500 max-w-2xl">
        Drag a row (or use the arrows) to change the order of the public page. Hidden sections are removed from the page and its navigation, but their content is kept.
        Open a section to rename its headings (or use Section Headings for all of them at once).
      </p>

      {/* Order preview */}
      <div className="p-3 rounded-xl border border-white/10 bg-zinc-950" aria-label="Page order preview">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Page order preview{hiddenCount ? ` · ${hiddenCount} hidden` : ''}</div>
        <ol className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {draft.layout.map((s, i) => (
            <li key={s.id} className={`px-2 py-1 rounded-md border ${s.visible ? 'border-white/25 text-white' : 'border-white/10 text-zinc-600 line-through'}`}>
              {i + 1}. {s.label}
            </li>
          ))}
        </ol>
      </div>

      <ul className="space-y-2">
        {draft.layout.map((s, i) => {
          const meta = SECTION_REGISTRY[s.id];
          const expanded = open === s.id;
          return (
            <li
              key={s.id}
              draggable
              onDragStart={(e) => { dragId.current = s.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', s.id); }}
              onDragOver={(e) => { e.preventDefault(); if (overId !== s.id) setOverId(s.id); }}
              onDragLeave={() => setOverId((o) => (o === s.id ? null : o))}
              onDrop={(e) => { e.preventDefault(); drop(s.id); }}
              onDragEnd={() => { dragId.current = null; setOverId(null); }}
              className={`border rounded-xl bg-zinc-950 transition-colors ${overId === s.id ? 'border-white' : s.visible ? 'border-white/15' : 'border-white/10 opacity-70'}`}
            >
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5">
                <span className="p-2 text-zinc-600 cursor-grab hidden sm:block" aria-hidden="true" title="Drag to reorder"><GripVertical className="w-4 h-4" /></span>
                <span className="w-6 text-center text-[11px] font-mono-code text-zinc-500 shrink-0">{i + 1}</span>
                <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : s.id)}
                  className="flex-1 min-w-0 flex items-center gap-2 text-left text-sm text-white cursor-pointer py-2">
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  <span className="truncate font-semibold">{s.label}</span>
                  {!s.visible && <span className="shrink-0 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300"><EyeOff className="w-3 h-3" />Hidden</span>}
                </button>
                <label className="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer px-1 shrink-0">
                  <span className="hidden sm:inline">{s.visible ? 'Visible' : 'Hidden'}</span>
                  <input type="checkbox" role="switch" className="w-4 h-4 accent-white" checked={s.visible}
                    aria-label={`Show ${s.label} on the site`} onChange={(e) => patchSection(s.id, { visible: e.target.checked })} />
                </label>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${s.label} up`} className="p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === draft.layout.length - 1} aria-label={`Move ${s.label} down`} className="p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
              </div>

              {expanded && (
                <div className="px-3 sm:px-4 pb-4 pt-4 border-t border-white/10 grid gap-4">
                  <p className="text-xs text-zinc-500">{meta.description}</p>
                  <div className="grid gap-1.5">
                    <label htmlFor={`lbl-${s.id}`} className="text-[10px] uppercase tracking-wider text-zinc-500">Section name (admin & previews)</label>
                    <input id={`lbl-${s.id}`} className={inputCls} value={s.label} maxLength={80} onChange={(e) => patchSection(s.id, { label: e.target.value })} />
                  </div>
                  {meta.textFields.map((f) => (
                    <div key={f.key} className="grid gap-1.5 min-w-0">
                      <label htmlFor={`${s.id}-${f.key}`} className="text-[10px] uppercase tracking-wider text-zinc-500">{f.label}</label>
                      {f.multiline
                        ? <textarea id={`${s.id}-${f.key}`} rows={2} className={inputCls} value={draft.texts[f.key] ?? ''} onChange={(e) => setText(f.key, e.target.value)} />
                        : <input id={`${s.id}-${f.key}`} className={inputCls} value={draft.texts[f.key] ?? ''} onChange={(e) => setText(f.key, e.target.value)} />}
                    </div>
                  ))}
                  {s.id === 'hero' && (
                    <button type="button" onClick={() => onNavigate('profile')} className="self-start inline-flex items-center gap-1.5 text-xs text-white underline underline-offset-4 cursor-pointer">
                      Edit hero heading & sub-text <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                  {s.id === 'skills' && <button type="button" onClick={() => onNavigate('skills')} className="self-start text-xs text-white underline underline-offset-4 cursor-pointer">Manage skills →</button>}
                  {s.id === 'projects' && <button type="button" onClick={() => onNavigate('Projects')} className="self-start text-xs text-white underline underline-offset-4 cursor-pointer">Manage My Own Projects →</button>}
                  {s.id === 'advertising' && <button type="button" onClick={() => onNavigate('Advertising')} className="self-start text-xs text-white underline underline-offset-4 cursor-pointer">Manage Advertising work →</button>}
                  {s.id === 'contact' && <button type="button" onClick={() => onNavigate('Contact form')} className="self-start text-xs text-white underline underline-offset-4 cursor-pointer">Edit enquiry-type suggestions →</button>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
