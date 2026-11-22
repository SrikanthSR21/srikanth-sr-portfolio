import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Instagram, Play, X } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { FontPairOption, ReelItem } from '../types';
import { SectionHeading } from './SectionHeading';
import { useToneAttrs } from '../lib/tone';
import { ParsedReel, publicReels } from '../lib/social';

type Entry = { reel: ReelItem; parsed: ParsedReel };

/** Plays one reel inside the page. The Instagram embed is only requested after the visitor taps a card, so the page stays fast
 *  and nothing is sent to Instagram until then. Esc / backdrop / × close it; focus returns to the card that opened it. */
const ReelPlayer: React.FC<{ entry: Entry; onClose: () => void }> = ({ entry, onClose }) => {
  const { t } = useContent();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={entry.reel.caption || 'Instagram reel'}>
      <button type="button" aria-label="Close reel" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-default" />
      <div className="relative w-[min(94vw,420px)] max-h-full flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-mono-code text-white/90">{entry.reel.caption}</p>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close reel"
            className="shrink-0 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center cursor-pointer hover:bg-zinc-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative rounded-2xl overflow-hidden bg-white h-[min(78vh,740px)]">
          <span className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500" aria-hidden="true">Loading reel…</span>
          <iframe src={entry.parsed.embed} title={entry.reel.caption || 'Instagram reel'} className="relative w-full h-full border-0" allow="encrypted-media; fullscreen; clipboard-write" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        </div>
        <a href={entry.parsed.canonical} target="_blank" rel="noopener noreferrer" className="self-center inline-flex items-center gap-1.5 text-xs font-mono-code text-white/90 hover:text-white underline underline-offset-4">
          {t('reels.openIg')} <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
};

const Cover: React.FC<{ src: string }> = ({ src }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center"><Instagram className="w-10 h-10 text-zinc-600" aria-hidden="true" /></div>;
  return <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />;
};

/** Instagram reels. Renders NOTHING when there is no visible reel with a valid link (the nav link is hidden too, see App.tsx). */
export const ReelsSection: React.FC<{ reels: ReelItem[]; fontPair: FontPairOption }> = ({ reels, fontPair }) => {
  const tone = useToneAttrs('reels');
  const { t } = useContent();
  const [activeId, setActiveId] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const entries = publicReels(reels);
  const active = entries.find((e) => e.reel.id === activeId);
  const close = useCallback(() => { setActiveId(null); opener.current?.focus(); }, []);

  if (entries.length === 0) return null;

  return (
    <section id="reels" {...tone} className="py-16 sm:py-24 px-5 sm:px-6 border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto">
        <SectionHeading id="reels" eyebrow={t('reels.eyebrow')} title={t('reels.title')} subtitle={t('reels.subtitle')} fontPair={fontPair} className="mb-10 sm:mb-12" />
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {entries.map((e) => (
            <li key={e.reel.id} className="min-w-0">
              <button type="button" onClick={(ev) => { opener.current = ev.currentTarget; setActiveId(e.reel.id); }}
                aria-label={`${t('reels.watch')}${e.reel.caption ? `: ${e.reel.caption}` : ''}`}
                className="group relative block w-full aspect-[9/16] overflow-hidden rounded-[var(--radius-card,20px)] border border-white/15 bg-black text-left cursor-pointer transition-all duration-300 hover:border-white hover:shadow-[0_0_30px_rgb(var(--fg-rgb)/0.14)] focus-visible:border-white">
                <Cover src={e.reel.cover} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" aria-hidden="true" />
                <span className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md" aria-hidden="true"><Play className="w-4 h-4 fill-current ml-0.5" /></span>
                <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <span className="block text-[10px] font-mono-code uppercase tracking-widest text-white/80 mb-1">{t('reels.watch')}</span>
                  {e.reel.caption && <span className="block text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-3 break-words">{e.reel.caption}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {active && <ReelPlayer entry={active} onClose={close} />}
    </section>
  );
};
