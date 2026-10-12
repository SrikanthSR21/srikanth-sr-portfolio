import React from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import type { SaveState } from './AdminDirty';

/** Sticky action bar used by every editor: title, extra actions, and a live save status. */
export const SaveBar: React.FC<{
  title: string;
  dirty: boolean;
  state: SaveState;
  onSave: () => void;
  onDiscard?: () => void;
  children?: React.ReactNode;
  saveLabel?: string;
}> = ({ title, dirty, state, onSave, onDiscard, children, saveLabel = 'Save changes' }) => (
  <div className="sticky top-14 lg:top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-black/90 backdrop-blur border-b border-white/10 flex flex-wrap items-center gap-x-4 gap-y-2">
    <h3 className="text-sm font-bold uppercase tracking-wider text-white mr-auto min-w-0 truncate">{title}</h3>
    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
      {state.kind === 'saving' && <span className="flex items-center gap-1.5 text-xs text-zinc-300"><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</span>}
      {state.kind === 'saved' && <span className="flex items-center gap-1.5 text-xs text-emerald-400"><Check className="w-3.5 h-3.5" />Saved: live on the site</span>}
      {state.kind === 'error' && <span role="alert" className="flex items-center gap-1.5 text-xs text-red-400 max-w-[18rem]"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span className="truncate" title={state.message}>{state.message}</span></span>}
      {state.kind === 'idle' && dirty && <span className="text-xs text-amber-400">● Unsaved changes</span>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {dirty && onDiscard && (
        <button type="button" onClick={onDiscard} className="px-3 py-2 text-xs text-zinc-300 border border-white/20 rounded-lg hover:border-white/50 cursor-pointer">Discard</button>
      )}
      <button type="button" onClick={onSave} disabled={state.kind === 'saving' || !dirty}
        className="px-4 py-2 text-xs font-bold bg-white text-black rounded-lg hover:bg-zinc-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
        {saveLabel}
      </button>
    </div>
  </div>
);
