import React from 'react';
import { FONT_OPTIONS, ROLES, RoleDef, RoleId, RoleStyle, TypographySettings, DEFAULT_ROLE, contrastRatio, ensureFont, roleStyle } from '../../lib/typography';
import type { FontPairOption } from '../../types';
import { inputCls } from './RecordsEditor';
import { PreviewBox, fieldsetCls, lbl, legendCls } from './typoUi';

const WEIGHTS = [{ v: 0, l: 'Original' }, { v: 400, l: 'Regular 400' }, { v: 500, l: 'Medium 500' }, { v: 600, l: 'Semibold 600' }, { v: 700, l: 'Bold 700' }, { v: 800, l: 'Extra bold 800' }, { v: 900, l: 'Black 900' }];
const GROUPS = ['Current site fonts', 'Sans-serif', 'Serif', 'Display', 'Monospace'] as const;
const HEADLINE_ROLES: RoleId[] = ['heroName', 'secHeading', 'cardHeading'];

interface Props {
  draft: TypographySettings;
  setDraft: React.Dispatch<React.SetStateAction<TypographySettings>>;
  fontPair: FontPairOption;
}

/** Contrast badge against the page colour of that mode (black for dark mode, white for light mode). */
const Contrast: React.FC<{ color: string; bg: string }> = ({ color, bg }) => {
  const r = contrastRatio(color, bg);
  if (!r) return null;
  const [txt, cls] = r >= 4.5 ? ['Readable', 'text-emerald-400'] : r >= 3 ? ['OK for large text only', 'text-amber-400'] : ['Hard to read', 'text-red-400'];
  return <span className={`text-[10px] ${cls}`}>{txt} · {r.toFixed(1)}:1</span>;
};

const ColorSlot: React.FC<{ label: string; value: string; start: string; bg: string; onChange: (v: string) => void }> = ({ label, value, start, bg, onChange }) => (
  <div className="grid gap-1.5">
    <span className={lbl}>{label}</span>
    {value ? (
      <>
        <span className="flex items-center gap-2">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} picker`} className="w-12 h-9 bg-transparent border border-white/20 rounded cursor-pointer" />
          <input value={value} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)} aria-label={`${label} hex`} className={`${inputCls} !w-24 font-mono-code`} maxLength={7} />
          <button type="button" onClick={() => onChange('')} className="text-[11px] text-zinc-400 underline underline-offset-4 hover:text-white cursor-pointer">Original</button>
        </span>
        <Contrast color={value} bg={bg} />
      </>
    ) : (
      <button type="button" onClick={() => onChange(start)} className="justify-self-start px-3 py-2 text-xs rounded-lg border border-dashed border-white/25 text-zinc-300 hover:border-white/60 cursor-pointer">Original colour · set custom</button>
    )}
  </div>
);

const RoleCard: React.FC<{ def: RoleDef; draft: TypographySettings; setDraft: Props['setDraft']; fontPair: FontPairOption }> = ({ def, draft, setDraft, fontPair }) => {
  const r = roleStyle(draft, def.id);
  const changed = JSON.stringify(r) !== JSON.stringify(DEFAULT_ROLE);
  const set = (patch: Partial<RoleStyle>) => setDraft((d) => ({ ...d, roles: { ...d.roles, [def.id]: { ...roleStyle(d, def.id), ...patch } } }));
  const reset = () => setDraft((d) => { const roles = { ...d.roles }; delete roles[def.id]; return { ...d, roles }; });
  const headline = HEADLINE_ROLES.includes(def.id) || def.id === 'metricValue';
  const sampleCls = `${def.selector.slice(1)} ${def.sampleClass} ${headline ? fontPair.headlineClass : ''} break-words`;

  return (
    <details className="rounded-xl border border-white/10 bg-black/40 group">
      <summary className="flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer list-none">
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-zinc-100">{def.label}{changed && <span className="ml-2 text-[10px] font-normal text-amber-400">● customised</span>}</span>
          <span className="block text-[11px] text-zinc-500 truncate">{def.hint}</span>
        </span>
        <span className="text-[11px] text-zinc-400 group-open:hidden shrink-0">Edit</span>
        <span className="text-[11px] text-zinc-400 hidden group-open:inline shrink-0">Close</span>
      </summary>

      <div className="px-3 pb-4 pt-1 space-y-4 border-t border-white/5">
        <div className="grid sm:grid-cols-2 gap-3">
          {(['dark', 'light'] as const).map((mode) => (
            <PreviewBox key={mode} mode={mode} draft={draft} className="!p-3">
              <div className={sampleCls}>{def.sample}</div>
            </PreviewBox>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="grid gap-1.5"><span className={lbl}>Font</span>
            <select className={inputCls} value={r.font} onChange={(e) => { ensureFont(e.target.value); set({ font: e.target.value }); }}>
              {GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {FONT_OPTIONS.filter((f) => f.group === g).map((f) => <option key={f.id} value={f.id}>{f.id === 'theme' ? 'Original' : f.label}</option>)}
                </optgroup>
              ))}
            </select></label>
          <label className="grid gap-1.5"><span className={lbl}>Weight</span>
            <select className={inputCls} value={r.weight} onChange={(e) => set({ weight: Number(e.target.value) })}>{WEIGHTS.map((w) => <option key={w.v} value={w.v}>{w.l}</option>)}</select></label>
          <label className="grid gap-1.5"><span className={lbl}>Letter case</span>
            <select className={inputCls} value={r.case} onChange={(e) => set({ case: e.target.value as RoleStyle['case'] })}>
              <option value="theme">Original</option><option value="uppercase">UPPERCASE</option><option value="lowercase">lowercase</option><option value="capitalize">Capitalize Each Word</option><option value="none">As typed</option></select></label>
          {def.size ? (
            <label className="grid gap-1.5"><span className={lbl}>Size: {r.size ? `${r.size}px` : `Original (about ${def.size.def}px)`}</span>
              <span className="flex items-center gap-2">
                <input type="range" min={def.size.min} max={def.size.max} step={1} value={r.size || def.size.def} onChange={(e) => set({ size: Number(e.target.value) })} className="accent-white flex-1 min-w-0" aria-label={`${def.label} size`} />
                {r.size > 0 && <button type="button" onClick={() => set({ size: 0 })} className="text-[11px] text-zinc-400 underline underline-offset-4 hover:text-white cursor-pointer">Original</button>}
              </span></label>
          ) : (
            <div className="grid gap-1.5"><span className={lbl}>Size</span><span className="text-[11px] text-zinc-500">Use "Overall text size" above</span></div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <ColorSlot label="Colour in dark mode" value={r.colorD} start="#ffffff" bg="#000000" onChange={(v) => set({ colorD: v })} />
          <ColorSlot label="Colour in light mode" value={r.colorL} start="#0a0a0a" bg="#ffffff" onChange={(v) => set({ colorL: v })} />
        </div>
        <p className="text-[11px] text-zinc-500">Each mode has its own colour so text never turns unreadable when the visitor switches theme. A mode left on "Original" keeps the site's own colour.{def.id === 'secHeading' ? ' Gradient headings keep their gradient.' : ''}</p>
        {changed && <button type="button" onClick={reset} className="text-[11px] text-zinc-400 underline underline-offset-4 hover:text-white cursor-pointer">Reset this text style</button>}
      </div>
    </details>
  );
};

export const TextRolesPanel: React.FC<Props> = ({ draft, setDraft, fontPair }) => (
  <fieldset className={fieldsetCls}>
    <legend className={legendCls}>Text styles: every kind of text</legend>
    <p className="text-xs text-zinc-500 max-w-2xl">Open any text type to change its font, size, weight, letter case and colour. Previews show it in dark and light mode at once. Anything left on "Original" keeps the current design.</p>

    <label className="grid gap-1.5 max-w-md"><span className={lbl}>Overall text size: {draft.baseScale}% {draft.baseScale === 100 ? '(original)' : ''}</span>
      <span className="flex items-center gap-3">
        <input type="range" min={85} max={130} step={5} value={draft.baseScale} onChange={(e) => setDraft((d) => ({ ...d, baseScale: Number(e.target.value) }))} className="accent-white flex-1" aria-label="Overall text size" />
        {draft.baseScale !== 100 && <button type="button" onClick={() => setDraft((d) => ({ ...d, baseScale: 100 }))} className="text-[11px] text-zinc-400 underline underline-offset-4 hover:text-white cursor-pointer">Original</button>}
      </span>
      <span className="text-[11px] text-zinc-500">Scales all text on the public page together, including paragraphs. Individual sizes below override it for that text type.</span></label>

    <div className="space-y-2">
      {ROLES.map((def) => <RoleCard key={def.id} def={def} draft={draft} setDraft={setDraft} fontPair={fontPair} />)}
    </div>
  </fieldset>
);
