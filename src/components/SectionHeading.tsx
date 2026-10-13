import React from 'react';
import type { FontPairOption } from '../types';
import { useContent } from '../context/ContentContext';
import { SectionId } from '../lib/sections';
import { headingAttrs, TypographySettings } from '../lib/typography';

/** "Selected ==words==" → <mark class="hl">words</mark>. Styled only when highlights are enabled for the section (index.css). */
export const RichText: React.FC<{ text: string }> = ({ text }) => {
  if (!text.includes('==')) return <>{text}</>;
  const parts = text.split(/==(.+?)==/g);
  return <>{parts.map((p, i) => (i % 2 === 1 ? <mark key={i} className="hl">{p}</mark> : <React.Fragment key={i}>{p}</React.Fragment>))}</>;
};

interface Props {
  id: SectionId;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  fontPair: FontPairOption;
  /** Where the subtitle goes: under the title (default) or to the right on wide screens (Projects). */
  subtitlePlacement?: 'below' | 'side';
  /** Larger title, centred (Contact) */
  variant?: 'default' | 'hero';
  /** Right-hand slot, e.g. filter chips */
  aside?: React.ReactNode;
  className?: string;
  /** Used by the admin live preview; the public site reads the saved settings */
  typographyOverride?: TypographySettings;
}

export const SectionHeading: React.FC<Props> = ({ id, eyebrow, title, subtitle, fontPair, subtitlePlacement = 'below', variant = 'default', aside, className = '', typographyOverride }) => {
  const { settings } = useContent();
  const a = headingAttrs(typographyOverride ?? settings.typography, id);
  const size = variant === 'hero' ? 'text-3xl sm:text-5xl md:text-6xl' : 'text-3xl sm:text-4xl md:text-5xl';
  const centered = variant === 'hero';

  const heading = (
    <h2
      className={`sec-heading ${size} font-black text-white uppercase tracking-tight break-words ${fontPair.headlineClass}`}
      data-hc={a.color} data-hu={a.underline ? 'on' : 'off'}
    >
      <RichText text={title} />
    </h2>
  );
  const sub = subtitle ? (
    <p className={subtitlePlacement === 'side'
      ? 'tx-secSub text-xs font-mono-code text-zinc-400 max-w-xs sm:text-right'
      : `tx-secSub text-sm font-mono-code text-zinc-400 max-w-2xl ${centered ? 'mx-auto' : ''}`}>
      <RichText text={subtitle} />
    </p>
  ) : null;

  return (
    <div className={`sec-head ${className}`} data-hl={a.highlight ? 'on' : 'off'}>
      <div className={`flex flex-col ${aside || (sub && subtitlePlacement === 'side') ? 'sm:flex-row sm:items-end justify-between gap-4 sm:gap-6' : ''}`}>
        <div className={`min-w-0 ${centered ? 'text-center w-full' : ''}`}>
          {eyebrow && <div className="tx-eyebrow text-xs font-mono-code uppercase tracking-widest text-zinc-400 mb-2">{eyebrow}</div>}
          <div className={centered ? 'flex justify-center' : ''}>{heading}</div>
          {sub && subtitlePlacement === 'below' && <div className="mt-3">{sub}</div>}
        </div>
        {subtitlePlacement === 'side' && sub}
        {aside}
      </div>
    </div>
  );
};
