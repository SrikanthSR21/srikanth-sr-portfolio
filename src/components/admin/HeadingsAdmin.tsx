import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { DEFAULT_TEXTS } from '../../lib/defaults';
import { SECTION_REGISTRY } from '../../lib/sections';
import { SaveBar } from './SaveBar';
import { useDraft, useSaver } from './AdminDirty';
import { inputCls } from './RecordsEditor';

/** Central place to rename every heading. Stored in the existing `texts` setting; section ids (anchors, nav links) never change. */
export const HeadingsAdmin: React.FC = () => {
  const { settings, saveSetting } = useContent();
  const order = settings.layout.map((s) => s.id);
  const keys = useMemo(() => order.flatMap((id) => SECTION_REGISTRY[id].textFields.map((f) => f.key)), [order.join(',')]);
  const source = useMemo(() => Object.fromEntries(keys.map((k) => [k, settings.texts[k] ?? DEFAULT_TEXTS[k] ?? ''])) as Record<string, string>, [keys, settings.texts]);
  const { draft, setDraft, dirty, discard } = useDraft<Record<string, string>>(source);
  const { state, run } = useSaver();
  const [q, setQ] = useState('');

  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const save = () => run(() => saveSetting('texts', { ...settings.texts, ...draft }));
  const resetAll = () => { if (confirm('Reset ALL headings below to the built-in defaults? Press Save afterwards to apply.')) setDraft((d) => ({ ...d, ...Object.fromEntries(keys.map((k) => [k, DEFAULT_TEXTS[k] ?? ''])) })); };
  const needle = q.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <SaveBar title="Section headings" dirty={dirty} state={state} onSave={save} onDiscard={discard}>
        <button type="button" onClick={resetAll} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-white/20 rounded-lg text-zinc-200 hover:bg-white/10 cursor-pointer"><RotateCcw className="w-3.5 h-3.5" />Reset all</button>
      </SaveBar>
      <p className="text-xs text-zinc-500 max-w-2xl">
        Rename any heading, eyebrow or subtitle. Changes go live as soon as you save, with no code change or redeploy. Renaming never affects the section’s internal id, so navbar links, anchors and saved content keep working.
        To colour a few words, wrap them in <code className="px-1 bg-white/10 rounded">==double equals==</code> (styled under Typography &amp; Highlights). Navbar link names are under Navbar Links.
      </p>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search headings…" aria-label="Search headings" className={`${inputCls} max-w-sm`} />

      {order.map((id) => {
        const meta = SECTION_REGISTRY[id];
        const fields = meta.textFields.filter((f) => !needle || f.label.toLowerCase().includes(needle) || f.key.includes(needle) || (draft[f.key] ?? '').toLowerCase().includes(needle) || meta.defaultLabel.toLowerCase().includes(needle));
        if (!fields.length) return null;
        return (
          <fieldset key={id} className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-4">
            <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">{meta.defaultLabel} <span className="text-zinc-600 normal-case tracking-normal font-mono-code">#{meta.anchors[0] ?? id}</span></legend>
            {fields.map((f) => {
              const def = DEFAULT_TEXTS[f.key] ?? '';
              const changed = (draft[f.key] ?? '') !== def;
              const idf = `h-${f.key}`;
              return (
                <div key={f.key} className="grid gap-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={idf} className="text-[10px] uppercase tracking-wider text-zinc-500">{f.label}</label>
                    <button type="button" disabled={!changed} onClick={() => set(f.key, def)} className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" title={def ? `Default: ${def}` : 'Default: empty'}>
                      <RotateCcw className="w-3 h-3" />Default
                    </button>
                  </div>
                  {f.multiline
                    ? <textarea id={idf} rows={2} className={inputCls} value={draft[f.key] ?? ''} placeholder={def} onChange={(e) => set(f.key, e.target.value)} />
                    : <input id={idf} className={inputCls} value={draft[f.key] ?? ''} placeholder={def} onChange={(e) => set(f.key, e.target.value)} />}
                </div>
              );
            })}
          </fieldset>
        );
      })}
    </div>
  );
};
