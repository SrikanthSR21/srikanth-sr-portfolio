import React from 'react';
import { inputCls } from './RecordsEditor';
import { rolesToCss } from '../../lib/typography';

export const lbl = 'text-[10px] uppercase tracking-wider text-zinc-500';
export const fieldsetCls = 'p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-4';
export const legendCls = 'px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300';

export const Seg = <T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) => (
  <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
    {options.map((o) => (
      <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
        className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer ${value === o.id ? 'bg-white text-black border-white font-semibold' : 'border-white/15 text-zinc-300 hover:border-white/40'}`}>{o.label}</button>
    ))}
  </div>
);

export const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
    <input type="checkbox" role="switch" className="w-4 h-4 accent-white" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}
  </label>
);

export const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="grid gap-1.5"><span className={lbl}>{label}</span>
    <span className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} picker`} className="w-12 h-9 bg-transparent border border-white/20 rounded cursor-pointer" />
      <input value={value} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)} aria-label={`${label} hex`} className={`${inputCls} !w-28 font-mono-code`} maxLength={7} />
    </span>
  </label>
);

/** A dark or a light sample box for live previews. The light box re-uses the site's light palette (.force-light), and the role colours
 *  for that mode are injected with a scope of their own, so the two boxes never affect each other. */
export const PreviewBox: React.FC<{ mode: 'dark' | 'light'; draft: import('../../lib/typography').TypographySettings; children: React.ReactNode; className?: string }> = ({ mode, draft, children, className = '' }) => (
  <div
    className={`tp-${mode} ${mode === 'light' ? 'force-light' : ''} rounded-xl border p-4 overflow-hidden ${className}`}
    style={{ containerType: 'inline-size', ...(mode === 'dark' ? { background: '#000', borderColor: 'rgba(255,255,255,.12)', color: '#fff' } : { background: '#fff', borderColor: 'rgba(10,10,10,.14)', color: '#0a0a0a' }) }}
  >
    <style>{rolesToCss(draft, `.tp-${mode}`, mode)}</style>
    <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: mode === 'dark' ? '#71717a' : '#6b6b76' }}>{mode === 'dark' ? 'Dark mode' : 'Light mode'}</div>
    {children}
  </div>
);
