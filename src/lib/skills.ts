// Skills data model. The legacy `info.skills` ({category, items[]}) is the fallback source, so nothing is
// duplicated or lost: until the admin saves from Admin → Skills, the public site shows exactly what was there before.

export type SkillsLayout = 'cards' | 'tags' | 'bars';

export interface SkillCategory { id: string; name: string; description?: string; icon?: string; visible?: boolean }
export interface SkillItem {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  /** Curated icon key (see skillIcons), an emoji / short text, or an https image URL. Empty = category icon. */
  icon?: string;
  /** Optional proficiency 0-100. Missing = no indicator. */
  level?: number;
  /** false = hidden on the public site (kept in the admin). Missing = visible. */
  visible?: boolean;
}
export interface SkillsConfig {
  layout: SkillsLayout;
  /** Show proficiency bars where a skill has a level */
  showLevels: boolean;
  categories: SkillCategory[];
  items: SkillItem[];
}

export const SUGGESTED_CATEGORIES = [
  'Digital Marketing', 'SEO', 'Advertising', 'Graphic Design', 'Logo Design', 'Web Development', 'Tools',
];

export const skillUid = (p = 'sk') => `${p}-${Math.random().toString(36).slice(2, 9)}`;

const DERIVED_ICONS = ['Megaphone', 'Search', 'Palette', 'Code', 'Wrench', 'Target'];

export function deriveSkillsFromInfo(groups: { category: string; items: string[] }[] | undefined): SkillsConfig {
  const categories: SkillCategory[] = [];
  const items: SkillItem[] = [];
  (groups ?? []).forEach((g, gi) => {
    const id = `cat-${gi + 1}`;
    categories.push({ id, name: String(g.category ?? '').trim() || `Category ${gi + 1}`, icon: DERIVED_ICONS[gi % DERIVED_ICONS.length], visible: true });
    (g.items ?? []).forEach((name, i) => {
      if (String(name).trim()) items.push({ id: `${id}-s${i + 1}`, name: String(name).trim(), categoryId: id, visible: true });
    });
  });
  return { layout: 'cards', showLevels: true, categories, items };
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Accepts anything read from the database and returns a safe, complete config. */
export function normalizeSkills(raw: unknown, legacy?: { category: string; items: string[] }[]): SkillsConfig {
  const r = raw as Partial<SkillsConfig> | null | undefined;
  if (!r || typeof r !== 'object' || !Array.isArray(r.categories) || !Array.isArray(r.items)) return deriveSkillsFromInfo(legacy);

  const seenCat = new Set<string>();
  const categories: SkillCategory[] = [];
  for (const c of r.categories) {
    const id = str((c as any)?.id, 60);
    if (!id || seenCat.has(id)) continue;
    seenCat.add(id);
    categories.push({
      id, name: str((c as any).name, 80) || 'Untitled', description: str((c as any).description, 200) || undefined,
      icon: str((c as any).icon, 300) || undefined, visible: (c as any).visible !== false,
    });
  }
  const seenItem = new Set<string>();
  const items: SkillItem[] = [];
  for (const s of r.items) {
    const id = str((s as any)?.id, 60);
    const name = str((s as any)?.name, 100);
    if (!id || !name || seenItem.has(id)) continue;
    seenItem.add(id);
    let categoryId = str((s as any).categoryId, 60);
    if (!seenCat.has(categoryId)) {
      // Orphaned skill: park it in a catch-all instead of dropping it.
      categoryId = 'cat-uncategorised';
      if (!seenCat.has(categoryId)) { seenCat.add(categoryId); categories.push({ id: categoryId, name: 'Other', visible: true }); }
    }
    const lv = Number((s as any).level);
    items.push({
      id, name, categoryId, description: str((s as any).description, 300) || undefined, icon: str((s as any).icon, 300) || undefined,
      level: Number.isFinite(lv) && (s as any).level !== '' && (s as any).level != null ? Math.max(0, Math.min(100, Math.round(lv))) : undefined,
      visible: (s as any).visible !== false,
    });
  }
  const layout: SkillsLayout = r.layout === 'tags' || r.layout === 'bars' ? r.layout : 'cards';
  return { layout, showLevels: r.showLevels !== false, categories, items };
}

export interface SkillGroup { category: SkillCategory; items: SkillItem[] }

/** Public view: visible categories that still have at least one visible skill, in saved order. */
export function visibleSkillGroups(cfg: SkillsConfig): SkillGroup[] {
  return cfg.categories
    .filter((c) => c.visible !== false)
    .map((category) => ({ category, items: cfg.items.filter((i) => i.categoryId === category.id && i.visible !== false) }))
    .filter((g) => g.items.length > 0);
}

/** For the printable CV, which still expects {category, items[]}. */
export function skillsToLegacy(cfg: SkillsConfig): { category: string; items: string[] }[] {
  return visibleSkillGroups(cfg).map((g) => ({ category: g.category.name, items: g.items.map((i) => i.name) }));
}
