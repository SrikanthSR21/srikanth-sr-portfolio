import React, { useEffect, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { FONT_PAIRS } from '../../data/portfolioData';
import { SECTION_REGISTRY, SectionId } from '../../lib/sections';
import {
  rolesToCss, ACCENT_PRESETS, DEFAULT_SECTION_TYPO, DEFAULT_TYPOGRAPHY, ensureFontsFor, FONT_OPTIONS, GRADIENT_PRESETS, sectionTypo, TypographySettings, typographyToDom,
} from '../../lib/typography';
import { SectionHeading } from '../SectionHeading';
import { SaveBar } from './SaveBar';
import { useDraft, useSaver } from './AdminDirty';
import { inputCls } from './RecordsEditor';
import { ColorField, Seg, lbl } from './typoUi';
import { SectionTonesPanel } from './SectionTonesPanel';
import { MetricCardsPanel } from './MetricCardsPanel';
import { TextRolesPanel } from './TextRolesPanel';

const WEIGHTS = [{ v: 0, l: 'Theme default' }, { v: 400, l: 'Regular 400' }, { v: 500, l: 'Medium 500' }, { v: 600, l: 'Semibold 600' }, { v: 700, l: 'Bold 700' }, { v: 800, l: 'Extra bold 800' }, { v: 900, l: 'Black 900' }];

export const TypographyAdmin: React.FC = () => {
  const { settings, saveSetting } = useContent();
  const { draft, setDraft, dirty, discard } = useDraft<TypographySettings>(settings.typography);
  const { state, run } = useSaver();
  const fontPair = FONT_PAIRS.find((f) => f.id === settings.theme.fontPairId) || FONT_PAIRS[0];
  const set = <K extends keyof TypographySettings>(k: K, v: TypographySettings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setSection = (id: SectionId, p: Partial<typeof DEFAULT_SECTION_TYPO>) => setDraft((d) => ({ ...d, perSection: { ...d.perSection, [id]: { ...sectionTypo(d, id), ...p } } }));
  const validHex = (h: string) => /^#[0-9a-f]{6}$/i.test(h);
  const customBad = Object.entries(draft.sectionCustom).some(([id, c]) => draft.sectionTone[id as SectionId] === 'custom' && c && (!validHex(c.dark) || !validHex(c.light)));
  const bad = !validHex(draft.accent) || !validHex(draft.gradientFrom) || !validHex(draft.gradientTo) || customBad;
  const save = () => run(async () => { if (bad) throw new Error(customBad ? 'Every custom section colour must be a full hex value like #1c1c20.' : 'Colours must be full hex values like #7c9cff.'); await saveSetting('typography', draft); });
  const reset = () => { if (confirm('Reset all typography and highlight settings to the original design? Press Save to apply.')) setDraft(DEFAULT_TYPOGRAPHY); };

  const { attrs, vars } = useMemo(() => typographyToDom(bad ? { ...draft, accent: validHex(draft.accent) ? draft.accent : '#7c9cff', gradientFrom: validHex(draft.gradientFrom) ? draft.gradientFrom : '#7c9cff', gradientTo: validHex(draft.gradientTo) ? draft.gradientTo : '#c084fc' } : draft), [draft, bad]);
  const sections = settings.layout.map((s) => s.id).filter((id) => id !== 'hero' && id !== 'footer');
  const bandSections = settings.layout.map((s) => s.id);
  useEffect(() => { ensureFontsFor(draft); }, [draft]);

  return (
    <div className="space-y-6">
      <SaveBar title="Typography & highlights" dirty={dirty} state={state} onSave={save} onDiscard={discard}>
        <button type="button" onClick={reset} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-white/20 rounded-lg text-zinc-200 hover:bg-white/10 cursor-pointer"><RotateCcw className="w-3.5 h-3.5" />Reset to default</button>
      </SaveBar>

      {/* live preview: same components and CSS as the public site, driven by the unsaved draft */}
      <section aria-label="Live preview" className="rounded-xl border border-white/15 bg-black overflow-hidden lg:sticky lg:top-16 z-[5]">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/10 flex justify-between"><span>Live preview (not saved yet)</span>{dirty && <span className="text-amber-400">● unsaved</span>}</div>
        <div className="typo-scope p-5 sm:p-6 grid gap-5 sm:grid-cols-[1.2fr_1fr] items-start" {...attrs} style={vars as React.CSSProperties}>
          <style>{rolesToCss(draft, '.typo-scope', 'dark')}</style>
          <SectionHeading id="projects" fontPair={fontPair} typographyOverride={draft} eyebrow="// PREVIEW" title="Selected ==work== & projects" subtitle="Words wrapped in ==double equals== get the highlight style." />
          <div className="p-4 bg-zinc-950 border border-white/10 rounded-[var(--radius-card,20px)]">
            <h3 className={`card-heading text-lg font-bold text-white uppercase tracking-tight mb-1.5 ${fontPair.headlineClass}`}>Sample card title</h3>
            <p className="text-xs text-zinc-400 mb-3">Card headings and corner radius follow the settings below.</p>
            <div className="flex gap-1.5">{['React', 'SEO'].map((t) => <span key={t} className="text-[10px] font-mono-code px-2 py-0.5 rounded-md border border-white/15 text-zinc-300">{t}</span>)}</div>
          </div>
        </div>
      </section>

      <SectionTonesPanel draft={draft} setDraft={setDraft} sections={bandSections} />
      <MetricCardsPanel draft={draft} setDraft={setDraft} />
      <TextRolesPanel draft={draft} setDraft={setDraft} fontPair={fontPair} />

      <fieldset className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-4">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">Section headings</legend>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="grid gap-1.5"><span className={lbl}>Font family</span>
            <select className={inputCls} value={draft.headingFont} onChange={(e) => set('headingFont', e.target.value as any)}>{FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className={lbl}>Weight</span>
            <select className={inputCls} value={draft.headingWeight} onChange={(e) => set('headingWeight', Number(e.target.value))}>{WEIGHTS.map((w) => <option key={w.v} value={w.v}>{w.l}</option>)}</select></label>
          <label className="grid gap-1.5"><span className={lbl}>Size</span>
            <select className={inputCls} value={draft.headingSize} onChange={(e) => set('headingSize', e.target.value as any)}>
              <option value="default">Default</option><option value="sm">Smaller</option><option value="lg">Larger</option><option value="xl">Extra large</option></select></label>
          <label className="grid gap-1.5"><span className={lbl}>Letter case</span>
            <select className={inputCls} value={draft.headingCase} onChange={(e) => set('headingCase', e.target.value as any)}>
              <option value="theme">Theme default (UPPERCASE)</option><option value="uppercase">UPPERCASE</option><option value="capitalize">Capitalize Each Word</option><option value="none">As typed</option></select></label>
        </div>
        <p className="text-[11px] text-zinc-500">Tip: Anton and Cinzel ship in a limited set of weights, so some weights look the same there.</p>
        <div className="grid gap-1.5"><span className={lbl}>Heading colour</span>
          <Seg label="Heading colour" value={draft.headingColor} onChange={(v) => set('headingColor', v)} options={[{ id: 'default', label: 'Default' }, { id: 'accent', label: 'Accent colour' }, { id: 'gradient', label: 'Gradient text' }]} /></div>
        <div className="grid gap-1.5"><span className={lbl}>Underline</span>
          <Seg label="Underline style" value={draft.underline} onChange={(v) => set('underline', v)} options={[{ id: 'none', label: 'None' }, { id: 'solid', label: 'Solid' }, { id: 'gradient', label: 'Gradient' }, { id: 'animated', label: 'Animated' }]} />
          {draft.underline !== 'none' && <Seg label="Underline width" value={draft.underlineWidth} onChange={(v) => set('underlineWidth', v)} options={[{ id: 'short', label: 'Short accent bar' }, { id: 'full', label: 'Full width' }]} />}
          {draft.underline === 'animated' && <p className="text-[11px] text-zinc-500">The animation is switched off automatically for visitors who prefer reduced motion.</p>}
        </div>
      </fieldset>

      <fieldset className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-4">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">Accent & gradient</legend>
        <div className="flex flex-wrap items-end gap-5">
          <ColorField label="Accent colour" value={draft.accent} onChange={(v) => set('accent', v)} />
          <div className="flex flex-wrap gap-1.5 pb-1.5" aria-label="Accent presets">{ACCENT_PRESETS.map((c) => <button key={c} type="button" aria-label={`Use ${c}`} onClick={() => set('accent', c)} className="w-7 h-7 rounded-full border border-white/30 cursor-pointer" style={{ background: c }} />)}</div>
        </div>
        <div className="flex flex-wrap items-end gap-5">
          <ColorField label="Gradient from" value={draft.gradientFrom} onChange={(v) => set('gradientFrom', v)} />
          <ColorField label="Gradient to" value={draft.gradientTo} onChange={(v) => set('gradientTo', v)} />
          <label className="grid gap-1.5"><span className={lbl}>Angle {draft.gradientAngle}°</span><input type="range" min={0} max={360} step={5} value={draft.gradientAngle} onChange={(e) => set('gradientAngle', Number(e.target.value))} className="accent-white w-40" /></label>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Gradient presets">
          {GRADIENT_PRESETS.map((g) => (
            <button key={g.name} type="button" onClick={() => setDraft((d) => ({ ...d, gradientFrom: g.from, gradientTo: g.to }))}
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg border border-white/15 text-zinc-300 hover:border-white/40 cursor-pointer">
              <span className="w-8 h-3 rounded-full" style={{ background: `linear-gradient(90deg, ${g.from}, ${g.to})` }} />{g.name}
            </button>
          ))}
        </div>
        {bad && <p role="alert" className="text-xs text-red-400">Enter colours as full hex values, e.g. #7c9cff.</p>}
        <p className="text-[11px] text-zinc-500">Pick colours that stay readable on both the dark and the light site theme.</p>
      </fieldset>

      <fieldset className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-3">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">Highlighted words</legend>
        <p className="text-xs text-zinc-500">In any heading or subtitle (Admin → Section Headings), wrap words in <code className="px-1 bg-white/10 rounded">==double equals==</code> to highlight them.</p>
        <Seg label="Highlight style" value={draft.highlightStyle} onChange={(v) => set('highlightStyle', v)} options={[{ id: 'accent', label: 'Accent colour' }, { id: 'gradient', label: 'Gradient text' }, { id: 'background', label: 'Background marker' }]} />
      </fieldset>

      <fieldset className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-4">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">Card headings & corners</legend>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="grid gap-1.5"><span className={lbl}>Font family</span>
            <select className={inputCls} value={draft.cardFont} onChange={(e) => set('cardFont', e.target.value as any)}>{FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className={lbl}>Weight</span>
            <select className={inputCls} value={draft.cardWeight} onChange={(e) => set('cardWeight', Number(e.target.value))}>{WEIGHTS.map((w) => <option key={w.v} value={w.v}>{w.l}</option>)}</select></label>
          <label className="grid gap-1.5"><span className={lbl}>Size</span>
            <select className={inputCls} value={draft.cardSize} onChange={(e) => set('cardSize', e.target.value as any)}><option value="default">Default</option><option value="sm">Smaller</option><option value="lg">Larger</option></select></label>
          <label className="grid gap-1.5"><span className={lbl}>Colour</span>
            <select className={inputCls} value={draft.cardColor} onChange={(e) => set('cardColor', e.target.value as any)}><option value="default">Default</option><option value="accent">Accent colour</option></select></label>
        </div>
        <label className="grid gap-1.5 max-w-sm"><span className={lbl}>Card corner radius: {draft.radius}px {draft.radius === 20 ? '(default)' : ''}</span>
          <input type="range" min={0} max={40} step={2} value={draft.radius} onChange={(e) => set('radius', Number(e.target.value))} className="accent-white" /></label>
      </fieldset>

      <fieldset className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-3">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">Per-section effects</legend>
        <p className="text-xs text-zinc-500">Override the heading colour, or switch the underline and highlights on or off for individual sections.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[28rem]">
            <thead><tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500"><th className="py-1.5 pr-3 font-normal">Section</th><th className="pr-3 font-normal">Heading colour</th><th className="pr-3 font-normal">Underline</th><th className="font-normal">Highlights</th></tr></thead>
            <tbody>
              {sections.map((id) => { const s = sectionTypo(draft, id); return (
                <tr key={id} className="border-t border-white/5">
                  <td className="py-2 pr-3 text-zinc-200">{SECTION_REGISTRY[id].defaultLabel}</td>
                  <td className="pr-3"><select aria-label={`${SECTION_REGISTRY[id].defaultLabel} heading colour`} className={`${inputCls} !py-1`} value={s.color} onChange={(e) => setSection(id, { color: e.target.value as any })}>
                    <option value="global">Follow global</option><option value="default">Default</option><option value="accent">Accent</option><option value="gradient">Gradient</option></select></td>
                  <td className="pr-3"><input type="checkbox" role="switch" aria-label={`${SECTION_REGISTRY[id].defaultLabel} underline`} className="w-4 h-4 accent-white" checked={s.underline} onChange={(e) => setSection(id, { underline: e.target.checked })} /></td>
                  <td><input type="checkbox" role="switch" aria-label={`${SECTION_REGISTRY[id].defaultLabel} highlights`} className="w-4 h-4 accent-white" checked={s.highlight} onChange={(e) => setSection(id, { highlight: e.target.checked })} /></td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
};
