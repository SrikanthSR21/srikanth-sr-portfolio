import React from 'react';
import { SECTION_REGISTRY, SectionId } from '../../lib/sections';
import { TONES, TONE_PRESETS, TONE_SWATCH, Tone, TypographySettings } from '../../lib/typography';
import { Seg, fieldsetCls, legendCls } from './typoUi';

interface Props {
  draft: TypographySettings;
  setDraft: React.Dispatch<React.SetStateAction<TypographySettings>>;
  sections: SectionId[];
}

/** Dark-mode half / light-mode half of a band, so both themes are visible while choosing. */
const Swatch: React.FC<{ tone: Tone }> = ({ tone }) => {
  const sw = TONE_SWATCH[tone];
  return (
    <span aria-hidden="true" className="flex w-14 h-7 rounded-md overflow-hidden border border-white/25 shrink-0">
      <span className="flex-1 grid place-items-center text-[9px] font-bold" style={{ background: sw.dark[0], color: sw.dark[1] }}>Aa</span>
      <span className="flex-1 grid place-items-center text-[9px] font-bold" style={{ background: sw.light[0], color: sw.light[1] }}>Aa</span>
    </span>
  );
};

export const SectionTonesPanel: React.FC<Props> = ({ draft, setDraft, sections }) => {
  const setTone = (id: SectionId, tone: Tone) => setDraft((d) => ({ ...d, sectionTone: { ...d.sectionTone, [id]: tone } }));
  const sameAs = (tones: TypographySettings['sectionTone']) => sections.every((id) => (draft.sectionTone[id] ?? 'none') === (tones[id] ?? 'none'));

  return (
    <fieldset className={fieldsetCls}>
      <legend className={legendCls}>Section backgrounds</legend>
      <p className="text-xs text-zinc-500 max-w-2xl">
        Give each section its own black, grey or white band so the content is easier to tell apart. Every swatch shows the <b className="text-zinc-300">dark-mode</b> look on the left and the
        <b className="text-zinc-300"> light-mode</b> look on the right, and the bands switch with the visitor's theme automatically. Text and cards inside a band stay readable.
      </p>

      <div className="flex flex-wrap gap-2" aria-label="Background presets">
        {TONE_PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => setDraft((d) => ({ ...d, sectionTone: { ...p.tones } }))}
            className={`text-left px-3 py-2 rounded-lg border cursor-pointer ${sameAs(p.tones) ? 'bg-white text-black border-white' : 'border-white/15 text-zinc-300 hover:border-white/40'}`}>
            <span className="block text-xs font-semibold">{p.name}</span><span className="block text-[10px] opacity-70">{p.hint}</span>
          </button>
        ))}
      </div>

      <div className="divide-y divide-white/5 border-y border-white/5">
        {sections.map((id) => {
          const cur = draft.sectionTone[id] ?? 'none';
          return (
            <div key={id} className="py-3 grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-center">
              <div className="text-xs font-semibold text-zinc-200">{SECTION_REGISTRY[id].defaultLabel}</div>
              <div role="radiogroup" aria-label={`${SECTION_REGISTRY[id].defaultLabel} background`} className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={cur === t.id} title={t.hint} onClick={() => setTone(id, t.id)}
                    className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer ${cur === t.id ? 'border-white bg-white/10 text-white font-semibold' : 'border-white/15 text-zinc-400 hover:border-white/40'}`}>
                    <Swatch tone={t.id} />{t.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Band edge</span>
        <Seg label="Band edge" value={draft.toneStyle} onChange={(v) => setDraft((d) => ({ ...d, toneStyle: v }))}
          options={[{ id: 'flat', label: 'Flat (solid band)' }, { id: 'fade', label: 'Fade into page' }]} />
        <p className="text-[11px] text-zinc-500">"Fade into page" blends Soft and Grey bands towards the page colour at the bottom. Contrast bands are always solid.</p>
      </div>
    </fieldset>
  );
};
