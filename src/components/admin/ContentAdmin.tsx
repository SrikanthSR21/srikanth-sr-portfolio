import React, { useMemo, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import { RecordsEditor, Field, inputCls } from './RecordsEditor';
import { ImageUploader } from './ImageUploader';
import { SaveBar } from './SaveBar';
import { useDraft, useSaver } from './AdminDirty';
import { DEFAULT_ENQUIRY_TYPES, DEFAULT_TEXTS, ClientLogo, HeroMetric, NavItem, SiteImages } from '../../lib/defaults';
import { cloudifyCampaigns, cloudifyProjects, toCloud } from '../../lib/seed';
import profileFallback from '../../assets/images/profile_editorial_portrait_1791718263477.jpg';
import { AdCampaignItem, ExperienceItem, ProjectItem } from '../../types';

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

const NAV_FIELDS: Field[] = [
  { key: 'label', label: 'Label', type: 'text' },
  { key: 'href', label: 'Link (#section, /page or https://…)', type: 'text' },
  { key: 'kind', label: 'Type', type: 'select', options: ['link', 'resume'] },
  { key: 'visible', label: 'Visible', type: 'bool' },
];
const METRIC_FIELDS: Field[] = [
  { key: 'value', label: 'Big number', type: 'text' },
  { key: 'label', label: 'Caption', type: 'text' },
];
const CLIENT_FIELDS: Field[] = [
  { key: 'name', label: 'Brand name', type: 'text' },
  { key: 'symbol', label: '2-letter monogram', type: 'text', hint: 'Shown when no logo image is added.' },
  { key: 'logo', label: 'Logo image (optional, small)', type: 'image', folder: 'brands', optional: true, hint: 'Replaces the monogram in the ticker. Square or wide logos both work; transparent PNG/SVG recommended.' },
  { key: 'logoBg', label: 'Logo badge background', type: 'select', options: ['light', 'dark', 'none'], showIf: (it: any) => !!it.logo, hint: 'light = white badge (for dark logos) · dark = black badge (for white logos) · none = transparent' },
];
const PROJECT_FIELDS: Field[] = [
  { key: 'visible', label: 'Show on the public site', type: 'bool' },
  { key: 'title', label: 'Project title', type: 'text' },
  { key: 'category', label: 'Category', type: 'text', hint: 'e.g. Portfolio website, E-commerce, Web app' },
  { key: 'shortDesc', label: 'Short description (shown on the card)', type: 'textarea' },
  { key: 'fullDesc', label: 'Full description (shown in the pop-up)', type: 'textarea' },
  { key: 'heroImage', label: 'Preview image', type: 'image', folder: 'projects' },
  { key: 'tags', label: 'Skills / technologies (comma separated)', type: 'tags' },
  { key: 'liveUrl', label: 'Live website URL', type: 'text' },
  { key: 'sourceUrl', label: 'Source-code URL (optional)', type: 'text' },
  { key: 'client', label: 'Client / for whom (optional)', type: 'text' },
  { key: 'role', label: 'Your role', type: 'text' },
  { key: 'year', label: 'Year', type: 'text' },
  { key: 'metrics', label: 'Highlight line (optional)', type: 'text' },
];
const WORK_TYPES = ['Meta Ads', 'Google Ads', 'Omnichannel', 'SEO & SEM', 'Social Media Marketing', 'Website Optimization', 'Marketing Report'];
const CAMPAIGN_FIELDS: Field[] = [
  { key: 'visible', label: 'Show on the public site', type: 'bool' },
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'clientBrand', label: 'Client / company', type: 'text' },
  { key: 'platform', label: 'Type of work', type: 'combo', options: WORK_TYPES, hint: 'Pick a suggestion or type your own. Each type gets a filter chip.' },
  { key: 'metricHeadline', label: 'Headline result', type: 'text' },
  { key: 'summary', label: 'Summary', type: 'textarea' },
  { key: 'hasScreenshot', label: 'Show screenshot', type: 'bool' },
  { key: 'screenshotImage', label: 'Screenshot / report image', type: 'image', folder: 'advertising', optional: true },
  { key: 'achievements', label: 'Achievements (one per line)', type: 'lines' },
  { key: 'keyStats', label: 'Key stats', type: 'pairs' },
];
const EXPERIENCE_FIELDS: Field[] = [
  { key: 'role', label: 'Role', type: 'text' },
  { key: 'company', label: 'Company', type: 'text' },
  { key: 'period', label: 'Period', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'isCurrent', label: 'Current job', type: 'bool' },
  { key: 'summary', label: 'Summary', type: 'textarea' },
  { key: 'achievements', label: 'Achievements (one per line)', type: 'lines' },
  { key: 'image', label: 'Card image (optional)', type: 'image', folder: 'experience', optional: true,
    hint: 'A company logo, branding or work photo. Privacy: do NOT upload an ID card that shows ID numbers, barcodes/QR codes, address or date of birth: crop or blur those first. Remove the image at any time.' },
  { key: 'imageAlt', label: 'Image description (alt text)', type: 'text', showIf: (it) => !!it.image, hint: 'Read by screen readers. Defaults to the company and role.' },
  { key: 'imagePosition', label: 'Image position', type: 'select', options: ['right', 'left', 'top', 'bottom'], showIf: (it) => !!it.image, hint: 'On phones the image always stacks above/below the text.' },
  { key: 'imageSize', label: 'Image size', type: 'select', options: ['md', 'sm', 'lg'], showIf: (it) => !!it.image },
  { key: 'imageFit', label: 'Image fit', type: 'select', options: ['contain', 'cover'], showIf: (it) => !!it.image, hint: 'contain = whole image visible (logos). cover = fills the frame (photos, may crop edges).' },
  { key: 'imageCaption', label: 'Image caption (optional)', type: 'text', showIf: (it) => !!it.image },
];

/** Tabs exposed as sidebar entries by AdminPage */
export const CONTENT_TABS = ['Navigation', 'Texts', 'Hero stats', 'Projects', 'Advertising', 'Experience', 'Brands', 'Images', 'Contact form', 'Setup'] as const;
export type ContentTab = (typeof CONTENT_TABS)[number];

const GROUP_TITLES: Record<string, string> = {
  seo: 'Browser tab & search', hero: 'Hero', about: 'About Me', projects: 'My Own Projects', ads: 'Advertising Portfolio',
  branding: 'Branding & Work Experience', skills: 'Skills', contact: 'Contact', footer: 'Footer',
};

const TextsEditor: React.FC = () => {
  const c = useContent();
  const { draft, setDraft, dirty, discard } = useDraft<Record<string, string>>(c.settings.texts);
  const { state, run } = useSaver();
  const [q, setQ] = useState('');

  const groups = useMemo(() => Object.keys(DEFAULT_TEXTS).reduce<Record<string, string[]>>((acc, k) => {
    if (q && !k.toLowerCase().includes(q.toLowerCase()) && !(draft[k] ?? '').toLowerCase().includes(q.toLowerCase())) return acc;
    (acc[k.split('.')[0]] ||= []).push(k); return acc;
  }, {}), [q, draft]);

  return (
    <div className="space-y-6">
      <SaveBar title="Website texts" dirty={dirty} state={state} onDiscard={discard}
        onSave={() => run(() => c.saveSetting('texts', draft))} saveLabel="Save texts" />
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search texts…" aria-label="Search texts" className={`${inputCls} max-w-sm`} />
      {Object.keys(groups).length === 0 && <p className="text-sm text-zinc-500">No texts match “{q}”.</p>}
      {Object.entries(groups).map(([g, keys]) => (
        <fieldset key={g} className="space-y-3 p-4 rounded-xl border border-white/10 bg-zinc-950/50">
          <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">{GROUP_TITLES[g] ?? g}</legend>
          {keys.map((k) => (
            <div key={k} className="grid gap-1.5">
              <label htmlFor={`t-${k}`} className="text-[11px] text-zinc-500 font-mono-code break-all">{k}</label>
              <input id={`t-${k}`} className={inputCls} value={draft[k] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} />
            </div>
          ))}
        </fieldset>
      ))}
    </div>
  );
};

/** Optional picture for the square emblem in the CYBERFIX frame (replaces the lightning icon). Stored with the site texts, no database change needed. */
const FRAME_LOGO_KEY = 'branding.frameLogo';
const FrameEmblemEditor: React.FC = () => {
  const c = useContent();
  const saved = c.settings.texts[FRAME_LOGO_KEY] ?? '';
  const { draft, setDraft, dirty, discard } = useDraft<string>(saved);
  const { state, run } = useSaver();
  return (
    <div className="space-y-3 max-w-2xl">
      <SaveBar title="CYBERFIX frame emblem" dirty={dirty} state={state} onDiscard={discard}
        onSave={() => run(() => c.saveSetting('texts', { ...c.settings.texts, [FRAME_LOGO_KEY]: draft.trim() }))} />
      <p className="text-xs text-zinc-500">The square badge at the top of the CYBERFIX frame. Add an image to replace the lightning icon; remove it to bring the icon back.</p>
      <ImageUploader value={draft} folder="brands" allowClear onChange={(url) => setDraft(url)} />
    </div>
  );
};

const ImagesEditor: React.FC = () => {
  const c = useContent();
  const { draft, setDraft, dirty, discard } = useDraft<SiteImages>(c.settings.images);
  const { state, run } = useSaver();
  return (
    <div className="space-y-5">
      <SaveBar title="Images" dirty={dirty} state={state} onDiscard={discard} onSave={() => run(() => c.saveSetting('images', draft))} />
      <section className="space-y-3 max-w-2xl">
        <h4 className="text-xs uppercase tracking-widest text-zinc-400">About Me portrait</h4>
        <ImageUploader large value={draft.profile} folder="profile"
          onChange={(url, meta) => setDraft((d) => ({ ...d, profile: url, profileTransparent: meta ? meta.hasAlpha : d.profileTransparent, profileWidth: meta?.width || undefined, profileHeight: meta?.height || undefined }))} />
        <label className="grid gap-1.5 max-w-xs">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">How to display it</span>
          <select className={inputCls} value={draft.profileDisplay ?? 'auto'} onChange={(e) => setDraft((d) => ({ ...d, profileDisplay: e.target.value as SiteImages['profileDisplay'] }))}>
            <option value="auto">Automatic (soft shadow, none for transparent images)</option>
            <option value="framed">Always a soft shadow</option>
            <option value="cutout">Never a shadow (flat)</option>
          </select>
        </label>
        <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-white" checked={!!draft.profileTransparent} onChange={(e) => setDraft((d) => ({ ...d, profileTransparent: e.target.checked }))} />
          This image has a transparent background (detected automatically on upload)
        </label>
        <p className="text-[11px] text-zinc-500">The portrait is always shown as a clean rectangle with no border, at its original proportions (never cropped or stretched), exactly as uploaded: no filter and no background behind transparent areas. Save to publish. Project, campaign and brand images are edited inside their own sections.</p>
      </section>
    </div>
  );
};

const ContactFormEditor: React.FC = () => {
  const c = useContent();
  const source = useMemo(() => ({ list: c.settings.enquiry_types.join('\n') }), [c.settings.enquiry_types]);
  const { draft, setDraft, dirty, discard } = useDraft(source, (v) => v.list.split('\n').map((s) => s.trim()).filter(Boolean));
  const { state, run } = useSaver();
  const save = () => run(() => c.saveSetting('enquiry_types', draft.list.split('\n').map((s) => s.trim().slice(0, 80)).filter(Boolean)));
  return (
    <div className="space-y-5 max-w-2xl">
      <SaveBar title="Contact form" dirty={dirty} state={state} onDiscard={discard} onSave={save} />
      <p className="text-xs text-zinc-500">The form asks for name, email, an optional enquiry type and a message. Visitors can pick one of these suggestions or choose “Other” and type their own answer. Form labels are under Texts → Contact.</p>
      <label className="grid gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Enquiry-type suggestions (one per line)</span>
        <textarea rows={8} className={inputCls} value={draft.list} onChange={(e) => setDraft({ list: e.target.value })} />
      </label>
      <button type="button" onClick={() => setDraft({ list: DEFAULT_ENQUIRY_TYPES.join('\n') })} className="text-xs text-zinc-300 underline underline-offset-4 cursor-pointer">Restore the default suggestions</button>
    </div>
  );
};

export const ContentAdmin: React.FC<{ tab: ContentTab }> = ({ tab }) => {
  const c = useContent();
  const [msg, setMsg] = useState('');

  const seed = async () => {
    if (!confirm('Copy ALL built-in content and images into your database? Existing database content will be overwritten.')) return;
    setMsg('Uploading images and saving… (≈ 20 s)');
    try {
      await c.saveCollection('projects', await cloudifyProjects(c.collections.projects));
      await c.saveCollection('ad_campaigns', await cloudifyCampaigns(c.collections.ad_campaigns));
      await c.saveCollection('experience', c.collections.experience);
      await c.saveSetting('info', c.settings.info);
      await c.saveSetting('nav', c.settings.nav);
      await c.saveSetting('texts', c.settings.texts);
      await c.saveSetting('hero_metrics', c.settings.hero_metrics);
      await c.saveSetting('clients', c.settings.clients);
      await c.saveSetting('theme', c.settings.theme);
      await c.saveSetting('layout', c.settings.layout);
      await c.saveSetting('enquiry_types', c.settings.enquiry_types);
      const profile = await toCloud(c.settings.images.profile || profileFallback, 'profile');
      await c.saveSetting('images', { ...c.settings.images, profile: profile || '' });
      setMsg('Done ✓ Everything is now stored in Supabase and editable.');
    } catch (e: any) { setMsg(`Failed: ${e.message}`); }
  };

  return (
    <div className="space-y-5">
      {tab === 'Navigation' && (
        <RecordsEditor<NavItem> title="Navigation bar" description="Links shown in the top bar and the mobile menu. Links that point to a hidden section are hidden automatically."
          items={c.settings.nav} fields={NAV_FIELDS} titleKey="label" emptyText="No navigation links yet."
          blank={() => ({ id: uid('n'), label: 'New link', href: '#', kind: 'link', visible: true })}
          onSave={(items) => c.saveSetting('nav', items)} />
      )}
      {tab === 'Texts' && <TextsEditor />}
      {tab === 'Hero stats' && (
        <RecordsEditor<HeroMetric> title="Hero metric bar" items={c.settings.hero_metrics} fields={METRIC_FIELDS} titleKey="value" emptyText="No metrics yet."
          blank={() => ({ id: uid('m'), value: '0', label: 'New metric' })}
          onSave={(items) => c.saveSetting('hero_metrics', items)} />
      )}
      {tab === 'Projects' && (
        <RecordsEditor<ProjectItem> title="My Own Projects" visibleKey="visible"
          description="Websites and products you built yourself. Client advertising work belongs under Advertising."
          items={c.collections.projects} fields={PROJECT_FIELDS} titleKey="title" addLabel="Add project" emptyText="No projects yet. Add your first one."
          blank={() => ({ id: uid('proj'), title: 'New project', client: '', category: '', role: '', shortDesc: '', fullDesc: '', heroImage: '', liveUrl: '', sourceUrl: '', year: String(new Date().getFullYear()), tags: [], metrics: '', visible: true })}
          onSave={(items) => c.saveCollection('projects', items)} />
      )}
      {tab === 'Advertising' && (
        <RecordsEditor<AdCampaignItem> title="Advertising work" visibleKey="visible"
          description="Work done for companies and clients: SEO, Google Ads, Meta Ads, social media, reports…"
          items={c.collections.ad_campaigns} fields={CAMPAIGN_FIELDS} titleKey="title" addLabel="Add work" emptyText="No client work yet. Add your first one."
          blank={() => ({ id: uid('ad'), title: 'New campaign', clientBrand: '', platform: 'Meta Ads', metricHeadline: '', summary: '', hasScreenshot: false, achievements: [], keyStats: [], visible: true })}
          onSave={(items) => c.saveCollection('ad_campaigns', items)} />
      )}
      {tab === 'Experience' && (
        <RecordsEditor<ExperienceItem> title="Work experience" items={c.collections.experience} fields={EXPERIENCE_FIELDS} titleKey="company" emptyText="No work history yet."
          blank={() => ({ id: uid('exp'), role: '', company: 'New company', period: '', location: '', summary: '', achievements: [] })}
          onSave={(items) => c.saveCollection('experience', items)} />
      )}
      {tab === 'Brands' && (
        <RecordsEditor<ClientLogo> title="Brand ticker" items={c.settings.clients} fields={CLIENT_FIELDS} titleKey="name" emptyText="No brands yet."
          blank={() => ({ id: uid('c'), name: 'NEW BRAND', symbol: 'NB' })}
          onSave={(items) => c.saveSetting('clients', items)} />
      )}
      {tab === 'Brands' && <div className="pt-6 mt-6 border-t border-white/10"><FrameEmblemEditor /></div>}
      {tab === 'Images' && <ImagesEditor />}
      {tab === 'Contact form' && <ContactFormEditor />}
      {tab === 'Setup' && (
        <div className="space-y-3 text-xs text-zinc-400 max-w-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">First-time setup</h3>
          <p>Copy all the built-in content and bundled images into Supabase so everything becomes editable. Only needed once.</p>
          <button onClick={seed} className="px-4 py-2 text-xs font-bold bg-white text-black rounded-lg cursor-pointer">Publish built-in content to database</button>
        </div>
      )}
      {msg && <div role="status" className="text-xs text-zinc-300 font-mono-code">{msg}</div>}
    </div>
  );
};
