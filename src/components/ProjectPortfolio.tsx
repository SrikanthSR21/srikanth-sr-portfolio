import { useContent } from '../context/ContentContext';
import React, { useEffect, useState } from 'react';
import { ProjectItem, FontPairOption } from '../types';
import { ArrowUpRight, ExternalLink, Github, Globe, Smartphone, Monitor, X } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { useToneAttrs } from '../lib/tone';

const withProtocol = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
const hostOf = (u: string, fallbackTitle: string) => {
  try { return new URL(withProtocol(u)).host; } catch { return `${fallbackTitle.toLowerCase().replace(/\s+/g, '')}.live`; }
};

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
  const visibleProjects = projects.filter((p) => p.visible !== false);
  const [activeModalProject, setActiveModalProject] = useState<ProjectItem | null>(null);
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  // Escape closes the dialog; listener removed when it closes / unmounts
  useEffect(() => {
    if (!activeModalProject) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveModalProject(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeModalProject]);

  return (
    <section id="projects" {...tone} className="py-16 sm:py-24 px-5 sm:px-6 border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto">
        <SectionHeading id="projects" eyebrow={t('projects.eyebrow')} title={t('projects.title')} subtitle={t('projects.subtitle')} subtitlePlacement="side" fontPair={fontPair} className="mb-10 sm:mb-16" />

        {/* Live Card Gallery Grid */}
        {visibleProjects.length === 0 && (
          <p className="text-sm font-mono-code text-zinc-500">No projects to show yet.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7 items-stretch">
          {visibleProjects.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col min-w-0 rounded-[var(--radius-card,20px)] bg-black border border-white/15 overflow-hidden transition-all duration-500 hover:border-white hover:shadow-[0_0_35px_rgb(var(--fg-rgb)/0.18)]"
            >
              {/* TOP 2/3 CONTAINER: High-Resolution Colorful Live Hero Preview */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950 border-b border-white/10">
                {/* Browser simulation top bar */}
                <div className="absolute top-0 inset-x-0 h-7 bg-black/75 backdrop-blur-md z-10 px-3 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-[10px] font-mono-code text-zinc-400 truncate min-w-0 flex-1 mx-2 text-center">
                    {hostOf(project.liveUrl, project.title)}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono-code tabular-nums">{project.year}</div>
                </div>

                {/* Colorful Hero Image */}
                <img
                  src={project.heroImage}
                  alt={`${project.title} live website hero`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top pt-7 group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Category kicker on image */}
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <span className="inline-block max-w-full truncate text-[11px] font-mono-code px-2.5 py-1 bg-black/80 text-white rounded-lg border border-white/20 backdrop-blur-md">
                    {project.category}
                  </span>
                </div>
              </div>

              {/* BOTTOM 1/3 CONTAINER: Pure White Text on Black Background */}
              <div className="p-5 sm:p-6 flex flex-col justify-between flex-grow bg-black">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3
                      className={`card-heading min-w-0 break-words text-lg sm:text-xl font-bold text-white uppercase tracking-tight group-hover:text-zinc-100 transition-colors ${fontPair.headlineClass}`}
                    >
                      {project.title}
                    </h3>
                    <span className="shrink-0 text-xs font-mono-code text-zinc-500 tabular-nums pt-1">
                      {project.year}
                    </span>
                  </div>

                  <p className="tx-body text-zinc-300 text-sm leading-relaxed mb-4">
                    {project.shortDesc}
                  </p>

                  {project.tags?.length > 0 && (
                    <ul aria-label="Skills and technologies" className="flex flex-wrap gap-1.5 mb-4">
                      {project.tags.map((tag) => (
                        <li key={tag} className="text-[10px] font-mono-code px-2 py-0.5 rounded-md border border-white/15 text-zinc-300">{tag}</li>
                      ))}
                    </ul>
                  )}

                  {project.metrics && <div className="text-xs font-mono-code text-zinc-400 mb-5 break-words">{project.metrics}</div>}
                </div>

                {/* Single VIEW SITE text link */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <button
                    onClick={() => setActiveModalProject(project)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider group/link hover:underline hover:underline-offset-4 transition-all cursor-pointer"
                  >
                    <span>{t('projects.viewSite')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </button>

                  {project.client && (
                    <span className="text-[11px] text-zinc-500 font-mono-code break-words min-w-0">Client: {project.client}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Website Live Modal / Drawer */}
      {activeModalProject && (
        <div role="dialog" aria-modal="true" aria-label={`${activeModalProject.title} details`} onClick={(e) => { if (e.target === e.currentTarget) setActiveModalProject(null); }} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl">
          <div className="relative w-full max-w-5xl max-h-[92dvh] flex flex-col bg-zinc-950 border border-white/20 rounded-[var(--radius-card,20px)] shadow-2xl overflow-hidden">
            {/* Modal Header Bar */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-black border-b border-white/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Globe className="w-4 h-4 text-white shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white uppercase truncate">
                    {activeModalProject.title}
                  </h4>
                  <div className="text-[11px] text-zinc-400 font-mono-code truncate">
                    {[activeModalProject.client, activeModalProject.role].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>

              {/* Viewport switcher */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-white/10 text-xs">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer ${
                    deviceView === 'desktop'
                      ? 'bg-white text-black font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer ${
                    deviceView === 'mobile'
                      ? 'bg-white text-black font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveModalProject(null)}
                className="shrink-0 p-2 text-zinc-400 hover:text-white rounded-lg border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
                title="Close"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-grow space-y-5 sm:space-y-6">
              {/* Simulated Device Frame with colorful hero image */}
              <div
                className={`mx-auto rounded-xl border border-white/15 overflow-hidden shadow-2xl bg-black transition-all ${
                  deviceView === 'desktop' ? 'w-full aspect-[16/9]' : 'w-64 max-w-full aspect-[9/16]'
                }`}
              >
                <img
                  src={activeModalProject.heroImage}
                  alt={activeModalProject.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Detailed Project Story */}
              <div className="p-4 sm:p-6 bg-black rounded-xl border border-white/10">
                <div className="text-xs uppercase font-mono-code text-zinc-400 mb-1">
                  Architecture & Deliverables
                </div>
                <h5 className="text-lg font-bold text-white mb-3">
                  {activeModalProject.title} — Executive Case Study
                </h5>
                <p className="tx-body text-sm text-zinc-300 leading-relaxed mb-4 whitespace-pre-line break-words">
                  {activeModalProject.fullDesc}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
                  {activeModalProject.metrics && (
                    <div className="text-xs font-mono-code text-white break-words min-w-0">Impact: {activeModalProject.metrics}</div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {activeModalProject.sourceUrl && (
                      <a
                        href={withProtocol(activeModalProject.sourceUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white border border-white/30 rounded-lg hover:border-white transition-colors flex items-center gap-2"
                      >
                        <Github className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t('projects.sourceCode')}</span>
                      </a>
                    )}
                    {activeModalProject.liveUrl && (
                      <a
                        href={withProtocol(activeModalProject.liveUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black bg-white rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>Launch Live Site</span>
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
