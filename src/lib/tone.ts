import { useContent } from '../context/ContentContext';
import type { SectionId } from './sections';

/** data-attributes for a section's background band (Admin → Typography & Highlights → Section backgrounds).
 *  Spread onto the section element: <section {...useToneAttrs('about')} …>. No band = no attributes = original look. */
export function useToneAttrs(id: SectionId): Record<string, string> {
  const { settings } = useContent();
  const tone = settings.typography.sectionTone[id] ?? 'none';
  return tone === 'none' ? {} : { 'data-tone': tone, 'data-tone-style': settings.typography.toneStyle };
}
