import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  DEFAULT_ENQUIRY_TYPES, DEFAULT_HERO_METRICS, DEFAULT_IMAGES, DEFAULT_NAV, DEFAULT_TEXTS, DEFAULT_THEME,
  ClientLogo, HeroMetric, NavItem, SiteImages,
} from '../lib/defaults';
import { DEFAULT_LAYOUT, normalizeLayout, SectionConfig } from '../lib/sections';
import {
  AD_CAMPAIGNS_DATA, CLIENT_LOGOS, INITIAL_PORTFOLIO_INFO, PROJECTS_DATA, WORK_EXPERIENCE_DATA,
} from '../data/portfolioData';
import { AdCampaignItem, ExperienceItem, PortfolioInfo, ProjectItem, ThemeSettings, TicketItem } from '../types';

type Settings = {
  info: PortfolioInfo;
  nav: NavItem[];
  texts: Record<string, string>;
  hero_metrics: HeroMetric[];
  clients: ClientLogo[];
  images: SiteImages;
  theme: ThemeSettings;
  /** Section order / visibility / labels */
  layout: SectionConfig[];
  /** Suggestions in the contact form's enquiry-type field */
  enquiry_types: string[];
};
type Collections = {
  projects: ProjectItem[];
  ad_campaigns: AdCampaignItem[];
  experience: ExperienceItem[];
};
export type SettingKey = keyof Settings;
export type CollectionName = keyof Collections;

const DEFAULT_SETTINGS: Settings = {
  info: INITIAL_PORTFOLIO_INFO,
  nav: DEFAULT_NAV,
  texts: DEFAULT_TEXTS,
  hero_metrics: DEFAULT_HERO_METRICS,
  clients: CLIENT_LOGOS.map((c, i) => ({ id: `c${i}`, ...c })),
  images: DEFAULT_IMAGES,
  theme: DEFAULT_THEME,
  layout: DEFAULT_LAYOUT,
  enquiry_types: DEFAULT_ENQUIRY_TYPES,
};
const DEFAULT_COLLECTIONS: Collections = {
  projects: PROJECTS_DATA,
  ad_campaigns: AD_CAMPAIGNS_DATA,
  experience: WORK_EXPERIENCE_DATA,
};

interface ContentValue {
  ready: boolean;
  backendConnected: boolean;
  settings: Settings;
  collections: Collections;
  tickets: TicketItem[];
  session: Session | null;
  /** t('hero.ctaPrimary') → editable text with built-in fallback */
  t: (key: string) => string;
  saveSetting: <K extends SettingKey>(key: K, value: Settings[K]) => Promise<void>;
  saveCollection: <K extends CollectionName>(name: K, items: Collections[K]) => Promise<void>;
  refreshTickets: () => Promise<void>;
  updateTicketStatus: (ref: string, status: TicketItem['status']) => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<ContentValue | null>(null);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const cached = localStorage.getItem('site_theme_cache');
      return cached ? { ...DEFAULT_SETTINGS, theme: { ...DEFAULT_THEME, ...JSON.parse(cached) } } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  const [collections, setCollections] = useState<Collections>(DEFAULT_COLLECTIONS);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);

  // ---- load public data (initial, on realtime change, and when the tab regains focus) ----
  const load = useCallback(async () => {
    if (!supabase) return;
    try {
        const [content, projects, campaigns, experience] = await Promise.all([
          supabase.from('site_content').select('key,value'),
          supabase.from('projects').select('data').order('sort_order'),
          supabase.from('ad_campaigns').select('data').order('sort_order'),
          supabase.from('experience').select('data').order('sort_order'),
        ]);

        const next: Settings = { ...DEFAULT_SETTINGS };
        (content.data ?? []).forEach((row: { key: string; value: any }) => {
          if (row.key === 'texts') next.texts = { ...DEFAULT_TEXTS, ...row.value };
          else if (row.key === 'info') next.info = { ...INITIAL_PORTFOLIO_INFO, ...row.value };
          else if (row.key === 'images') next.images = { ...DEFAULT_IMAGES, ...row.value };
          else if (row.key === 'theme') next.theme = { ...DEFAULT_THEME, ...row.value };
          else if (row.key === 'layout') next.layout = normalizeLayout(row.value);
          else if (row.key === 'enquiry_types') {
            const list = Array.isArray(row.value) ? row.value.filter((v: unknown) => typeof v === 'string' && v.trim()).map((v: string) => v.trim().slice(0, 80)) : [];
            next.enquiry_types = list;
          }
          else if (row.key in next) (next as any)[row.key] = row.value;
        });
        setSettings(next);
        try { localStorage.setItem('site_theme_cache', JSON.stringify(next.theme)); } catch { /* ignore */ }

        // Empty table = not seeded yet → keep the built-in defaults.
        const pick = <T,>(res: { data: { data: T }[] | null }, fb: T[]) =>
          res.data && res.data.length ? res.data.map((r) => r.data) : fb;
        setCollections({
          projects: pick<ProjectItem>(projects as any, PROJECTS_DATA),
          ad_campaigns: pick<AdCampaignItem>(campaigns as any, AD_CAMPAIGNS_DATA),
          experience: pick<ExperienceItem>(experience as any, WORK_EXPERIENCE_DATA),
        });
    } catch (e) {
      console.warn('Backend unreachable, using built-in content', e);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    load();

    // Live updates: any admin change is pushed to every open visitor tab.
    let timer: ReturnType<typeof setTimeout>;
    const debounced = () => { clearTimeout(timer); timer = setTimeout(load, 300); };
    let channel = supabase.channel('site-live');
    ['site_content', 'projects', 'ad_campaigns', 'experience'].forEach((table) => {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, debounced);
    });
    channel.subscribe();

    // Safety net if realtime isn't enabled: refresh when the visitor returns to the tab.
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      supabase?.removeChannel(channel);
    };
  }, [load]);

  // ---- admin session ----
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---- tickets only load for the logged-in admin (RLS blocks everyone else) ----
  const refreshTickets = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (error) { console.warn('Could not load tickets', error.message); return; }
    setTickets((data ?? []).map((r: any) => ({
      id: r.ref, clientName: r.client_name, clientEmail: r.client_email, service: r.service ?? undefined,
      budget: r.budget ?? undefined, message: r.message, status: r.status,
      date: String(r.created_at).slice(0, 10), createdAt: r.created_at, whatsappStatus: r.whatsapp_status ?? null,
    })));
  }, []);

  useEffect(() => {
    if (!supabase || !session) { setTickets([]); return; }
    refreshTickets();
    // New enquiries appear instantly once migration-003 has added `tickets` to the realtime publication.
    const channel = supabase.channel('inbox-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => { refreshTickets(); })
      .subscribe();
    return () => { supabase?.removeChannel(channel); };
  }, [session, refreshTickets]);

  // ---- browser tab title / description from editable texts ----
  useEffect(() => {
    document.title = settings.texts['seo.title'] || document.title;
    document.querySelector('meta[name="description"]')
      ?.setAttribute('content', settings.texts['seo.description'] || '');
  }, [settings.texts]);

  const saveSetting = useCallback<ContentValue['saveSetting']>(async (key, value) => {
    if (!supabase) throw new Error('Supabase is not configured');
    const { error } = await supabase.from('site_content')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveCollection = useCallback<ContentValue['saveCollection']>(async (name, items) => {
    if (!supabase) throw new Error('Supabase is not configured');
    const rows = (items as any[]).map((d, i) => ({ id: d.id, sort_order: i, data: d }));
    if (rows.length) {
      const { error } = await supabase.from(name).upsert(rows);
      if (error) throw error;
    }
    // delete rows the admin removed
    const del = supabase.from(name).delete();
    const { error: delErr } = rows.length
      ? await del.not('id', 'in', `(${rows.map((r) => `"${r.id}"`).join(',')})`)
      : await del.neq('id', '');
    if (delErr) throw delErr;
    setCollections((prev) => ({ ...prev, [name]: items }));
  }, []);

  const updateTicketStatus = useCallback(async (ref: string, status: TicketItem['status']) => {
    if (!supabase) throw new Error('Supabase is not configured');
    const { error } = await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('ref', ref);
    if (error) throw error;
    setTickets((prev) => prev.map((t) => (t.id === ref ? { ...t, status } : t)));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Backend is not configured (missing env variables).';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);
  const signOut = useCallback(async () => { await supabase?.auth.signOut(); }, []);

  const t = useCallback((key: string) => settings.texts[key] ?? DEFAULT_TEXTS[key] ?? key, [settings.texts]);

  const value = useMemo<ContentValue>(() => ({
    ready, backendConnected: !!supabase, settings, collections, tickets, session, t,
    saveSetting, saveCollection, refreshTickets, updateTicketStatus, signIn, signOut,
  }), [ready, settings, collections, tickets, session, t, saveSetting, saveCollection, refreshTickets, updateTicketStatus, signIn, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useContent = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useContent must be used inside <ContentProvider>');
  return v;
};
