import { useContent } from '../context/ContentContext';
import React from 'react';
import { PortfolioInfo, FontPairOption } from '../types';
import { Download, Award, GraduationCap, MapPin, Mail, Phone, ArrowRight } from 'lucide-react';
import profileBwImg from '../assets/images/profile_editorial_portrait_1791718263477.jpg';
import { SectionHeading } from './SectionHeading';
import { useToneAttrs } from '../lib/tone';

interface AboutSectionProps {
  info: PortfolioInfo;
  fontPair: FontPairOption;
  onOpenResume: () => void;
}

// Natural size of the bundled portrait, so the page reserves the right space before it loads (no layout shift).
const BUNDLED = { width: 896, height: 1200 };

export const AboutSection: React.FC<AboutSectionProps> = ({ info, fontPair, onOpenResume }) => {
  const tone = useToneAttrs('about');
  const { t, settings: { images, layout } } = useContent();

  const uploaded = !!images.profile;
  const src = images.profile || profileBwImg;
  const dims = uploaded ? { width: images.profileWidth, height: images.profileHeight } : BUNDLED;
  const hasDims = !!dims.width && !!dims.height;
  // Soft shadow only when it helps: never behind a transparent cut-out. Always a plain rectangle: no border, no arch, no crop.
  const display = images.profileDisplay ?? 'auto';
  const shadow = display === 'framed' || (display === 'auto' && !(uploaded && images.profileTransparent));
  const alt = `${info.realName} profile portrait`;
  const skillsVisible = layout.some((s) => s.id === 'skills' && s.visible);
  const hasEducation = info.education.length > 0;
  const hasCerts = info.certifications.length > 0;

  return (
    <section id="about" {...tone} className="py-16 sm:py-24 px-5 sm:px-6 border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Portrait */}
        <div className="lg:col-span-5 min-w-0 lg:sticky lg:top-24">
          <figure className="w-full max-w-sm sm:max-w-md mx-auto lg:max-w-none">
            <div className={`overflow-hidden rounded-[var(--radius-card,20px)] ${shadow ? 'shadow-[0_28px_60px_-24px_rgba(0,0,0,0.65)]' : ''}`}>
              <img
                src={src}
                alt={alt}
                width={hasDims ? dims.width : undefined}
                height={hasDims ? dims.height : undefined}
                style={hasDims ? { aspectRatio: `${dims.width} / ${dims.height}` } : undefined}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                // The bundled editorial portrait keeps its B&W treatment; an uploaded image is shown exactly as uploaded.
                className={`block w-full h-auto ${uploaded ? '' : 'grayscale contrast-125'}`}
              />
            </div>
            <figcaption className="mt-5 text-center lg:text-left">
              <div className="text-xs font-bold text-white uppercase tracking-wider">{info.realName}</div>
              <div className="text-[11px] text-zinc-400 font-mono-code mt-1 flex items-center justify-center lg:justify-start gap-1.5">
                <MapPin className="w-3 h-3 text-white shrink-0" aria-hidden="true" />
                <span>{t('about.relocationTag')}</span>
              </div>
            </figcaption>
          </figure>
        </div>

        {/* Details */}
        <div className="lg:col-span-7 min-w-0 flex flex-col">
          <SectionHeading id="about" eyebrow={t('about.eyebrow')} title={t('about.title')} subtitle={t('about.subtitle')} fontPair={fontPair} className="mb-6 sm:mb-8" />

          <p className="tx-body text-zinc-300 text-base sm:text-lg leading-relaxed lg:leading-8 mb-8 break-words whitespace-pre-line max-w-3xl">{info.aboutBio}</p>

          {(hasEducation || hasCerts) && (
            <div className={`grid grid-cols-1 ${hasEducation && hasCerts ? 'md:grid-cols-2' : ''} gap-6 mb-8 p-5 sm:p-6 bg-zinc-950 rounded-[var(--radius-card,20px)] border border-white/10`}>
              {hasEducation && (
                <div className="flex gap-3 min-w-0">
                  <GraduationCap className="w-5 h-5 text-white shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0 space-y-3">
                    <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">{t('about.educationLabel')}</h3>
                    {info.education.map((e, i) => (
                      <div key={i}>
                        <div className="text-sm font-semibold text-white break-words">{e.degree}</div>
                        <div className="text-xs text-zinc-400 break-words">{e.institution}{e.year ? ` (${e.year})` : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hasCerts && (
                <div className="flex gap-3 min-w-0">
                  <Award className="w-5 h-5 text-white shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0 space-y-3">
                    <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">{t('about.certLabel')}</h3>
                    {info.certifications.map((c, i) => (
                      <div key={i} className="text-xs text-zinc-300 leading-relaxed break-words">{c}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-6 gap-y-4">
            <button
              onClick={onOpenResume}
              className="w-full sm:w-auto justify-center px-8 py-4 text-sm font-bold uppercase tracking-wider text-black bg-white rounded-[var(--radius-card,20px)] hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center gap-3 cursor-pointer"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>{t('about.cvButton')}</span>
            </button>
            {skillsVisible && (
              <a href="#skills" className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:underline underline-offset-4">
                {t('skills.title')} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono-code text-zinc-400">
            <a href={`mailto:${info.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors min-w-0">
              <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /><span className="break-all">{info.email}</span>
            </a>
            <a href={`tel:${info.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /><span>{info.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
