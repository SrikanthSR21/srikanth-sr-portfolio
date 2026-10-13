import { useContent } from '../context/ContentContext';
import type { SectionId } from './sections';

/** data-attributes for a section's background band (Admin → Typography & Highlights → Section backgrounds).
 *  Spread onto the section element: <section {...useToneAttrs('about')} …>. No band = no attributes = original look.
 *  A 'custom' band also carries its section id; its colours are written as CSS by customBandsCss() in typography.ts. */
export function useToneAttrs(id: SectionId): Record<string, string> {
  const { settings } = useContent();
  const t = settings.typography;
  const tone = t.sectionTone[id] ?? 'none';
  if (tone === 'none') return {};
  if (tone === 'custom') return t.sectionCustom[id] ? { 'data-tone': 'custom', 'data-tone-id': id, 'data-tone-style': t.toneStyle } : {};
  return { 'data-tone': tone, 'data-tone-style': t.toneStyle };
}
