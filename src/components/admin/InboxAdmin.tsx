import React, { useMemo, useState } from 'react';
import { ChevronDown, Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { TicketItem } from '../../types';

const STATUSES: TicketItem['status'][] = ['New', 'In Review', 'In Progress', 'Resolved'];
const badge: Record<TicketItem['status'], string> = {
  New: 'bg-white text-black', 'In Review': 'bg-amber-400/20 text-amber-300', 'In Progress': 'bg-sky-400/20 text-sky-300', Resolved: 'bg-emerald-400/20 text-emerald-300',
};

const when = (t: TicketItem) => {
  const d = new Date(t.createdAt || t.date);
  return isNaN(+d) ? t.date : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: t.createdAt ? 'short' : undefined });
};

export const InboxAdmin: React.FC = () => {
  const { tickets, updateTicketStatus, refreshTickets } = useContent();
  const [filter, setFilter] = useState<'All' | TicketItem['status']>('All');
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const shown = useMemo(() => (filter === 'All' ? tickets : tickets.filter((t) => t.status === filter)), [tickets, filter]);

  const change = async (id: string, s: TicketItem['status']) => {
    setError('');
    try { await updateTicketStatus(id, s); } catch (e: any) { setError(e.message || 'Could not update status'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mr-auto">Inbox ({tickets.length})</h3>
        <select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-2.5 py-2 text-xs bg-black border border-white/20 rounded-lg text-white">
          <option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button type="button" onClick={async () => { setRefreshing(true); await refreshTickets(); setRefreshing(false); }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs border border-white/20 rounded-lg text-zinc-200 hover:bg-white/10 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      {error && <div role="alert" className="text-xs text-red-400">{error}</div>}

      {!tickets.length && <div className="p-8 text-center text-sm text-zinc-500 border border-dashed border-white/15 rounded-xl">No messages yet. Contact-form submissions appear here.</div>}
      {tickets.length > 0 && !shown.length && <p className="text-sm text-zinc-500">No messages with status “{filter}”.</p>}

      <ul className="space-y-3">
        {shown.map((t) => {
          const expanded = open === t.id;
          return (
            <li key={t.id} className={`rounded-xl border bg-zinc-950 ${t.status === 'New' ? 'border-white/40' : 'border-white/15'}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4">
                <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : t.id)} className="flex-1 min-w-[12rem] text-left cursor-pointer">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    <span className="text-sm text-white font-semibold">{t.clientName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badge[t.status]}`}>{t.status === 'New' ? 'NEW' : t.status}</span>
                    {t.whatsappStatus === 'sent' && <span className="text-[10px] text-emerald-400">WhatsApp ✓</span>}
                    {t.whatsappStatus === 'failed' && <span className="text-[10px] text-amber-400">WhatsApp failed</span>}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 font-mono-code break-all">{t.clientEmail} · {when(t)}{t.service ? ` · ${t.service}` : ''}</div>
                  {!expanded && <p className="mt-2 text-sm text-zinc-400 line-clamp-2 break-words">{t.message}</p>}
                </button>
                <select aria-label={`Status for ${t.clientName}`} value={t.status} onChange={(e) => change(t.id, e.target.value as TicketItem['status'])}
                  className="px-2 py-2 text-xs bg-black border border-white/20 rounded-lg text-white">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              {expanded && (
                <div className="px-3 sm:px-4 pb-4 pt-3 border-t border-white/10 space-y-3">
                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                    <div><dt className="inline text-zinc-500">Reference: </dt><dd className="inline text-zinc-300 font-mono-code">{t.id}</dd></div>
                    <div><dt className="inline text-zinc-500">Received: </dt><dd className="inline text-zinc-300">{when(t)}</dd></div>
                    <div><dt className="inline text-zinc-500">Enquiry type: </dt><dd className="inline text-zinc-300">{t.service || 'Not specified'}</dd></div>
                    {t.budget && <div><dt className="inline text-zinc-500">Budget (legacy form): </dt><dd className="inline text-zinc-300">{t.budget}</dd></div>}
                  </dl>
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{t.message}</p>
                  <a href={`mailto:${t.clientEmail}?subject=${encodeURIComponent('Re: your enquiry')}`} className="inline-flex items-center gap-1.5 text-xs text-white underline underline-offset-4">
                    <Mail className="w-3.5 h-3.5" /> Reply by email
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-zinc-600 flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> “WhatsApp ✓” appears only when WhatsApp's API accepted the notification.</p>
    </div>
  );
};
