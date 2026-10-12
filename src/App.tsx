import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { FONT_PAIRS } from './data/portfolioData';
import { useContent } from './context/ContentContext';
import { useColorMode } from './lib/colorMode';
import { useMediaQuery } from './lib/hooks';
import { SectionId } from './lib/sections';
import { applyTypography } from './lib/typography';

import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { SkillsSection } from './components/SkillsSection';
import { ProjectPortfolio } from './components/ProjectPortfolio';
import { AdvertisingPortfolio } from './components/AdvertisingPortfolio';
import { BrandingSection } from './components/BrandingSection';
import { ContactSection } from './components/ContactSection';
import { SiteFooter } from './components/SiteFooter';
import { FloatingContactButtons } from './components/FloatingContactButtons';
import { buildContactLinks } from './components/ContactLinks';
import { ResumeModal } from './components/ResumeModal';

export default function App() {
  // Everything below is driven by the database (managed at /admin).
  const { settings, collections, hydrated, backendConnected } = useContent();
  const themeSettings = settings.theme;
  const currentFontPair = FONT_PAIRS.find((f) => f.id === themeSettings.fontPairId) || FONT_PAIRS[0];
  const portfolioInfo = settings.info;

  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // The visitor's own choice wins; otherwise the admin-configured default (dark unless changed).
  const { mode } = useColorMode(themeSettings.defaultMode);

  // If a CV file was uploaded in /admin, open it; otherwise show the built-in printable CV.
  const openResume = () => {
    if (portfolioInfo.resumeUrl) window.open(portfolioInfo.resumeUrl, '_blank', 'noopener,noreferrer');
    else setResumeModalOpen(true);
  };

  // First-visit guard: with a backend configured and no saved copy of the content yet, show a neutral splash instead of
  // built-in placeholder content. After 2.5 s on a very slow connection the page appears anyway (built-in defaults carry the
  // correct identity), so visitors never wait on a blank screen.
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    if (hydrated) return;
    const id = window.setTimeout(() => setGaveUp(true), 2500);
    return () => window.clearTimeout(id);
  }, [hydrated]);
  const showSplash = backendConnected && !hydrated && !gaveUp;

  // Typography / highlight settings → data-attributes + CSS variables on <html> (rules live in index.css). Layout effect = no unstyled flash.
  useLayoutEffect(() => { applyTypography(document.documentElement, settings.typography); }, [settings.typography]);

  // data-theme drives the light palette (see index.css)
  useEffect(() => { document.documentElement.setAttribute('data-theme', mode); }, [mode]);

  // Dark mode = the admin-configured appearance (background / text / accent). Light mode uses the built-in
  // light palette, so the admin's inline overrides are removed while it is active.
  useEffect(() => {
    const root = document.documentElement;
    const props = ['--bg-color', '--text-color', '--accent-btn'];
    if (mode === 'light') { props.forEach((p) => root.style.removeProperty(p)); return; }
    let bg = '#000000';
    if (themeSettings.backgroundMode === 'midnight-black') bg = '#0a0b0e';
    else if (themeSettings.backgroundMode === 'custom') bg = themeSettings.customBg || '#000000';
    root.style.setProperty('--bg-color', bg);
    root.style.setProperty('--text-color', themeSettings.customText || '#ffffff');
    root.style.setProperty('--accent-btn', themeSettings.customAccent || '#ffffff');
  }, [themeSettings, mode]);

  const layout = settings.layout;
  const hiddenSections = useMemo(() => new Set<SectionId>(layout.filter((s) => !s.visible).map((s) => s.id)), [layout]);
  const heroVisible = !hiddenSections.has('hero');
  const contactLinks = useMemo(() => buildContactLinks(portfolioInfo), [portfolioInfo]);

  // Section registry → component. Order and visibility come from settings.layout; unknown ids can never render.
  const renderers: Record<SectionId, () => React.ReactNode> = {
    hero: () => (
      <HeroSection
        headline={portfolioInfo.personaName}
        subheadline={portfolioInfo.roleTitle}
        fontPair={currentFontPair}
        initialMode={themeSettings.heroAnimation}
        onOpenResume={openResume}
        realName={portfolioInfo.realName}
        mobileContactLinks={isDesktop ? undefined : contactLinks}
      />
    ),
    about: () => <AboutSection info={portfolioInfo} fontPair={currentFontPair} onOpenResume={openResume} />,
    skills: () => <SkillsSection fontPair={currentFontPair} />,
    projects: () => <ProjectPortfolio projects={collections.projects} fontPair={currentFontPair} />,
    advertising: () => <AdvertisingPortfolio campaigns={collections.ad_campaigns} fontPair={currentFontPair} />,
    branding: () => <BrandingSection workExperience={collections.experience} fontPair={currentFontPair} />,
    contact: () => (
      <ContactSection
        fontPair={currentFontPair}
        whatsappNumber={portfolioInfo.whatsapp}
        email={portfolioInfo.email}
        phone={portfolioInfo.phone}
        location={portfolioInfo.location}
      />
    ),
    footer: () => <SiteFooter onOpenResume={openResume} hiddenSections={hiddenSections} />,
  };

  const footerIndex = layout.filter((s) => s.visible).findIndex((s) => s.id === 'footer');
  const orderedVisible = layout.filter((s) => s.visible);
  const beforeFooter = (footerIndex < 0 ? orderedVisible : orderedVisible.slice(0, footerIndex)).filter((s) => s.id !== 'footer');
  const afterFooter = footerIndex < 0 ? [] : orderedVisible.slice(footerIndex + 1);

  // Mobile only: when the hero (which hosts the mobile contact row) is hidden, fall back to a safe-area-aware bar.
  const showMobileBar = !isDesktop && !heroVisible;

  if (showSplash) {
    return (
      <div role="status" aria-busy="true" className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <span className="sr-only">Loading</span>
        <span aria-hidden="true" className="block h-px w-16 bg-white/40 motion-safe:animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${currentFontPair.bodyClass}`}
      style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', paddingBottom: showMobileBar ? 'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)' : undefined }}
    >
      <Navbar currentFontPair={currentFontPair} onOpenResume={openResume} personaName={portfolioInfo.personaName} hiddenSections={hiddenSections} />

      {/* Sections render in the saved order. Everything before the footer is <main>; the footer keeps its own landmark. */}
      <main>
        {beforeFooter.map((s) => <React.Fragment key={s.id}>{renderers[s.id]()}</React.Fragment>)}
      </main>
      {footerIndex >= 0 && renderers.footer()}
      {afterFooter.map((s) => <React.Fragment key={s.id}>{renderers[s.id]()}</React.Fragment>)}

      {/* Exactly one contact-button layout is mounted at a time (never both) */}
      {isDesktop && <FloatingContactButtons links={contactLinks} layout="vertical" />}
      {showMobileBar && <FloatingContactButtons links={contactLinks} layout="bar" />}

      <ResumeModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        info={portfolioInfo}
        workExperience={collections.experience}
      />
    </div>
  );
}
