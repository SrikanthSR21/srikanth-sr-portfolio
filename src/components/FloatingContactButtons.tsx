import React from 'react';
import type { ContactLink } from './ContactLinks';

interface Props {
  links: ContactLink[];
  /** 'vertical' = the original desktop stack (bottom-right). 'bar' = mobile fallback when the hero (which hosts the mobile row) is hidden. */
  layout?: 'vertical' | 'bar';
}

/** Desktop: unchanged vertical pill bottom-right. Rendered only when it should be visible (see App), never duplicated. */
export const FloatingContactButtons: React.FC<Props> = ({ links, layout = 'vertical' }) => {
  if (!links.length) return null;

  if (layout === 'bar') {
    return (
      <aside
        aria-label="Quick contact links"
        className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-2xl">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.name} href={item.href} {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                aria-label={item.label} title={item.label}
                className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform">
                <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
              </a>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Quick contact links" className="fixed bottom-6 right-6 z-30 flex flex-col items-center gap-2.5">
      <div className="flex flex-col items-center gap-2 p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-2xl">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group relative w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 hover:bg-zinc-200 transition-all duration-200 shadow-md"
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="w-4 h-4 transition-transform group-hover:rotate-6" aria-hidden="true" />
              <span className="absolute right-12 px-2.5 py-1 text-[11px] font-mono-code whitespace-nowrap bg-zinc-950 text-white rounded-lg border border-white/20 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none shadow-xl">
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </aside>
  );
};
