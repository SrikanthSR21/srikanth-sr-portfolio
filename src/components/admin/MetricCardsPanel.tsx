import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { MetricCards } from '../MetricCards';
import { DEFAULT_METRIC_CARDS, MetricCardSettings, TypographySettings } from '../../lib/typography';
import { PreviewBox, Seg, Switch, fieldsetCls, legendCls } from './typoUi';

interface Props {
  draft: TypographySettings;
  setDraft: React.Dispatch<React.SetStateAction<TypographySettings>>;
}

export const MetricCardsPanel: React.FC<Props> = ({ draft, setDraft }) => {
  const { settings } = useContent();
  const [replay, setReplay] = useState(0);
  const m = draft.metricCards;
  const set = (patch: Partial<MetricCardSettings>) => { setDraft((d) => ({ ...d, metricCards: { ...d.metricCards, ...patch } })); setReplay((n) => n + 1); };

  return (
    <fieldset className={fieldsetCls}>
      <legend className={legendCls}>Hero cards (5,000+ · 4.2x · 4 Clients · 3 Brands)</legend>
      <p className="text-xs text-zinc-500 max-w-2xl">The four headline numbers float as cards and fade in one after another when the page opens. Colours follow dark / light mode. Edit the numbers and labels themselves under Hero, Contact &amp; Social.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-1.5"><span className="text-[10px] uppercase tracking-wider text-zinc-500">Card style</span>
          <Seg label="Card style" value={m.style} onChange={(v) => set({ style: v })} options={[{ id: 'glass', label: 'Frosted glass' }, { id: 'solid', label: 'Solid' }, { id: 'outline', label: 'Outline' }]} /></div>
        <div className="grid gap-1.5"><span className="text-[10px] uppercase tracking-wider text-zinc-500">Appear animation</span>
          <Seg label="Appear animation" value={m.entrance} onChange={(v) => set({ entrance: v })} options={[{ id: 'rise', label: 'Rise up' }, { id: 'fade', label: 'Fade' }, { id: 'scale', label: 'Pop in' }, { id: 'flip', label: 'Tilt in' }, { id: 'none', label: 'None' }]} /></div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Switch label="Gentle floating motion" checked={m.float} onChange={(v) => set({ float: v })} />
        <Switch label="Lift and glow on hover" checked={m.hover} onChange={(v) => set({ hover: v })} />
        <button type="button" onClick={() => setReplay((n) => n + 1)} className="flex items-center gap-1.5 px-3 py-1 text-xs border border-white/20 rounded-lg text-zinc-200 hover:bg-white/10 cursor-pointer"><RotateCcw className="w-3.5 h-3.5" />Replay animation</button>
      </div>
      <p className="text-[11px] text-zinc-500">Visitors who prefer reduced motion automatically get still cards, with no float and no entrance animation.</p>

      <div className="grid sm:grid-cols-2 gap-3">
        {(['dark', 'light'] as const).map((mode) => (
          <PreviewBox key={mode} mode={mode} draft={draft}>
            <MetricCards key={`${mode}${replay}`} metrics={settings.hero_metrics} settings={m} className="!grid-cols-2 !gap-3" />
          </PreviewBox>
        ))}
      </div>
      <button type="button" onClick={() => set({ ...DEFAULT_METRIC_CARDS })} className="text-[11px] text-zinc-400 underline underline-offset-4 hover:text-white cursor-pointer">Reset cards to recommended</button>
    </fieldset>
  );
};
