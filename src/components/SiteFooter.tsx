import React from 'react';
import { useContent } from '../context/ContentContext';
import { buildContactLinks } from './ContactLinks';
import { sectionForHref, SectionId } from '../lib/sections';
import { useToneAttrs } from '../lib/tone';

interface Props { onOpenResume: () => void; hiddenSections: Set<SectionId> }

/** Responsive footer: 3 columns on desktop, stacked on mobile. Texts are editable in Sections & Layout. */
export const SiteFooter: React.FC<Props> = ({ onOpenResume, hiddenSections }) => {
  const tone = useToneAttrs('footer');
  const { settings, t } = useContent();
  const info = settings.info;
  const links = settings.nav.filter((n) => {
    if (!n.visible) return false;
    const sec = sectionForHref(n.href);
    return !(sec && hiddenSections.has(sec));
  });
  const contact = buildContactLinks(info);
  const tagline = t('footer.tagline') || info.roleTitle;

  return (
    <footer {...tone} className="px-5 sm:px-6 pt-12 pb-10 border-t border-white/10 text-xs font-mono-code text-zinc-500">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          <div className="lg:col-span-5 min-w-0 space-y-3">
            <div className="text-white font-bold text-base tracking-tight break-words">{info.personaName}</div>
            <div className="text-zinc-400 break-words">{info.realName}</div>
            {tagline && <p className="text-zinc-500 leading-relaxed max-w-sm break-words">{tagline}</p>}
          </div>

          <nav aria-label="Footer" className="lg:col-span-3 min-w-0">
            <h2 className="text-zinc-400 uppercase tracking-widest mb-4 text-[11px]">{t('footer.linksTitle')}</h2>
            <ul className="space-y-2.5">
              {links.map((n) => (
                <li key={n.id}>
                  {n.kind === 'resume' ? (
                    <button type="button" onClick={onOpenResume} className="hover:text-white transition-colors cursor-pointer text-left">{n.label}</button>
                  ) : (
                    <a href={n.href} {...(/^https?:/.test(n.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="hover:text-white transition-colors">{n.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 sm:col-span-2 lg:col-span-4">
            <h2 className="text-zinc-400 uppercase tracking-widest mb-4 text-[11px]">{t('footer.contactTitle')}</h2>
            <ul className="space-y-2.5 mb-5">
              {info.email && <li><a href={`mailto:${info.email}`} className="hover:text-white transition-colors break-all">{info.email}</a></li>}
              {info.phone && <li><a href={`tel:${info.phone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">{info.phone}</a></li>}
            </ul>
            <ul className="flex flex-wrap gap-2.5" aria-label="Social and contact links">
              {contact.map((l) => {
                const Icon = l.icon;
                return (
                  <li key={l.name}>
                    <a href={l.href} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} aria-label={l.label} title={l.label}
                      className="w-10 h-10 rounded-full border border-white/20 text-zinc-300 hover:text-white hover:border-white/60 flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
          <div className="break-words">{t('footer.arch')}</div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="#home" className="hover:text-white transition-colors">{t('footer.top')}</a>
            <button type="button" onClick={onOpenResume} className="hover:text-white transition-colors cursor-pointer">{t('footer.cv')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
