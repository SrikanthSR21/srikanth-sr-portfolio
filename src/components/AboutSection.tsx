import { useContent } from '../context/ContentContext';
import React from 'react';
import { PortfolioInfo, FontPairOption } from '../types';
import { Download, CheckCircle2, Award, GraduationCap, MapPin, Mail, Phone } from 'lucide-react';
import profileBwImg from '../assets/images/profile_editorial_portrait_1791718263477.jpg';

interface AboutSectionProps {
  info: PortfolioInfo;
  fontPair: FontPairOption;
  onOpenResume: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ info, fontPair, onOpenResume }) => {
  const { t, settings: { images } } = useContent();

  const uploaded = !!images.profile;
  const src = images.profile || profileBwImg;
  // auto: transparent uploads are shown as a free cut-out (no fill, no crop); everything else keeps the arch frame.
  const display = images.profileDisplay ?? 'auto';
  const cutout = uploaded && (display === 'cutout' || (display === 'auto' && !!images.profileTransparent));
  const alt = `${info.realName} profile portrait`;
  const subtitle = t('about.subtitle');

  return (
    <section id="about" className="py-16 sm:py-24 px-5 sm:px-6 border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left column: portrait */}
          <div className="lg:col-span-5 min-w-0 flex flex-col items-center">
            {cutout ? (
              /* Transparent / cut-out portrait: nothing is painted behind it and it is never cropped or stretched. */
              <figure className="w-full max-w-sm sm:max-w-md lg:max-w-none flex flex-col items-center">
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                  className="block w-auto max-w-full h-auto max-h-[70svh] lg:max-h-[80vh] object-contain"
                />
                <figcaption className="mt-4 text-center">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">{info.realName}</div>
                  <div className="text-[11px] text-zinc-400 font-mono-code mt-0.5 flex items-center justify-center gap-1.5">
                    <MapPin className="w-3 h-3 text-white shrink-0" aria-hidden="true" />
                    <span>{t('about.relocationTag')}</span>
                  </div>
                </figcaption>
              </figure>
            ) : (
              <div className="relative group w-full max-w-sm">
                {/* Outer decorative halo border */}
                <div className="absolute -inset-2 rounded-t-[140px] rounded-b-[24px] border border-white/20 group-hover:border-white/50 transition-colors pointer-events-none" />

                {/* Arch container */}
                <div className="relative overflow-hidden rounded-t-[130px] rounded-b-[20px] bg-zinc-900 border border-white/20 shadow-2xl aspect-[3/4]">
                  <img
                    src={src}
                    alt={alt}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    // The bundled editorial portrait keeps its B&W treatment; an image you upload is shown exactly as uploaded.
                    className={`w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out ${uploaded ? '' : 'grayscale contrast-125'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/70 backdrop-blur-md rounded-xl border border-white/15">
                    <div className="text-xs font-bold text-white uppercase tracking-wider truncate">{info.realName}</div>
                    <div className="text-[11px] text-zinc-400 font-mono-code mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-white shrink-0" aria-hidden="true" />
                      <span className="truncate">{t('about.relocationTag')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick contact credentials */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-mono-code text-zinc-400 max-w-full">
              <a href={`mailto:${info.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors min-w-0">
                <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="break-all">{info.email}</span>
              </a>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <a href={`tel:${info.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{info.phone}</span>
              </a>
            </div>
          </div>

          {/* Right column: details */}
          <div className="lg:col-span-7 min-w-0 flex flex-col justify-center">
            <div className="text-xs font-mono-code uppercase tracking-widest text-zinc-400 mb-2">{t('about.eyebrow')}</div>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight break-words ${fontPair.headlineClass}`}>
              {t('about.title')}
            </h2>
            {subtitle && <p className="text-sm font-mono-code text-zinc-400 mb-5">{subtitle}</p>}

            <p className="text-zinc-300 text-base sm:text-lg leading-relaxed mb-8 break-words">{info.aboutBio}</p>

            {/* Education & certifications come from the admin (Hero, Contact & Social) */}
            {(info.education.length > 0 || info.certifications.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 p-5 bg-zinc-950 rounded-[20px] border border-white/10">
                {info.education.length > 0 && (
                  <div className="flex gap-3 min-w-0">
                    <GraduationCap className="w-5 h-5 text-white shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0 space-y-3">
                      <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">{t('about.educationLabel')}</div>
                      {info.education.map((e, i) => (
                        <div key={i}>
                          <div className="text-sm font-semibold text-white break-words">{e.degree}</div>
                          <div className="text-xs text-zinc-400 break-words">{e.institution}{e.year ? ` (${e.year})` : ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {info.certifications.length > 0 && (
                  <div className="flex gap-3 min-w-0">
                    <Award className="w-5 h-5 text-white shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0 space-y-3">
                      <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">{t('about.certLabel')}</div>
                      {info.certifications.map((c, i) => (
                        <div key={i} className="text-xs text-zinc-300 leading-relaxed break-words">{c}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs font-mono-code uppercase tracking-widest text-zinc-400 mb-3">{t('about.skillsLabel')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {info.skills.map((skillGroup, idx) => (
                <div key={idx} className="min-w-0 p-4 bg-zinc-950/60 rounded-[16px] border border-white/10 hover:border-white/25 transition-colors">
                  <div className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 pb-1 border-b border-white/10">{skillGroup.category}</div>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {skillGroup.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white/80 shrink-0 mt-px" aria-hidden="true" />
                        <span className="break-words min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <button
                onClick={onOpenResume}
                className="w-full sm:w-auto justify-center px-8 py-4 text-sm font-bold uppercase tracking-wider text-black bg-white rounded-[20px] hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center gap-3 cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{t('about.cvButton')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
