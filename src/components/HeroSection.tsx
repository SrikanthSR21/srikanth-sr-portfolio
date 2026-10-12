import React, { useState, useRef } from 'react';
import { HeroAnimationMode, FontPairOption } from '../types';
import { ArrowDown, FileText, ArrowRight } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { ContactLink, HeroContactRow } from './ContactLinks';

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  fontPair: FontPairOption;
  initialMode?: HeroAnimationMode;
  onOpenResume: () => void;
  realName: string;
  /** Mobile only: quick-contact links rendered inside the hero (the desktop floating bar is not shown on mobile) */
  mobileContactLinks?: ContactLink[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  headline,
  subheadline,
  fontPair,
  initialMode = 'grid',
  onOpenResume,
  realName,
  mobileContactLinks,
}) => {
  const { settings, t } = useContent();
  const animationMode: HeroAnimationMode = initialMode; // chosen in /admin → Appearance
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [activePersona, setActivePersona] = useState<'persona' | 'real'>('persona');
  const displayName = activePersona === 'persona' ? headline : realName;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const matrixTerms = [
    'ROAS: 4.2x',
    'python manage.py runserver',
    'Meta_Ads_Manager.scale()',
    'SERP #1 RANK',
    'CyberBix.deploy()',
    'const ctr = 0.38;',
    'ORDERBIX_STOREFRONT',
    'Google_Search_Console',
    '6THLOOM_VIRAL_GIVEAWAY',
    'border-radius: 20px;',
    'GA4_CONVERSIONS',
    'TAILWIND_B&W',
    'git commit -m "scale"',
    'DESERT_AYURVEDA_UAE'
  ];

  return (
    <section
      id="home"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[90svh] flex flex-col justify-center items-center px-5 sm:px-6 pt-14 pb-24 sm:pb-28 overflow-hidden border-b border-white/10 select-none"
    >
      {/* Background Interactive Animation Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* MODE 1: Abstract Grid with ripple effect based on mouse pos */}
        {animationMode === 'grid' && (
          <div
            className="absolute inset-0 opacity-25 transition-transform duration-300 ease-out"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgb(var(--fg-rgb) / 0.12) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(var(--fg-rgb) / 0.12) 1px, transparent 1px)
              `,
              backgroundSize: '64px 64px',
              transform: `perspective(600px) rotateX(${
                (mousePos.y - 0.5) * 8
              }deg) rotateY(${-(mousePos.x - 0.5) * 8}deg) scale(${
                1 + Math.abs(mousePos.x - 0.5) * 0.08
              })`,
            }}
          >
            <div
              className="absolute w-96 h-96 rounded-full bg-white/10 blur-3xl transition-all duration-150"
              style={{
                left: `calc(${mousePos.x * 100}% - 192px)`,
                top: `calc(${mousePos.y * 100}% - 192px)`,
              }}
            />
          </div>
        )}

        {/* MODE 2: White Text Matrix Waterfall */}
        {animationMode === 'waterfall' && (
          <div className="absolute inset-0 flex justify-between opacity-20 text-[11px] font-mono-code text-white select-none">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((colIndex) => (
              <div
                key={colIndex}
                className="flex flex-col gap-6 animate-pulse"
                style={{
                  animationDuration: `${3 + (colIndex % 3)}s`,
                  transform: `translateY(${((colIndex * 37) % 50)}px)`,
                }}
              >
                {matrixTerms
                  .concat(matrixTerms)
                  .slice(colIndex, colIndex + 8)
                  .map((term, i) => (
                    <span
                      key={i}
                      className="tracking-widest whitespace-nowrap opacity-60 hover:opacity-100 transition-opacity"
                    >
                      {term}
                    </span>
                  ))}
              </div>
            ))}
          </div>
        )}

        {/* MODE 3: Discreet White Outline Circle Pulse */}
        {animationMode === 'circles' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-96 h-96">
              <div className="absolute inset-0 rounded-full border border-white/25 animate-ping opacity-30" style={{ animationDuration: '4s' }} />
              <div className="absolute -inset-16 rounded-full border border-white/20 animate-ping opacity-25" style={{ animationDuration: '6s' }} />
              <div className="absolute -inset-32 rounded-full border border-white/10 animate-ping opacity-20" style={{ animationDuration: '8s' }} />
              <div className="absolute -inset-48 rounded-full border border-white/5 animate-pulse opacity-15" />
            </div>
          </div>
        )}
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto text-center flex flex-col items-center min-w-0">
        {/* Persona toggle */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-zinc-400 font-mono-code">
          <span>{t('hero.eyebrow')}</span>
          <span aria-hidden="true">/</span>
          <button
            onClick={() => setActivePersona(activePersona === 'persona' ? 'real' : 'persona')}
            className="hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
            title="Toggle between Creative Persona & Legal Name"
          >
            {activePersona === 'persona' ? t('hero.viewAsReal') : t('hero.viewAsPersona')}
          </button>
        </div>

        {/* Big powerful white text */}
        <h1
          className={`max-w-full font-black text-white tracking-tighter leading-[1.02] mb-6 drop-shadow-sm ${fontPair.headlineClass}`}
          // Fluid size: ~42px at 320px wide, ~77px at 768px, capped at 128px (the previous lg:text-9xl).
          // overflow-wrap keeps one very long word from ever pushing the page wider than the screen.
          style={{ textWrap: 'balance', fontSize: 'clamp(2.5rem, 8vw + 1rem, 8rem)', overflowWrap: 'anywhere' }}
        >
          {displayName}
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-xl md:text-2xl font-medium tracking-[0.12em] sm:tracking-widest text-zinc-300 uppercase mb-8 sm:mb-10 max-w-3xl break-words">
          {subheadline}
        </p>

        {/* Mobile: contact buttons sit right under the name instead of floating over the content */}
        {mobileContactLinks && mobileContactLinks.length > 0 && <HeroContactRow links={mobileContactLinks} />}

        {/* Action CTAs: side by side when both fit (basis 14rem each), otherwise they stack full-width */}
        <div className="flex flex-wrap items-stretch justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none">
          <a
            href="#projects"
            className="grow sm:grow-0 basis-56 sm:basis-auto min-h-12 px-7 sm:px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-center text-black bg-white rounded-full hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('hero.ctaPrimary')}</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </a>

          <button
            onClick={onOpenResume}
            className="grow sm:grow-0 basis-56 sm:basis-auto min-h-12 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-center text-white border border-white/30 rounded-full hover:border-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t('hero.ctaSecondary')}</span>
          </button>
        </div>

        {/* Metric Bar Below CTA */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6 sm:gap-12 text-center w-full max-w-4xl">
          {settings.hero_metrics.map((m) => (
            <div key={m.id}>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums break-words">{m.value}</div>
              <div className="text-[11px] sm:text-xs text-zinc-400 uppercase tracking-wider mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle Scroll Down Prompt */}
      <a
        href="#about"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-zinc-500 hover:text-white transition-colors animate-bounce flex flex-col items-center gap-1 text-[10px] uppercase font-mono-code tracking-widest"
      >
        <span>{t('hero.scroll')}</span>
        <ArrowDown className="w-3.5 h-3.5" />
      </a>
    </section>
  );
};
