import { useContent } from '../context/ContentContext';
import React, { useEffect, useRef, useState } from 'react';
import { ProjectItem, FontPairOption } from '../types';
import { SectionHeading } from './SectionHeading';
import { useToneAttrs } from '../lib/tone';
import { httpUrl } from '../lib/links';

const hostOf = (u: string) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };


type PreviewState = 'idle' | 'checking' | 'loading' | 'ready' | 'blocked' | 'unreachable' | 'insecure';

/** Result cache shared by all cards: one header check per URL per visit. */
const embedCache = new Map<string, Promise<{ embeddable: boolean; reason?: string } | null>>();
const checkEmbeddable = (url: string) => {
  if (!embedCache.has(url)) {
    embedCache.set(url, fetch(`/api/embed-check?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)); // API not available (e.g. `npm run dev`): fall back to trying the iframe
  }
  return embedCache.get(url)!;
};

const LOAD_TIMEOUT_MS = 15000;

/** Live, scrollable website inside the card. Starts loading only when the card nears the viewport. */
const SitePreview: React.FC<{ url: string; title: string; host: string }> = ({ url, title, host }) => {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PreviewState>('idle');

  useEffect(() => {
    setState('idle');
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    let timer: number | undefined;
    const start = async () => {
      // An http:// site cannot be framed inside an https:// page (mixed content), so skip straight to the fallback.
      if (url.startsWith('http://') && window.location.protocol === 'https:') { setState('insecure'); return; }
      setState('checking');
      const res = await checkEmbeddable(url);
      if (cancelled) return;
      if (res && res.embeddable === false) { setState(res.reason === 'unreachable' ? 'unreachable' : 'blocked'); return; }
      setState('loading');
      timer = window.setTimeout(() => setState((s) => (s === 'loading' ? 'unreachable' : s)), LOAD_TIMEOUT_MS);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); void start(); }
    }, { rootMargin: '300px' });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); window.clearTimeout(timer); };
  }, [url]);

  const showFrame = state === 'loading' || state === 'ready';
  const fallback = state === 'blocked' || state === 'unreachable' || state === 'insecure';
  const message =
    state === 'blocked' ? 'This website does not allow itself to be shown inside other pages (X-Frame-Options / CSP frame-ancestors). Open it directly to view it.'
    : state === 'insecure' ? 'This site uses an insecure (http) address, so it cannot be previewed here. Open it directly to view it.'
    : 'The preview could not be loaded. Open the project directly to view it.';

  return (
    <div
      ref={box}
      className="relative h-[280px] sm:h-[300px] overflow-hidden rounded-xl border border-white/15 bg-zinc-950"
      aria-busy={state === 'checking' || state === 'loading'}
    >
      {showFrame && (
        <iframe
          src={url}
          title={`${title} website preview`}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setState('ready')}
          onError={() => setState('unreachable')}
          className={`absolute inset-0 h-full w-full border-0 bg-white transition-opacity duration-500 ${state === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {(state === 'idle' || state === 'checking' || state === 'loading') && (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <span className="h-7 w-7 rounded-full border-2 border-white/20 border-t-white animate-spin" aria-hidden="true" />
          <span className="text-[11px] font-mono-code uppercase tracking-widest">Loading preview{host ? ` · ${host}` : ''}</span>
        </div>
      )}
      {fallback && (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="text-2xl" aria-hidden="true">⧉</span>
          <p className="text-xs leading-relaxed text-zinc-400">{message}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold uppercase tracking-wider text-white underline underline-offset-4 hover:no-underline"
          >
            Open {host || 'project'} ↗
          </a>
        </div>
      )}
    </div>
  );
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

                <h3 className={`card-heading min-w-0 break-words text-lg font-semibold text-white uppercase tracking-tight ${fontPair.headlineClass}`}>
                  {project.title}
                </h3>

                {desc && (
                  <p className="tx-body mt-3 text-zinc-300 text-sm leading-relaxed break-words">{desc}</p>
                )}

                {/* Live website, scrollable inside the card. Loaded from the project's own URL. */}
                <div className="mt-5">
                  {url ? (
                    <SitePreview url={url} title={project.title} host={host} />
                  ) : (
                    <div className="flex h-[280px] sm:h-[300px] items-center justify-center rounded-xl border border-dashed border-white/15 px-6 text-center text-xs text-zinc-500">
                      {project.liveUrl?.trim() ? 'This project has an invalid website address.' : 'No website address has been added for this project yet.'}
                    </div>
                  )}
                </div>

                {/* Button pinned to the bottom of every card, so all cards line up. */}
                <div className="mt-auto pt-6">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Launch ${project.title} (opens in a new tab)`}
                      className="group/btn inline-flex w-full items-center justify-center gap-2 px-5 py-3 min-h-11 text-xs font-bold uppercase tracking-wider text-white border border-white/30 bg-white/5 rounded-xl transition-all duration-300 hover:bg-white hover:text-black hover:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
