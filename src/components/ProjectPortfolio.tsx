import { useContent } from '../context/ContentContext';
import React from 'react';
import { ProjectItem, FontPairOption } from '../types';
import { SectionHeading } from './SectionHeading';
import { useToneAttrs } from '../lib/tone';
import { httpUrl } from '../lib/links';

const hostOf = (u: string) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };

interface ProjectPortfolioProps {
  projects: ProjectItem[];
  fontPair: FontPairOption;
}

export const ProjectPortfolio: React.FC<ProjectPortfolioProps> = ({
  projects,
  fontPair,
}) => {
  const tone = useToneAttrs('projects');
  const { t } = useContent();
  // Order = the order chosen in Admin → Projects. Only safe http(s) links are ever rendered.
  const visibleProjects = projects
    .filter((p) => p.visible !== false)
    .map((p) => ({ project: p, url: httpUrl(p.liveUrl) }));

  return (
    <section id="projects" {...tone} className="py-16 sm:py-24 px-5 sm:px-6 border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto">
        <SectionHeading id="projects" eyebrow={t('projects.eyebrow')} title={t('projects.title')} subtitle={t('projects.subtitle')} subtitlePlacement="side" fontPair={fontPair} className="mb-10 sm:mb-16" />

        {visibleProjects.length === 0 && (
          <p className="text-sm font-mono-code text-zinc-500">No projects to show yet.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7 items-stretch">
          {visibleProjects.map(({ project, url }, i) => {
            const host = hostOf(url);
            const desc = project.shortDesc?.trim();
            return (
              <article
                key={project.id}
                className="group relative flex flex-col min-w-0 rounded-[var(--radius-card,20px)] bg-black border border-white/15 p-6 sm:p-7 transition-all duration-500 hover:border-white hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgb(var(--fg-rgb)/0.18)] focus-within:border-white"
              >
                <div className="flex items-center justify-between gap-3 mb-5 text-[11px] font-mono-code text-zinc-500">
                  <span className="tabular-nums tracking-widest">{String(i + 1).padStart(2, '0')}</span>
                  {host && <span className="truncate min-w-0">{host}</span>}
                </div>

                <h3 className={`card-heading min-w-0 break-words text-lg sm:text-xl font-bold text-white uppercase tracking-tight ${fontPair.headlineClass}`}>
                  {project.title}
                </h3>

                {desc && (
                  <p className="tx-body mt-3 text-zinc-300 text-sm leading-relaxed break-words">{desc}</p>
                )}

                {/* Button pinned to the bottom of every card, so all cards line up. The link's ::after stretches over the whole card, making the entire card clickable too. */}
                <div className="mt-auto pt-6">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Launch ${project.title} (opens in a new tab)`}
                      className="group/btn inline-flex w-full items-center justify-center gap-2 px-5 py-3 min-h-11 text-xs font-bold uppercase tracking-wider text-white border border-white/30 bg-white/5 rounded-xl transition-all duration-300 hover:bg-white hover:text-black hover:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white after:absolute after:inset-0 after:rounded-[var(--radius-card,20px)] after:content-['']"
                    >
                      <span>Launch Project</span>
                      <span aria-hidden="true" className="inline-block text-sm leading-none transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5">↗</span>
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
