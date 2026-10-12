import React, { useEffect, useRef, useState } from 'react';
import { useContent } from '../context/ContentContext';
import type { FontPairOption } from '../types';
import { visibleSkillGroups, SkillItem } from '../lib/skills';
import { SectionHeading } from './SectionHeading';
import { SkillIcon } from './SkillIcon';

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

const Bar: React.FC<{ name: string; level: number; grown: boolean }> = ({ name, level, grown }) => (
  <div role="progressbar" aria-label={`${name} proficiency`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={level}
    className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
    <div className="skill-bar h-full rounded-full bg-white" style={{ width: grown ? `${level}%` : '0%' }} />
  </div>
);

export const SkillsSection: React.FC<{ fontPair: FontPairOption }> = ({ fontPair }) => {
  const { settings, t } = useContent();
  const cfg = settings.skills;
  const groups = visibleSkillGroups(cfg);
  const [ref, seen] = useInView<HTMLDivElement>();
  const showLevel = (s: SkillItem) => cfg.showLevels && s.level != null;

  return (
    <section id="skills" className="py-16 sm:py-24 px-5 sm:px-6 border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto">
        <SectionHeading id="skills" eyebrow={t('skills.eyebrow')} title={t('skills.title')} subtitle={t('skills.subtitle')} fontPair={fontPair} className="mb-10 sm:mb-14" />

        {groups.length === 0 && <p className="text-sm font-mono-code text-zinc-500">No skills to show yet.</p>}

        <div ref={ref}>
          {/* CARDS: one card per category */}
          {cfg.layout === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {groups.map(({ category, items }) => (
                <article key={category.id} className="min-w-0 flex flex-col p-5 sm:p-6 bg-zinc-950/60 rounded-[var(--radius-card,20px)] border border-white/10 hover:border-white/30 transition-colors">
                  <header className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><SkillIcon icon={category.icon} fallback="Layers" className="w-5 h-5" /></span>
                    <div className="min-w-0">
                      <h3 className={`card-heading text-base font-bold text-white uppercase tracking-wider break-words ${fontPair.headlineClass}`}>{category.name}</h3>
                      {category.description && <p className="text-[11px] text-zinc-500 break-words">{category.description}</p>}
                    </div>
                  </header>
                  <ul className="space-y-3 flex-1">
                    {items.map((s) => (
                      <li key={s.id} className="min-w-0">
                        <div className="flex items-start gap-2.5 text-sm text-zinc-200">
                          <span className="mt-0.5 shrink-0 text-white/80 w-4 h-4 flex items-center justify-center"><SkillIcon icon={s.icon} className="w-4 h-4" /></span>
                          <span className="min-w-0 break-words flex-1">{s.name}</span>
                          {showLevel(s) && <span className="text-[11px] font-mono-code text-zinc-500 tabular-nums">{s.level}%</span>}
                        </div>
                        {s.description && <p className="pl-[1.625rem] mt-0.5 text-xs text-zinc-500 leading-relaxed break-words">{s.description}</p>}
                        {showLevel(s) && <div className="pl-[1.625rem] mt-1.5"><Bar name={s.name} level={s.level!} grown={seen} /></div>}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}

          {/* TAGS: compact pills grouped by category */}
          {cfg.layout === 'tags' && (
            <div className="space-y-8 sm:space-y-10">
              {groups.map(({ category, items }) => (
                <div key={category.id}>
                  <h3 className={`card-heading flex items-center gap-2.5 mb-3 text-sm font-bold text-white uppercase tracking-wider ${fontPair.headlineClass}`}>
                    <SkillIcon icon={category.icon} fallback="Layers" className="w-4 h-4" /><span className="break-words min-w-0">{category.name}</span>
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {items.map((s) => (
                      <li key={s.id} title={s.description || undefined}
                        className="inline-flex items-center gap-2 max-w-full px-3.5 py-2 text-xs sm:text-sm rounded-full bg-zinc-950/70 border border-white/15 text-zinc-200 hover:border-white/50 transition-colors">
                        <SkillIcon icon={s.icon} className="w-3.5 h-3.5 shrink-0" />
                        <span className="break-words min-w-0">{s.name}</span>
                        {showLevel(s) && <span className="text-[10px] font-mono-code text-zinc-500 tabular-nums">{s.level}%</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* BARS: progress indicators, two columns */}
          {cfg.layout === 'bars' && (
            <div className="space-y-10">
              {groups.map(({ category, items }) => (
                <div key={category.id}>
                  <h3 className={`card-heading flex items-center gap-2.5 mb-5 pb-2 border-b border-white/10 text-sm font-bold text-white uppercase tracking-wider ${fontPair.headlineClass}`}>
                    <SkillIcon icon={category.icon} fallback="Layers" className="w-4 h-4" /><span className="break-words min-w-0">{category.name}</span>
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                    {items.map((s) => (
                      <li key={s.id} className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 text-sm text-zinc-200">
                          <SkillIcon icon={s.icon} className="w-4 h-4 shrink-0 text-white/80" />
                          <span className="flex-1 min-w-0 break-words">{s.name}</span>
                          {showLevel(s) && <span className="text-[11px] font-mono-code text-zinc-500 tabular-nums">{s.level}%</span>}
                        </div>
                        {showLevel(s) && <Bar name={s.name} level={s.level!} grown={seen} />}
                        {s.description && <p className="mt-1.5 text-xs text-zinc-500 break-words">{s.description}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
