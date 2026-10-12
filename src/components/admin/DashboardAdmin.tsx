import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { supabase } from '../../lib/supabase';
import { isTableMissing } from '../../lib/media';
import { visibleSkillGroups } from '../../lib/skills';

export const DashboardAdmin: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { settings, collections, tickets, session, backendConnected } = useContent();
  const [mediaTable, setMediaTable] = useState<'checking' | 'ok' | 'missing' | 'error'>('checking');

  useEffect(() => {
    if (!supabase) return;
    supabase.from('media_assets').select('id', { head: true, count: 'exact' }).then(({ error }) => setMediaTable(!error ? 'ok' : isTableMissing(error) ? 'missing' : 'error'));
  }, []);

  const skillsN = settings.skills.items.filter((s) => s.visible !== false).length;
  const stats: [string, number, string][] = [
    ['Projects', collections.projects.filter((p) => p.visible !== false).length, 'Projects'],
    ['Advertising work', collections.ad_campaigns.filter((p) => p.visible !== false).length, 'Advertising'],
    ['Work experience', collections.experience.length, 'Experience'],
    ['Skills', skillsN, 'skills'],
    ['New messages', tickets.filter((t) => t.status === 'New').length, 'inbox'],
  ];
  const hidden = settings.layout.filter((s) => !s.visible).map((s) => s.label);
  const quick: [string, string][] = [['Edit skills', 'skills'], ['Add a project', 'Projects'], ['Media Library', 'media'], ['Section headings', 'headings'], ['Typography & highlights', 'typography'], ['Storage Management', 'storage']];

  return (
    <div className="space-y-6">
      <p className="text-xs text-zinc-500">Signed in as <span className="text-zinc-300">{session?.user.email}</span>. Changes you save go live on the website immediately.</p>
      <dl className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(([k, v, to]) => (
          <button key={k} type="button" onClick={() => onNavigate(to)} className="text-left p-4 rounded-xl bg-zinc-950 border border-white/10 hover:border-white/40 cursor-pointer">
            <dd className="text-2xl font-bold text-white tabular-nums">{v}</dd><dt className="text-[11px] text-zinc-500 uppercase tracking-wider mt-0.5">{k}</dt>
          </button>
        ))}
      </dl>

      <section className="space-y-2"><h3 className="text-xs uppercase tracking-widest text-zinc-500">Quick actions</h3>
        <div className="flex flex-wrap gap-2">{quick.map(([l, to]) => <button key={to} type="button" onClick={() => onNavigate(to)} className="px-3 py-2 text-xs rounded-lg border border-white/20 text-zinc-100 hover:bg-white/10 cursor-pointer">{l}</button>)}
          <a href="/" target="_blank" rel="noreferrer" className="px-3 py-2 text-xs rounded-lg border border-white/20 text-zinc-100 hover:bg-white/10 inline-flex items-center gap-1.5">View site <ExternalLink className="w-3 h-3" /></a></div>
      </section>

      <section className="space-y-2"><h3 className="text-xs uppercase tracking-widest text-zinc-500">Setup status</h3>
        <ul className="space-y-1.5 text-xs">
          <li className="flex items-center gap-2 text-zinc-200">{backendConnected ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}Supabase connection</li>
          <li className="flex items-start gap-2 text-zinc-200">
            {mediaTable === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : mediaTable === 'checking' ? <span className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />}
            <span>Media details table {mediaTable === 'ok' ? 'ready' : mediaTable === 'missing' ? <>is missing: run <code className="px-1 bg-white/10 rounded">supabase/migration-004-media-skills-typography.sql</code> once (the library works without it, but external images and details need it)</> : mediaTable === 'error' ? 'could not be checked' : 'checking…'}</span>
          </li>
          <li className="flex items-center gap-2 text-zinc-200"><CheckCircle2 className="w-4 h-4 text-emerald-400" />{visibleSkillGroups(settings.skills).length} visible skill categories{hidden.length ? ` · hidden sections: ${hidden.join(', ')}` : ''}</li>
        </ul>
      </section>
    </div>
  );
};
