import { useEffect, useId, useRef, useState } from 'react';

// Tiny module-level registry of editors that currently hold unsaved changes.
// AdminPage uses it to warn before switching tabs / closing the browser tab, so edits are never lost silently.
const dirtyKeys = new Set<string>();
export const hasUnsavedChanges = () => dirtyKeys.size > 0;

export function useDirtyFlag(dirty: boolean) {
  const key = useId();
  useEffect(() => {
    if (dirty) dirtyKeys.add(key); else dirtyKeys.delete(key);
    return () => { dirtyKeys.delete(key); };
  }, [dirty, key]);
}

/**
 * Editable copy of server data.
 *  - Starts from `source`, and re-syncs when `source` changes (data arriving late, realtime updates, after a save)
 *    ONLY if you have no unsaved edits, so it can never overwrite what you are typing.
 *  - `normalize` strips cosmetic differences (blank lines etc.) before comparing.
 *  - Registers its dirty state globally (see above).
 */
export function useDraft<T>(source: T, normalize: (v: T) => unknown = (v) => v) {
  const [draft, setDraft] = useState<T>(source);
  const base = useRef<T>(source);
  const sourceKey = JSON.stringify(normalize(source));

  useEffect(() => {
    const d = JSON.stringify(normalize(draft));
    if (d === JSON.stringify(normalize(base.current)) || d === sourceKey) {
      base.current = source;
      setDraft(source);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  const dirty = JSON.stringify(normalize(draft)) !== JSON.stringify(normalize(base.current));
  useDirtyFlag(dirty);
  const discard = () => setDraft(base.current);
  return { draft, setDraft, dirty, discard };
}

export type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string };

/** Wraps an async save with consistent status handling. */
export function useSaver() {
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = async (fn: () => Promise<void>) => {
    clearTimeout(timer.current);
    setState({ kind: 'saving' });
    try {
      await fn();
      setState({ kind: 'saved' });
      timer.current = setTimeout(() => setState({ kind: 'idle' }), 3000);
      return true;
    } catch (e: any) {
      setState({ kind: 'error', message: e?.message || 'Save failed' });
      return false;
    }
  };
  return { state, run };
}
