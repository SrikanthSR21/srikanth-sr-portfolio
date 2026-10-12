import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { FONT_PAIRS } from '../../data/portfolioData';
import { HeroAnimationMode, ThemeSettings } from '../../types';

const ANIMS: { id: HeroAnimationMode; label: string; hint: string }[] = [
  { id: 'grid', label: 'Grid', hint: 'Interactive abstract grid' },
  { id: 'waterfall', label: 'Code', hint: 'Matrix-style text flow' },
  { id: 'circles', label: 'Pulse', hint: 'Pulsing outline circles' },
];

const card = (active: boolean) =>
  `text-left p-3 rounded-xl border transition-colors cursor-pointer ${
    active ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-300 border-white/15 hover:border-white/40'
  }`;

export const AppearanceAdmin: React.FC = () => {
  const { settings, saveSetting } = useContent();
  const theme = settings.theme;
  const [msg, setMsg] = useState('');
  const [custom, setCustom] = useState({ bg: theme.customBg, text: theme.customText, accent: theme.customAccent });

  const update = async (patch: Partial<ThemeSettings>) => {
    setMsg('Saving…');
    try { await saveSetting('theme', { ...theme, ...patch }); setMsg('Saved ✓ — live on the public site'); }
    catch (e: any) { setMsg(e.message || 'Save failed'); }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-widest text-zinc-500">Theme</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <button className={card(theme.backgroundMode === 'true-black')} onClick={() => update({ backgroundMode: 'true-black', customBg: '#000000' })}>
            <div className="text-sm font-semibold flex justify-between">True Black {theme.backgroundMode === 'true-black' && <Check className="w-4 h-4" />}</div>
            <div className="text-[11px] opacity-70 mt-1">#000000</div>
          </button>
          <button className={card(theme.backgroundMode === 'midnight-black')} onClick={() => update({ backgroundMode: 'midnight-black', customBg: '#0a0b0e' })}>
            <div className="text-sm font-semibold flex justify-between">Midnight Black {theme.backgroundMode === 'midnight-black' && <Check className="w-4 h-4" />}</div>
            <div className="text-[11px] opacity-70 mt-1">#0a0b0e</div>
          </button>
          <button className={card(theme.backgroundMode === 'custom')} onClick={() => update({ backgroundMode: 'custom', customBg: custom.bg })}>
            <div className="text-sm font-semibold flex justify-between">Custom {theme.backgroundMode === 'custom' && <Check className="w-4 h-4" />}</div>
            <div className="text-[11px] opacity-70 mt-1">Pick your own colours</div>
          </button>
        </div>

        {theme.backgroundMode === 'custom' && (
          <div className="flex flex-wrap items-end gap-4 p-3 rounded-xl border border-white/15 bg-zinc-950">
            {([['bg', 'Background'], ['text', 'Text'], ['accent', 'Accent']] as const).map(([k, label]) => (
              <label key={k} className="grid gap-1 text-[11px] text-zinc-400">
                {label}
                <input type="color" value={custom[k]} onChange={(e) => setCustom({ ...custom, [k]: e.target.value })}
                  className="w-16 h-8 bg-transparent border border-white/20 rounded cursor-pointer" />
              </label>
            ))}
            <button onClick={() => update({ customBg: custom.bg, customText: custom.text, customAccent: custom.accent })}
              className="px-3 py-1.5 text-xs font-bold bg-white text-black rounded-lg cursor-pointer">Apply colours</button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-widest text-zinc-500">Default mode for new visitors</h3>
        <p className="text-[11px] text-zinc-500 max-w-xl">Visitors can switch between dark and light with the toggle in the navbar; their choice is remembered in their own browser and never changes this setting. Dark mode uses the theme above.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {([['dark', 'Dark', 'Your configured theme'], ['light', 'Light', 'White background, black text'], ['system', 'Match device', "Follows the visitor's OS setting"]] as const).map(([id, label, hint]) => (
            <button key={id} className={card((theme.defaultMode ?? 'dark') === id)} onClick={() => update({ defaultMode: id })}>
              <div className="text-sm font-semibold flex justify-between">{label} {(theme.defaultMode ?? 'dark') === id && <Check className="w-4 h-4" />}</div>
              <div className="text-[11px] opacity-70 mt-1">{hint}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-widest text-zinc-500">Typography</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {FONT_PAIRS.map((fp) => (
            <button key={fp.id} className={card(theme.fontPairId === fp.id)} onClick={() => update({ fontPairId: fp.id })}>
              <div className={`text-2xl leading-none mb-2 ${fp.headlineClass}`}>Morgan</div>
              <div className={`text-xs ${fp.bodyClass}`}>Creative developer / ads strategist</div>
              <div className="text-[10px] opacity-60 mt-2">{fp.name}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-widest text-zinc-500">Hero animation</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {ANIMS.map((a) => (
            <button key={a.id} className={card(theme.heroAnimation === a.id)} onClick={() => update({ heroAnimation: a.id })}>
              <div className="text-sm font-semibold">{a.label}</div>
              <div className="text-[11px] opacity-70 mt-1">{a.hint}</div>
            </button>
          ))}
        </div>
      </section>

      {msg && <div role="status" className="text-xs text-zinc-300 font-mono-code">{msg}</div>}
    </div>
  );
};
