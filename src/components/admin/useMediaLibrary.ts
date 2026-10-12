import { useCallback, useEffect, useMemo, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import { assetKey, collectReferences, loadLibrary, MediaAsset, MediaRef } from '../../lib/media';

/** Loads the library (storage listing + metadata) and works out where every asset is used in the saved content. */
export function useMediaLibrary(enabled = true) {
  const { settings, collections } = useContent();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableMissing, setTableMissing] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await loadLibrary();
      setAssets(r.assets); setTableMissing(r.tableMissing);
    } catch (e: any) { setError(e?.message || 'Could not load the media library.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (enabled) reload(); }, [enabled, reload]);

  const refs = useMemo(() => collectReferences({ ...settings, ...collections } as any), [settings, collections]);
  const usage = useCallback((a: MediaAsset): MediaRef[] => refs.get(assetKey(a)) ?? [], [refs]);

  return { assets, setAssets, loading, error, tableMissing, reload, usage };
}
