import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  /** The user must type this exact word before the confirm button is enabled (used for dangerous deletes) */
  requireTyping?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<Props> = ({ open, title, children, confirmLabel = 'Confirm', danger, busy, requireTyping, onConfirm, onCancel }) => {
  const [typed, setTyped] = useState('');
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setTyped('');
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  const blocked = busy || (!!requireTyping && typed.trim() !== requireTyping);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Cancel" className="absolute inset-0 bg-black/80" onClick={() => !busy && onCancel()} />
      <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-zinc-950 border border-white/20 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          {danger && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />}
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>
        <div className="text-sm text-zinc-300 space-y-2">{children}</div>
        {requireTyping && (
          <label className="grid gap-1.5 text-xs text-zinc-400">
            Type <strong className="text-white font-mono-code">{requireTyping}</strong> to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="px-3 py-2 text-sm bg-black border border-white/20 rounded-lg text-white" />
          </label>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className="px-4 py-2 text-xs text-zinc-200 border border-white/20 rounded-lg hover:border-white/50 cursor-pointer disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={blocked}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${danger ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-white text-black hover:bg-zinc-200'}`}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
