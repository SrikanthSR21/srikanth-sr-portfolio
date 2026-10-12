import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { SaveBar } from './SaveBar';
import { useDraft, useSaver } from './AdminDirty';
import { inputCls } from './RecordsEditor';
import { SKILL_ICONS, SkillIcon } from '../SkillIcon';
import { deriveSkillsFromInfo, skillUid, SkillCategory, SkillItem, SkillsConfig, SkillsLayout, SUGGESTED_CATEGORIES } from '../../lib/skills';
import { MediaPickerDialog } from './MediaLibrary';

const lbl = 'text-[10px] uppercase tracking-wider text-zinc-500';
const iconBtn = 'p-2 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-30';
const LAYOUTS: { id: SkillsLayout; label: string; hint: string }[] = [
  { id: 'cards', label: 'Category cards', hint: 'One card per category with descriptions and optional bars' },
  { id: 'tags', label: 'Tags', hint: 'Compact pills grouped by category' },
  { id: 'bars', label: 'Progress bars', hint: 'Skill levels shown as bars (set a level per skill)' },
];

/** Icon chooser: curated icons, an emoji / short text, or an image from the Media Library. */
const IconField: React.FC<{ value: string; onChange: (v: string) => void; fallback?: string }> = ({ value, onChange, fallback }) => {
  const [pick, setPick] = useState(false);
  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Icon">
        <button type="button" onClick={() => onChange('')} aria-pressed={!value} className={`px-2 h-8 text-[11px] rounded border cursor-pointer ${!value ? 'bg-white text-black border-white' : 'border-white/15 text-zinc-400 hover:border-white/40'}`}>Default</button>
        {Object.keys(SKILL_ICONS).map((k) => (
          <button key={k} type="button" title={k} aria-label={k} aria-pressed={value === k} onClick={() => onChange(k)}
            className={`w-8 h-8 flex items-center justify-center rounded border cursor-pointer ${value === k ? 'bg-white text-black border-white' : 'border-white/15 text-zinc-300 hover:border-white/40'}`}><SkillIcon icon={k} className="w-4 h-4" /></button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 shrink-0 rounded border border-white/15 flex items-center justify-center text-white"><SkillIcon icon={value} fallback={fallback} className="w-4 h-4" /></span>
        <input value={SKILL_ICONS[value] ? '' : value} onChange={(e) => onChange(e.target.value)} placeholder="…or an emoji / image URL" aria-label="Custom icon (emoji or image URL)" className={inputCls} />
        <button type="button" onClick={() => setPick(true)} className="shrink-0 px-2.5 py-2 text-[11px] border border-white/15 rounded-lg text-zinc-300 hover:border-white/40 cursor-pointer">Library</button>
      </div>
      {pick && <MediaPickerDialog defaultCategory="skill" onClose={() => setPick(false)} onSelect={(a) => { onChange(a.url); setPick(false); }} />}
    </div>
  );
};

const SkillRow: React.FC<{
  s: SkillItem; i: number; count: number; categories: SkillCategory[]; fallbackIcon?: string;
  patch: (p: Partial<SkillItem>) => void; move: (d: -1 | 1) => void; remove: () => void;
}> = ({ s, i, count, categories, fallbackIcon, patch, move, remove }) => {
  const [open, setOpen] = useState(false);
  const hidden = s.visible === false;
  return (
    <li className={`rounded-lg border bg-black ${hidden ? 'border-white/10 opacity-70' : 'border-white/15'}`}>
      <div className="flex items-center gap-1 px-1.5">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex-1 min-w-0 flex items-center gap-2 py-2 px-1 text-left text-xs text-white cursor-pointer">
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          <span className="w-5 h-5 shrink-0 flex items-center justify-center text-zinc-300"><SkillIcon icon={s.icon} fallback={fallbackIcon} className="w-4 h-4" /></span>
          <span className="truncate">{s.name || '(unnamed)'}</span>
          {s.level != null && <span className="text-[10px] text-zinc-500 tabular-nums">{s.level}%</span>}
          {hidden && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Hidden</span>}
        </button>
        <button type="button" onClick={() => patch({ visible: hidden })} aria-label={hidden ? `Show ${s.name}` : `Hide ${s.name}`} className={iconBtn}>{hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
        <button type="button" onClick={() => move(-1)} disabled={i === 0} aria-label={`Move ${s.name} up`} className={iconBtn}><ArrowUp className="w-4 h-4" /></button>
        <button type="button" onClick={() => move(1)} disabled={i === count - 1} aria-label={`Move ${s.name} down`} className={iconBtn}><ArrowDown className="w-4 h-4" /></button>
        <button type="button" onClick={() => confirm(`Delete “${s.name}”? It is removed once you press Save.`) && remove()} aria-label={`Delete ${s.name}`} className={`${iconBtn} hover:!text-red-400`}><Trash2 className="w-4 h-4" /></button>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-3 border-t border-white/10 grid gap-3">
          <label className="grid gap-1.5"><span className={lbl}>Skill name</span><input className={inputCls} value={s.name} onChange={(e) => patch({ name: e.target.value })} /></label>
          <label className="grid gap-1.5"><span className={lbl}>Category</span>
            <select className={inputCls} value={s.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="grid gap-1.5"><span className={lbl}>Description (optional)</span><input className={inputCls} value={s.description ?? ''} onChange={(e) => patch({ description: e.target.value })} /></label>
          <div className="grid gap-1.5"><span className={lbl}>Icon</span><IconField value={s.icon ?? ''} onChange={(v) => patch({ icon: v })} fallback={fallbackIcon} /></div>
          <div className="grid gap-1.5">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-white" checked={s.level != null} onChange={(e) => patch({ level: e.target.checked ? 80 : undefined })} />Show a proficiency level
            </label>
            {s.level != null && (
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} step={5} value={s.level} onChange={(e) => patch({ level: Number(e.target.value) })} aria-label={`${s.name} proficiency`} className="flex-1 accent-white" />
                <span className="w-10 text-xs tabular-nums text-zinc-300 text-right">{s.level}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
};

export const SkillsAdmin: React.FC = () => {
  const { settings, saveSetting } = useContent();
  const { draft, setDraft, dirty, discard } = useDraft<SkillsConfig>(settings.skills);
  const { state, run } = useSaver();
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [quick, setQuick] = useState<Record<string, string>>({});
  const [vis, setVis] = useState('');

  const sectionVisible = settings.layout.find((s) => s.id === 'skills')?.visible !== false;
  const setSectionVisible = async (v: boolean) => {
    setVis('Saving…');
    try { await saveSetting('layout', settings.layout.map((s) => (s.id === 'skills' ? { ...s, visible: v } : s))); setVis(v ? 'Skills section is now visible.' : 'Skills section is now hidden (content kept).'); }
    catch (e: any) { setVis(e?.message || 'Could not save'); }
  };

  const patchCat = (id: string, p: Partial<SkillCategory>) => setDraft((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  const moveCat = (i: number, dir: -1 | 1) => setDraft((d) => { const n = [...d.categories]; const j = i + dir; if (j < 0 || j >= n.length) return d; [n[i], n[j]] = [n[j], n[i]]; return { ...d, categories: n }; });
  const addCat = (name = 'New category') => { const c: SkillCategory = { id: skillUid('cat'), name, visible: true }; setDraft((d) => ({ ...d, categories: [...d.categories, c] })); setOpenCat(c.id); };
  const delCat = (c: SkillCategory) => {
    const n = draft.items.filter((s) => s.categoryId === c.id).length;
    if (confirm(`Delete the category “${c.name}”${n ? ` and its ${n} skill${n > 1 ? 's' : ''}` : ''}? It is removed once you press Save.`))
      setDraft((d) => ({ ...d, categories: d.categories.filter((x) => x.id !== c.id), items: d.items.filter((s) => s.categoryId !== c.id) }));
  };
  const patchSkill = (id: string, p: Partial<SkillItem>) => setDraft((d) => ({ ...d, items: d.items.map((s) => (s.id === id ? { ...s, ...p } : s)) }));
  const delSkill = (id: string) => setDraft((d) => ({ ...d, items: d.items.filter((s) => s.id !== id) }));
  // reorder inside a category: swap with the previous/next skill of the SAME category
  const moveSkill = (id: string, dir: -1 | 1) => setDraft((d) => {
    const s = d.items.find((x) => x.id === id); if (!s) return d;
    const same = d.items.filter((x) => x.categoryId === s.categoryId);
    const k = same.findIndex((x) => x.id === id) + dir; if (k < 0 || k >= same.length) return d;
    const a = d.items.indexOf(s), b = d.items.indexOf(same[k]);
    const n = [...d.items]; [n[a], n[b]] = [n[b], n[a]]; return { ...d, items: n };
  });
  const addSkills = (catId: string, text: string) => {
    const names = text.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
    if (!names.length) return;
    setDraft((d) => ({ ...d, items: [...d.items, ...names.map((name) => ({ id: skillUid(), name, categoryId: catId, visible: true }))] }));
    setQuick((q) => ({ ...q, [catId]: '' }));
  };

  const clean = (): SkillsConfig => ({ ...draft, items: draft.items.filter((s) => s.name.trim()).map((s) => ({ ...s, name: s.name.trim() })), categories: draft.categories.map((c) => ({ ...c, name: c.name.trim() || 'Untitled' })) });
  const save = () => run(() => saveSetting('skills', clean()));
  const resetToLegacy = () => { if (confirm('Rebuild the skills from the original skill groups (Hero/About data)? Your current list is replaced once you press Save.')) setDraft(deriveSkillsFromInfo(settings.info.skills)); };
  const unusedSuggestions = SUGGESTED_CATEGORIES.filter((s) => !draft.categories.some((c) => c.name.toLowerCase() === s.toLowerCase()));

  return (
    <div className="space-y-6">
      <SaveBar title={`Skills (${draft.items.length})`} dirty={dirty} state={state} onSave={save} onDiscard={discard}>
        <button type="button" onClick={() => addCat()} className="flex items-center gap-1 px-3 py-2 text-xs border border-white/20 rounded-lg text-white hover:bg-white/10 cursor-pointer"><Plus className="w-3.5 h-3.5" />Category</button>
      </SaveBar>

      <fieldset className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-4">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">Section</legend>
        <label className="flex items-center gap-2.5 text-xs text-zinc-200 cursor-pointer">
          <input type="checkbox" role="switch" className="w-4 h-4 accent-white" checked={sectionVisible} onChange={(e) => setSectionVisible(e.target.checked)} />
          Show the Skills section on the website <span className="text-zinc-500">(saves immediately; navbar link follows)</span>
        </label>
        {vis && <div role="status" className="text-xs text-zinc-400">{vis}</div>}
        <div className="grid sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Display style">
          {LAYOUTS.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={draft.layout === l.id} onClick={() => setDraft((d) => ({ ...d, layout: l.id }))}
              className={`text-left p-3 rounded-xl border cursor-pointer ${draft.layout === l.id ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-300 border-white/15 hover:border-white/40'}`}>
              <div className="text-sm font-semibold">{l.label}</div><div className="text-[11px] opacity-70 mt-0.5">{l.hint}</div>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-white" checked={draft.showLevels} onChange={(e) => setDraft((d) => ({ ...d, showLevels: e.target.checked }))} />Show proficiency levels where a skill has one
        </label>
        <p className="text-[11px] text-zinc-500">Section title, eyebrow and subtitle: Admin → Section Headings. Position: Admin → Section Visibility & Order.</p>
      </fieldset>

      {draft.categories.length === 0 && <div className="p-8 text-center text-sm text-zinc-500 border border-dashed border-white/15 rounded-xl">No categories yet. Add one to start.</div>}

      {draft.categories.map((c, ci) => {
        const items = draft.items.filter((s) => s.categoryId === c.id);
        const open = openCat === c.id;
        return (
          <section key={c.id} className={`border rounded-xl bg-zinc-950 ${c.visible === false ? 'border-white/10 opacity-80' : 'border-white/15'}`}>
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5">
              <button type="button" aria-expanded={open} onClick={() => setOpenCat(open ? null : c.id)} className="flex-1 min-w-0 flex items-center gap-2 text-left text-sm text-white cursor-pointer py-2">
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                <span className="w-5 h-5 shrink-0 flex items-center justify-center text-zinc-300"><SkillIcon icon={c.icon} fallback="Layers" className="w-4 h-4" /></span>
                <span className="truncate font-semibold">{c.name}</span><span className="text-[11px] text-zinc-500">{items.length}</span>
                {c.visible === false && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Hidden</span>}
              </button>
              <button type="button" onClick={() => patchCat(c.id, { visible: c.visible === false })} aria-label={c.visible === false ? `Show ${c.name}` : `Hide ${c.name}`} className={iconBtn}>{c.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              <button type="button" onClick={() => moveCat(ci, -1)} disabled={ci === 0} aria-label={`Move ${c.name} up`} className={iconBtn}><ArrowUp className="w-4 h-4" /></button>
              <button type="button" onClick={() => moveCat(ci, 1)} disabled={ci === draft.categories.length - 1} aria-label={`Move ${c.name} down`} className={iconBtn}><ArrowDown className="w-4 h-4" /></button>
              <button type="button" onClick={() => delCat(c)} aria-label={`Delete ${c.name}`} className={`${iconBtn} hover:!text-red-400`}><Trash2 className="w-4 h-4" /></button>
            </div>
            {open && (
              <div className="px-3 sm:px-4 pb-4 pt-4 border-t border-white/10 grid gap-4">
                <label className="grid gap-1.5"><span className={lbl}>Category name</span>
                  <input list="skill-cat-suggestions" className={inputCls} value={c.name} onChange={(e) => patchCat(c.id, { name: e.target.value })} /></label>
                <label className="grid gap-1.5"><span className={lbl}>Description (optional)</span><input className={inputCls} value={c.description ?? ''} onChange={(e) => patchCat(c.id, { description: e.target.value })} /></label>
                <div className="grid gap-1.5"><span className={lbl}>Category icon</span><IconField value={c.icon ?? ''} onChange={(v) => patchCat(c.id, { icon: v })} fallback="Layers" /></div>

                <ul className="space-y-2">
                  {items.map((s, i) => (
                    <SkillRow key={s.id} s={s} i={i} count={items.length} categories={draft.categories} fallbackIcon={undefined}
                      patch={(p) => patchSkill(s.id, p)} move={(d) => moveSkill(s.id, d)} remove={() => delSkill(s.id)} />
                  ))}
                  {items.length === 0 && <li className="text-xs text-zinc-500">No skills in this category yet.</li>}
                </ul>
                <div className="flex gap-2">
                  <input value={quick[c.id] ?? ''} onChange={(e) => setQuick((q) => ({ ...q, [c.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkills(c.id, quick[c.id] ?? ''); } }}
                    placeholder="Add skills: type names, separated by commas" aria-label={`Add skills to ${c.name}`} className={inputCls} />
                  <button type="button" onClick={() => addSkills(c.id, quick[c.id] ?? '')} className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs border border-white/20 rounded-lg text-white hover:bg-white/10 cursor-pointer"><Plus className="w-3.5 h-3.5" />Add</button>
                </div>
              </div>
            )}
          </section>
        );
      })}
      <datalist id="skill-cat-suggestions">{SUGGESTED_CATEGORIES.map((s) => <option key={s} value={s} />)}</datalist>

      {unusedSuggestions.length > 0 && (
        <div className="space-y-1.5">
          <div className={lbl}>Quick-add a suggested category</div>
          <div className="flex flex-wrap gap-1.5">{unusedSuggestions.map((s) => <button key={s} type="button" onClick={() => addCat(s)} className="px-2.5 py-1 text-[11px] rounded-full border border-white/15 text-zinc-300 hover:border-white/40 cursor-pointer">+ {s}</button>)}</div>
        </div>
      )}
      <button type="button" onClick={resetToLegacy} className="text-xs text-zinc-400 underline underline-offset-4 cursor-pointer">Rebuild from the original skill groups</button>
    </div>
  );
};
