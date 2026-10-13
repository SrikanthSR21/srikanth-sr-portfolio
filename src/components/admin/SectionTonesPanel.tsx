import React from 'react';
import { SECTION_REGISTRY, SectionId } from '../../lib/sections';
import { TONES, TONE_PRESETS, TONE_SWATCH, Tone, TypographySettings, bandFg, contrastRatio } from '../../lib/typography';
import { ColorField, Seg, fieldsetCls, legendCls } from './typoUi';

interface Props {
  draft: TypographySettings;
  setDraft: React.Dispatch<React.SetStateAction<TypographySettings>>;
  sections: SectionId[];
}

const HEX = /^#[0-9a-f]{6}$/i;
/** One-click blacks, greys and whites for the black / grey / white theme */
const QUICK = ['#000000', '#0e0e11', '#1c1c20', '#2e2e33', '#8a8a94', '#d4d4d8', '#e8e8ec', '#f6f6f7', '#ffffff'];

/** Dark-mode half / light-mode half of a band, so both themes are visible while choosing. */
const Swatch: React.FC<{ tone: Tone; custom?: { dark: string; light: string } }> = ({ tone, custom }) => {
  const sw = TONE_SWATCH[tone];
  const half = (mode: 'dark' | 'light'): [string, string] => {
    const c = custom?.[mode];
    return tone === 'custom' && c && HEX.test(c) ? [c, bandFg(c) === 'light' ? '#fafafa' : '#0a0a0a'] : sw[mode];
  };
  const d = half('dark'), l = half('light');
  return (
    <span aria-hidden="true" className="flex w-14 h-7 rounded-md overflow-hidden border border-white/25 shrink-0">
      <span className="flex-1 grid place-items-center text-[9px] font-bold" style={{ background: d[0], color: d[1] }}>Aa</span>
      <span className="flex-1 grid place-items-center text-[9px] font-bold" style={{ background: l[0], color: l[1] }}>Aa</span>
    </span>
  );
};

/** Which text colour the band will use, and how readable it is */
const Readout: React.FC<{ hex: string }> = ({ hex }) => {
  if (!HEX.test(hex)) return <span className="text-[10px] text-amber-400">Enter a full hex colour like #1c1c20</span>;
  const fg = bandFg(hex);
  const ratio = contrastRatio(hex, fg === 'light' ? '#fafafa' : '#0a0a0a');
  return <span className="text-[10px] text-zinc-500">{fg === 'light' ? 'White' : 'Black'} text · contrast {ratio.toFixed(1)}:1 {ratio >= 4.5 ? '· Readable' : '· Hard to read, try a darker or lighter colour'}</span>;
};

export const SectionTonesPanel: React.FC<Props> = ({ draft, setDraft, sections }) => {
  const setTone = (id: SectionId, tone: Tone) => setDraft((d) => {
    const next = { ...d, sectionTone: { ...d.sectionTone, [id]: tone } };
    // first time Custom is chosen: start from the colours the section has right now, so nothing jumps
    if (tone === 'custom' && !d.sectionCustom[id]) {
      const cur = d.sectionTone[id] ?? 'none';
      next.sectionCustom = { ...d.sectionCustom, [id]: { dark: TONE_SWATCH[cur].dark[0], light: TONE_SWATCH[cur].light[0] } };
    }
    return next;
  });
  const setCustom = (id: SectionId, mode: 'dark' | 'light', value: string) => setDraft((d) => {
    const cur = d.sectionCustom[id] ?? { dark: '#1c1c20', light: '#e8e8ec' };
    return { ...d, sectionCustom: { ...d.sectionCustom, [id]: { ...cur, [mode]: value } } };
  });
  const sameAs = (tones: TypographySettings['sectionTone']) => sections.every((id) => (draft.sectionTone[id] ?? 'none') === (tones[id] ?? 'none'));

  return (
    <fieldset className={fieldsetCls}>
      <legend className={legendCls}>Section backgrounds</legend>
      <p className="text-xs text-zinc-500 max-w-2xl">
        Give each section its own black, grey or white band so the content is easier to tell apart. Every swatch shows the <b className="text-zinc-300">dark-mode</b> look on the left and the
        <b className="text-zinc-300"> light-mode</b> look on the right, and the bands switch with the visitor's theme automatically. Text and cards inside a band stay readable.
        Choose <b className="text-zinc-300">Custom</b> on any section to set its exact colour for each mode.
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
          const custom = draft.sectionCustom[id];
          return (
            <div key={id} className="py-3 grid gap-3 sm:grid-cols-[10rem_1fr] sm:items-start">
              <div className="text-xs font-semibold text-zinc-200 sm:pt-2">{SECTION_REGISTRY[id].defaultLabel}</div>
              <div className="grid gap-3">
                <div role="radiogroup" aria-label={`${SECTION_REGISTRY[id].defaultLabel} background`} className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button key={t.id} type="button" role="radio" aria-checked={cur === t.id} title={t.hint} onClick={() => setTone(id, t.id)}
                      className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer ${cur === t.id ? 'border-white bg-white/10 text-white font-semibold' : 'border-white/15 text-zinc-400 hover:border-white/40'}`}>
                      <Swatch tone={t.id} custom={custom} />{t.label}
                    </button>
                  ))}
                </div>

                {cur === 'custom' && custom && (
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3 grid gap-3">
                    {(['dark', 'light'] as const).map((mode) => (
                      <div key={mode} className="grid gap-2">
                        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                          <ColorField label={mode === 'dark' ? 'Dark-mode colour' : 'Light-mode colour'} value={custom[mode]} onChange={(v) => setCustom(id, mode, v)} />
                          <div className="flex flex-wrap gap-1.5 pb-1.5" role="group" aria-label={`${mode} mode quick colours`}>
                            {QUICK.map((q) => (
                              <button key={q} type="button" title={q} aria-label={`Use ${q} in ${mode} mode`} onClick={() => setCustom(id, mode, q)}
                                className={`w-6 h-6 rounded-md border cursor-pointer ${custom[mode].toLowerCase() === q ? 'border-white ring-2 ring-white/60' : 'border-white/25 hover:border-white/60'}`} style={{ background: q }} />
                            ))}
                          </div>
                        </div>
                        <Readout hex={custom[mode]} />
                      </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => setDraft((d) => ({ ...d, sectionCustom: { ...d.sectionCustom, [id]: { dark: custom.dark, light: custom.dark } } }))}
                        className="px-2.5 py-1.5 text-[11px] rounded-lg border border-white/15 text-zinc-300 hover:border-white/40 cursor-pointer">Use the dark-mode colour in both modes</button>
                      <span className="text-[10px] text-zinc-500">Text colour switches to white or black on its own to stay readable.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Band edge</span>
        <Seg label="Band edge" value={draft.toneStyle} onChange={(v) => setDraft((d) => ({ ...d, toneStyle: v }))}
          options={[{ id: 'flat', label: 'Flat (solid band)' }, { id: 'fade', label: 'Fade into page' }]} />
        <p className="text-[11px] text-zinc-500">"Fade into page" blends Soft, Grey and Custom bands towards the page colour at the bottom. Contrast bands, and custom colours on the opposite side of the page (a white band in dark mode), stay solid so text is never on the wrong colour.</p>
      </div>
    </fieldset>
  );
};
