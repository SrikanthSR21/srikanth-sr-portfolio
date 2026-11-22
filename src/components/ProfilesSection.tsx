import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { FontPairOption, SocialProfile } from '../types';
import { SectionHeading } from './SectionHeading';
import { useToneAttrs } from '../lib/tone';
import { formatAsOf, platformMeta, PLATFORMS, publicProfiles } from '../lib/social';

const Avatar: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  const [broken, setBroken] = useState(false);
  const Icon = platformMeta(profile.platform).icon;
  return (
    <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden border border-white/15 bg-zinc-950 flex items-center justify-center">
      {profile.image && !broken
        ? <img src={profile.image} alt={`${profile.name} profile picture`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="w-full h-full object-cover" />
        : <Icon className="w-6 h-6 text-zinc-300" aria-hidden="true" />}
    </div>
  );
};

/** "Profiles I have managed". Renders NOTHING when there is no visible, valid profile (the nav link is hidden too, see App.tsx). */
export const ProfilesSection: React.FC<{ profiles: SocialProfile[]; fontPair: FontPairOption }> = ({ profiles, fontPair }) => {
  const tone = useToneAttrs('profiles');
  const { t } = useContent();
  const [selected, setSelected] = useState('all');

  const shown = publicProfiles(profiles);
  if (shown.length === 0) return null;

  // Only platforms that actually have a profile get a filter chip; chips appear only when there is something to filter.
  const platforms = PLATFORMS.filter((p) => shown.some((s) => s.profile.platform === p.id));
  const active = platforms.some((p) => p.id === selected) ? selected : 'all';
  const list = active === 'all' ? shown : shown.filter((s) => s.profile.platform === active);

  return (
    <section id="profiles" {...tone} className="py-16 sm:py-24 px-5 sm:px-6 border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto">
        <SectionHeading id="profiles" eyebrow={t('profiles.eyebrow')} title={t('profiles.title')} subtitle={t('profiles.subtitle')} fontPair={fontPair} className="mb-10 sm:mb-12"
          aside={platforms.length > 1 ? (
            <div role="group" aria-label="Filter profiles by platform" className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-white/15 overflow-x-auto max-w-full">
              {[{ id: 'all', label: t('profiles.all') }, ...platforms.map((p) => ({ id: p.id, label: p.label }))].map((f) => (
                <button key={f.id} type="button" onClick={() => setSelected(f.id)} aria-pressed={active === f.id}
                  className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${active === f.id ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          ) : undefined} />

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {list.map(({ profile: p, url }) => {
            const meta = platformMeta(p.platform);
            const Icon = meta.icon;
            const asOf = formatAsOf(p.asOf);
            const hasStats = !!(p.followers || p.growth);
            return (
              <li key={p.id} className="min-w-0">
                <article className="group relative h-full flex flex-col rounded-[var(--radius-card,20px)] bg-black border border-white/15 p-5 sm:p-6 transition-all duration-300 hover:border-white hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgb(var(--fg-rgb)/0.14)] focus-within:border-white">
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar profile={p} />
                    <div className="min-w-0 flex-1">
                      <h3 className={`card-heading text-base sm:text-lg font-semibold text-white uppercase tracking-tight break-words ${fontPair.headlineClass}`}>{p.name}</h3>
                      {p.handle && <div className="text-xs font-mono-code text-zinc-400 truncate">@{p.handle}</div>}
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono-code px-2 py-1 rounded-lg border border-white/20 text-zinc-300">
                      <Icon className="w-3 h-3" aria-hidden="true" />{meta.label}
                    </span>
                  </div>

                  {(p.niche || p.role) && (
                    <div className="mt-4 space-y-1 text-xs text-zinc-400 break-words">
                      {p.niche && <div className="text-zinc-200 font-semibold">{p.niche}</div>}
                      {p.role && <div>{p.role}</div>}
                    </div>
                  )}

                  {hasStats && (
                    <div className="mt-5 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-2 gap-3">
                        {p.followers && (
                          <div className="min-w-0">
                            <div className="text-lg font-bold text-white tabular-nums break-words">{p.followers}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Followers</div>
                          </div>
                        )}
                        {p.growth && (
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white break-words">{p.growth}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Growth</div>
                          </div>
                        )}
                      </div>
                      {asOf && <div className="mt-2 text-[10px] font-mono-code text-zinc-500">Figures as of {asOf}</div>}
                    </div>
                  )}

                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${t('profiles.viewProfile')}: ${p.name} on ${meta.label} (opens in a new tab)`}
                    className="mt-auto pt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white after:absolute after:inset-0 after:rounded-[var(--radius-card,20px)] after:content-['']">
                    {t('profiles.viewProfile')} <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </a>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
