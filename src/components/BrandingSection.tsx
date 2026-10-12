import { useContent } from '../context/ContentContext';
import React from 'react';
import { ExperienceItem, FontPairOption } from '../types';
import { Zap } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface BrandingSectionProps {
  workExperience: ExperienceItem[];
  fontPair: FontPairOption;
}


const SIDE_W: Record<NonNullable<ExperienceItem['imageSize']>, string> = { sm: 'sm:w-28', md: 'sm:w-40', lg: 'sm:w-56' };
const STACK_W: Record<NonNullable<ExperienceItem['imageSize']>, string> = { sm: 'max-w-[10rem]', md: 'max-w-[16rem]', lg: 'max-w-md' };

/** One work-history entry. The picture is optional: with no image the layout is exactly the original text-only entry. */
const ExperienceBody: React.FC<{ exp: ExperienceItem; fontPair: FontPairOption }> = ({ exp, fontPair }) => {
  const image = exp.image?.trim();
  const pos = exp.imagePosition ?? 'right';
  const size = exp.imageSize ?? 'md';
  const side = pos === 'left' || pos === 'right';

  const text = (
    <div className="min-w-0 flex-1">
      {/* Role & Company */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
        <h4 className={`card-heading text-xl sm:text-2xl font-bold text-white uppercase tracking-tight break-words min-w-0 ${fontPair.headlineClass}`}>{exp.role}</h4>
        <span className="text-xs font-mono-code text-zinc-400 tabular-nums">{exp.period}</span>
      </div>
      <div className="text-sm font-semibold text-zinc-300 uppercase tracking-wider font-mono-code mb-3 break-words">
        {exp.company} <span className="text-zinc-500">· {exp.location}</span>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed mb-4 break-words">{exp.summary}</p>
      <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
        {exp.achievements.map((ach, aIdx) => (
          <li key={aIdx} className="flex items-start gap-2.5">
            <span className="text-white font-mono-code mt-0.5">•</span>
            <span>{ach}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  if (!image) return text;

  const figure = (
    <figure className={`shrink-0 w-full ${side ? SIDE_W[size] : `${STACK_W[size]}`} ${side ? 'max-w-[16rem]' : ''}`}>
      {/* Fixed frame (no layout shift); contain keeps logos whole, cover fills the frame for photos */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-card,20px)] bg-white/5 border border-white/10">
        <img
          src={image}
          alt={exp.imageAlt?.trim() || `${exp.company}${exp.role ? ` · ${exp.role}` : ''}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full ${exp.imageFit === 'cover' ? 'object-cover' : 'object-contain p-3'}`}
        />
      </div>
      {exp.imageCaption && <figcaption className="mt-2 text-[11px] font-mono-code text-zinc-500 break-words">{exp.imageCaption}</figcaption>}
    </figure>
  );

  // Mobile: always stacked. 'left'/'top' put the picture first, 'right'/'bottom' after the text.
  const first = pos === 'left' || pos === 'top';
  return (
    <div className={`flex flex-col gap-4 ${side ? 'sm:flex-row sm:gap-6 sm:items-start' : ''}`}>
      {first && figure}
      {text}
      {!first && figure}
    </div>
  );
};

export const BrandingSection: React.FC<BrandingSectionProps> = ({
  workExperience,
  fontPair,
}) => {
  const { t, settings: { clients: CLIENT_LOGOS, texts } } = useContent();
  const frameLogo = texts['branding.frameLogo']?.trim();
  return (
    <section id="branding" className="py-16 sm:py-24 px-5 sm:px-6 border-b border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <SectionHeading id="branding" eyebrow={t('branding.eyebrow')} title={t('branding.title')} subtitle={t('branding.subtitle')} fontPair={fontPair} className="mb-10 sm:mb-16" />

        {/* Brand ticker */}
        <div className="mb-14 sm:mb-20">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-6 pb-2 border-b border-white/10">
            <h3 className="text-xs sm:text-sm font-mono-code uppercase tracking-widest text-zinc-400">
              {t('branding.brandsLabel')}
            </h3>
            <span className="text-[11px] font-mono-code text-zinc-500">
              {t('branding.brandsMeta')}
            </span>
          </div>

          {/* Marquee ticker container with subtle edge fade */}
          <div className="relative w-full overflow-hidden py-4">
            <div className="flex animate-marquee gap-4 sm:gap-8 items-center whitespace-nowrap">
              {CLIENT_LOGOS.concat(CLIENT_LOGOS).map((logo, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-zinc-950/80 border border-white/15 hover:border-white transition-all group shrink-0"
                >
                  {logo.logo?.trim() ? (
                    /* Optional logo image: fixed 32px frame so the ticker never shifts while images load */
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${logo.logoBg === 'dark' ? 'bg-black border border-white/30' : logo.logoBg === 'none' ? '' : 'bg-white'}`}>
                      <img src={logo.logo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
                        className={`w-full h-full object-contain ${logo.logoBg === 'none' ? '' : 'p-1'}`} />
                    </div>
                  ) : (
                    /* Minimalist white monogram badge */
                    <div className="w-8 h-8 rounded-lg bg-black border border-white/30 flex items-center justify-center text-xs font-mono-code font-bold text-white group-hover:bg-white group-hover:text-black transition-colors">
                      {logo.symbol}
                    </div>
                  )}
                  <span className="text-sm font-bold tracking-widest text-white/90 group-hover:text-white uppercase font-mono-code">
                    {logo.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Gradient shadow edge overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-black to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-black to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Main Grid: CYBERFIX Pulse Frame on Left + WORK HISTORY Timeline on Right */}
        <div id="experience" className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* LEFT: Central large rounded-square frame labeled "CYBERFIX" with subtle continuous animated white glow or pulse */}
          <div className="lg:col-span-5 min-w-0 flex flex-col items-center">
            <div className="w-full max-w-md p-6 sm:p-10 rounded-[28px] bg-zinc-950 border-2 border-white/30 animate-pulse-glow flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* Corner tech crosshairs */}
              <div className="absolute top-4 left-4 text-[10px] font-mono-code text-zinc-500">+</div>
              <div className="absolute top-4 right-4 text-[10px] font-mono-code text-zinc-500">+</div>
              <div className="absolute bottom-4 left-4 text-[10px] font-mono-code text-zinc-500">+</div>
              <div className="absolute bottom-4 right-4 text-[10px] font-mono-code text-zinc-500">+</div>

              {/* Glowing center emblem */}
              <div className="w-24 h-24 rounded-2xl bg-black border-2 border-white flex items-center justify-center mb-6 shadow-[0_0_30px_rgb(var(--fg-rgb)/0.2)] overflow-hidden">
                {frameLogo ? (
                  <img src={frameLogo} alt={t('branding.frameTitle')} decoding="async" referrerPolicy="no-referrer" className="w-full h-full object-contain p-3" />
                ) : (
                  <Zap className="w-12 h-12 text-white" />
                )}
              </div>

              {/* Large prominent text: CYBERFIX */}
              <h3 className={`card-heading text-4xl sm:text-5xl font-black text-white tracking-widest uppercase mb-2 break-words max-w-full ${fontPair.headlineClass}`}>
                {t('branding.frameTitle')}
              </h3>
              <div className="text-xs font-mono-code text-zinc-400 uppercase tracking-widest mb-6">
                {t('branding.frameKicker')}
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xs mb-6">
                {t('branding.frameBody')}
              </p>

              {/* Live metrics inside the Cyberfix frame */}
              <div className="w-full pt-4 border-t border-white/15 grid grid-cols-2 gap-3 text-left">
                <div className="min-w-0 p-3 bg-black rounded-xl border border-white/10">
                  <div className="text-[10px] font-mono-code text-zinc-500 uppercase">{t('branding.frameStat1Label')}</div>
                  <div className="text-base sm:text-lg font-bold text-white break-words">{t('branding.frameStat1Value')}</div>
                </div>
                <div className="min-w-0 p-3 bg-black rounded-xl border border-white/10">
                  <div className="text-[10px] font-mono-code text-zinc-500 uppercase">{t('branding.frameStat2Label')}</div>
                  <div className="text-base sm:text-lg font-bold text-white break-words">{t('branding.frameStat2Value')}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider">
                Continuous white glow pulse · verified ecosystem
              </span>
            </div>
          </div>

          {/* RIGHT: Work Experience Vertical Timeline */}
          <div className="lg:col-span-7 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-8 pb-3 border-b border-white/10">
              <h3 className="text-xs font-mono-code uppercase tracking-widest text-zinc-400">
                {t('branding.historyLabel')}
              </h3>
              <span className="text-xs font-mono-code text-zinc-500">
                {t('branding.historyMeta')}
              </span>
            </div>

            <div className="relative ml-2 pl-6 sm:pl-8 border-l border-white/20 space-y-10 sm:space-y-12">
              {workExperience.map((exp) => (
                <div key={exp.id} className="relative group">
                  {/* Small white circle icon marking each timeline point */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full bg-black border-2 border-white group-hover:scale-125 group-hover:bg-white transition-all shadow-[0_0_10px_rgb(var(--fg-rgb)/0.4)]" />
                  <ExperienceBody exp={exp} fontPair={fontPair} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
