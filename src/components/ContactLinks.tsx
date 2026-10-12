import React from 'react';
import { Instagram, Linkedin, Mail, MessageSquare, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PortfolioInfo } from '../types';

export interface ContactLink { name: string; label: string; href: string; icon: LucideIcon; external: boolean }

const abs = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

/** One definition of the quick-contact links, shared by the desktop floating bar, the mobile hero row and the footer. */
export function buildContactLinks(info: Pick<PortfolioInfo, 'whatsapp' | 'email' | 'phone' | 'linkedin' | 'instagram'>): ContactLink[] {
  const wa = (info.whatsapp || '').replace(/[^0-9]/g, '');
  const links: (ContactLink | null)[] = [
    wa ? { name: 'WhatsApp', label: 'WhatsApp Chat', icon: MessageSquare, external: true,
      href: `https://wa.me/${wa}?text=${encodeURIComponent('Hi, I would like to discuss a project with you.')}` } : null,
    { name: 'Instagram', label: 'Instagram', icon: Instagram, external: true, href: abs(info.instagram || 'instagram.com') },
    info.linkedin ? { name: 'LinkedIn', label: 'LinkedIn Profile', icon: Linkedin, external: true, href: abs(info.linkedin) } : null,
    info.email ? { name: 'Mail', label: 'Direct Email', icon: Mail, external: false, href: `mailto:${info.email}` } : null,
    info.phone ? { name: 'Call', label: 'Direct Call', icon: Phone, external: false, href: `tel:${info.phone.replace(/\s+/g, '')}` } : null,
  ];
  return links.filter((l): l is ContactLink => !!l);
}

/** Mobile layout: a horizontal row that sits inside the hero, under the heading. Every target is ≥ 44px. */
export const HeroContactRow: React.FC<{ links: ContactLink[] }> = ({ links }) => (
  <nav aria-label="Quick contact links" className="mb-8 flex flex-wrap items-center justify-center gap-2.5">
    {links.map((l) => {
      const Icon = l.icon;
      return (
        <a
          key={l.name}
          href={l.href}
          {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          aria-label={l.label}
          title={l.label}
          className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
        </a>
      );
    })}
  </nav>
);
