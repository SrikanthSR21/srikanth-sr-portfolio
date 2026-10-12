import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Inbox, Key, Layers, Lock, LogOut, Menu, Palette, User, X, Image as ImageIcon, Navigation, Type, BarChart3, Megaphone, Briefcase, Tags, Mail, Wrench, FolderKanban } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { AppearanceAdmin } from '../components/admin/AppearanceAdmin';
import { ContentAdmin } from '../components/admin/ContentAdmin';
import { ProfileAdmin } from '../components/admin/ProfileAdmin';
import { InboxAdmin } from '../components/admin/InboxAdmin';
import { LayoutAdmin } from '../components/admin/LayoutAdmin';
import { hasUnsavedChanges } from '../components/admin/AdminDirty';
import { CONTENT_TABS, ContentTab } from '../components/admin/ContentAdmin';

const LoginForm: React.FC = () => {
  const { signIn, backendConnected } = useContent();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError((await signIn(email.trim(), password)) ?? '');
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold uppercase text-white">Admin</h1>
        <p className="text-xs text-zinc-400 font-mono-code">
          {backendConnected ? 'Sign in to manage your portfolio.' : 'Backend not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'}
        </p>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username"
          className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white font-mono-code" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password"
          className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white font-mono-code" />
        {error && <div className="text-xs text-red-400 font-mono-code">{error}</div>}
        <button type="submit" disabled={busy || !backendConnected}
          className="w-full py-3 bg-white text-black text-xs font-bold uppercase rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
          <Key className="w-3.5 h-3.5" /> {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <a href="/" className="block text-[11px] text-zinc-500 hover:text-white font-mono-code">← Back to site</a>
      </form>
    </div>
  );
};

type NavEntry = { id: string; label: string; icon: React.ComponentType<{ className?: string }>; hint: string };
const GROUPS: { title: string; items: NavEntry[] }[] = [
  { title: 'Site', items: [
    { id: 'layout', label: 'Sections & Layout', icon: Layers, hint: 'Order, visibility and headings of every section' },
    { id: 'appearance', label: 'Appearance', icon: Palette, hint: 'Theme, typography, hero animation and default light/dark mode' },
    { id: 'profile', label: 'Hero, Contact & Social', icon: User, hint: 'Name, hero text, contact details, bio, skills, education and CV' },
  ] },
  { title: 'Content', items: [
    { id: 'Projects', label: 'My Own Projects', icon: FolderKanban, hint: 'Websites and products you built' },
    { id: 'Advertising', label: 'Advertising Work', icon: Megaphone, hint: 'Work for companies and clients' },
    { id: 'Experience', label: 'Work Experience', icon: Briefcase, hint: 'Work-history timeline' },
    { id: 'Brands', label: 'Brand Ticker', icon: Tags, hint: 'Scrolling brand names' },
    { id: 'Hero stats', label: 'Hero Metrics', icon: BarChart3, hint: 'Numbers under the hero buttons' },
    { id: 'Images', label: 'Images', icon: ImageIcon, hint: 'About Me portrait (transparent PNG supported)' },
    { id: 'Navigation', label: 'Navigation', icon: Navigation, hint: 'Top bar and mobile menu links' },
    { id: 'Texts', label: 'All Texts', icon: Type, hint: 'Every label and heading on the website' },
  ] },
  { title: 'Messages & system', items: [
    { id: 'inbox', label: 'Inbox', icon: Inbox, hint: 'Contact-form enquiries' },
    { id: 'Contact form', label: 'Contact Form', icon: Mail, hint: 'Enquiry-type suggestions' },
    { id: 'Setup', label: 'Setup', icon: Wrench, hint: 'One-time import of the built-in content' },
  ] },
];
const ALL = GROUPS.flatMap((g) => g.items);

export default function AdminPage() {
  const { session, signOut, ready, tickets } = useContent();
  const [page, setPage] = useState<string>('layout');
  const [drawer, setDrawer] = useState(false);
  const drawerBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = 'Admin';
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'robots'); document.head.appendChild(meta); }
    meta.setAttribute('content', 'noindex,nofollow');
    // The dashboard always stays dark, independent of the public light/dark toggle.
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.setProperty('--bg-color', '#000000');
  }, []);

  // Warn before the tab/window is closed with unsaved edits
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => { if (hasUnsavedChanges()) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDrawer(false); drawerBtn.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const go = useCallback((id: string) => {
    if (id !== page && hasUnsavedChanges() && !confirm('You have unsaved changes on this page. Leave without saving?')) return;
    setPage(id); setDrawer(false);
    window.scrollTo({ top: 0 });
  }, [page]);

  const unread = tickets.filter((t) => t.status === 'New').length;
  const current = ALL.find((e) => e.id === page) ?? ALL[0];

  const Sidebar = (
    <nav aria-label="Admin sections" className="flex flex-col gap-6 p-4">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-zinc-500">{g.title}</div>
          <ul className="space-y-1">
            {g.items.map((e) => {
              const Icon = e.icon; const active = page === e.id;
              return (
                <li key={e.id}>
                  <button type="button" onClick={() => go(e.id)} aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left cursor-pointer border-l-2 transition-colors ${active ? 'bg-white/10 text-white border-white font-semibold' : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5'}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{e.label}</span>
                    {e.id === 'inbox' && unread > 0 && <span className="text-[10px] font-bold bg-white text-black rounded-full px-1.5 py-0.5" aria-label={`${unread} new`}>{unread}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-black text-white font-jakarta">
      {!session ? (
        ready ? <LoginForm /> : <div className="min-h-screen flex items-center justify-center text-xs text-zinc-500 font-mono-code">Loading…</div>
      ) : (
        <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] min-h-screen">
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex flex-col sticky top-0 h-screen border-r border-white/10 bg-zinc-950 overflow-y-auto">
            <div className="px-5 h-14 flex items-center border-b border-white/10 shrink-0">
              <span className="text-sm font-bold uppercase tracking-widest">Admin Dashboard</span>
            </div>
            <div className="flex-1">{Sidebar}</div>
            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs font-mono-code shrink-0">
              <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-zinc-300 hover:text-white">View site <ExternalLink className="w-3 h-3" /></a>
              <button onClick={signOut} className="flex items-center gap-1 text-zinc-400 hover:text-white cursor-pointer"><LogOut className="w-3 h-3" /> Sign out</button>
            </div>
          </aside>

          <div className="min-w-0">
            {/* Mobile top bar */}
            <header className="lg:hidden sticky top-0 z-30 h-14 px-4 flex items-center gap-3 bg-black/90 backdrop-blur border-b border-white/10">
              <button ref={drawerBtn} type="button" onClick={() => setDrawer(true)} aria-label="Open admin menu" aria-expanded={drawer}
                className="w-10 h-10 -ml-2 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"><Menu className="w-5 h-5" /></button>
              <span className="text-sm font-bold uppercase tracking-wider truncate flex-1">{current.label}</span>
              {unread > 0 && <button onClick={() => go('inbox')} className="text-[10px] font-bold bg-white text-black rounded-full px-2 py-1 cursor-pointer">{unread} new</button>}
            </header>

            {/* Mobile drawer */}
            {drawer && (
              <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Admin menu">
                <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/70" onClick={() => setDrawer(false)} />
                <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-zinc-950 border-r border-white/10 flex flex-col overflow-y-auto">
                  <div className="px-4 h-14 flex items-center justify-between border-b border-white/10 shrink-0">
                    <span className="text-sm font-bold uppercase tracking-widest">Admin</span>
                    <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1">{Sidebar}</div>
                  <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs font-mono-code">
                    <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-zinc-300">View site <ExternalLink className="w-3 h-3" /></a>
                    <button onClick={signOut} className="flex items-center gap-1 text-zinc-400 cursor-pointer"><LogOut className="w-3 h-3" /> Sign out</button>
                  </div>
                </div>
              </div>
            )}

            <main className="px-4 sm:px-6 lg:px-8 pb-16 pt-6 max-w-5xl">
              <div className="mb-6 hidden lg:block">
                <h1 className="text-xl font-bold">{current.label}</h1>
                <p className="text-xs text-zinc-500 mt-1">{current.hint}</p>
              </div>
              {!ready ? <p className="text-xs text-zinc-500 font-mono-code">Loading content…</p> : (
                <>
                  {page === 'layout' && <LayoutAdmin onNavigate={go} />}
                  {page === 'appearance' && <AppearanceAdmin />}
                  {page === 'profile' && <ProfileAdmin />}
                  {page === 'inbox' && <InboxAdmin />}
                  {(CONTENT_TABS as readonly string[]).includes(page) && <ContentAdmin tab={page as ContentTab} />}
                </>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
