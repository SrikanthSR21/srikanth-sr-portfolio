import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { FontPairOption } from '../types';
import { useContent } from '../context/ContentContext';
import { sectionForHref, SectionId } from '../lib/sections';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentFontPair: FontPairOption;
  onOpenResume: () => void;
  personaName: string;
  /** Sections currently hidden from the page: their nav links are hidden too, so nothing points at nothing. */
  hiddenSections: Set<SectionId>;
}

export const Navbar: React.FC<NavbarProps> = ({ currentFontPair, onOpenResume, personaName, hiddenSections }) => {
  const { settings } = useContent();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const items = settings.nav.filter((n) => {
    if (!n.visible) return false;
    const sec = sectionForHref(n.href);
    return !(sec && hiddenSections.has(sec));
  });

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Escape closes, outside click closes, desktop width closes. All listeners are cleaned up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) close();
    };
    const mql = matchMedia('(min-width: 1280px)');
    const onMq = () => { if (mql.matches) close(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    mql.addEventListener('change', onMq);
    panelRef.current?.querySelector<HTMLElement>('a,button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
      mql.removeEventListener('change', onMq);
    };
  }, [open, close]);

  const linkProps = (href: string) => (/^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {});

  // In-page links scroll smoothly (instant when the visitor prefers reduced motion). If the target does not exist the browser's default applies.
  const onAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#') || href.length < 2) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', href);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-black/80 border-b border-white/10 transition-colors"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand */}
        <a
          href="#home"
          className={`min-w-0 truncate text-lg md:text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity ${currentFontPair.headlineClass}`}
        >
          {personaName}
        </a>

        {/* Desktop navigation (unchanged: managed from /admin) */}
        <nav aria-label="Primary" className="hidden xl:flex items-center gap-6 2xl:gap-7 text-xs tracking-wider uppercase text-zinc-400 font-medium">
          {items.map((n) =>
            n.kind === 'resume' ? (
              <button key={n.id} onClick={onOpenResume}
                className="text-zinc-300 hover:text-white underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer">
                {n.label}
              </button>
            ) : (
              <a key={n.id} href={n.href} {...linkProps(n.href)} onClick={(e) => onAnchor(e, n.href)} className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                {n.label}
              </a>
            )
          )}
          <ThemeToggle />
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex xl:hidden items-center gap-2 shrink-0">
          <ThemeToggle />
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/20 text-white hover:border-white/50 transition-colors cursor-pointer"
          >
            {open ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile panel: absolutely positioned under the header (inside its stacking context), scrolls if taller than the screen */}
      {open && (
        <div
          id={menuId}
          ref={panelRef}
          role="region"
          aria-label="Mobile navigation"
          className="xl:hidden absolute top-full inset-x-0 bg-black border-b border-white/15 shadow-2xl overflow-y-auto motion-safe:animate-[fadeIn_.18s_ease-out]"
          style={{ maxHeight: 'calc(100dvh - 4.5rem - env(safe-area-inset-top, 0px))' }}
        >
          <nav aria-label="Primary mobile" className="max-w-7xl mx-auto px-5 sm:px-6 py-3 flex flex-col">
            {items.map((n) => {
              const cls = 'w-full text-left py-3.5 border-b border-white/10 last:border-b-0 text-sm font-semibold uppercase tracking-wider text-zinc-200 hover:text-white cursor-pointer';
              return n.kind === 'resume' ? (
                <button key={n.id} type="button" className={`${cls} underline underline-offset-4`}
                  onClick={() => { close(); onOpenResume(); }}>
                  {n.label}
                </button>
              ) : (
                <a key={n.id} href={n.href} {...linkProps(n.href)} className={cls} onClick={(e) => { onAnchor(e, n.href); close(); }}>
                  {n.label}
                </a>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
