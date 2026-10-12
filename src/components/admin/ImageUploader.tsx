import React, { useRef, useState } from 'react';
import { Upload, Loader2, Images, Trash2 } from 'lucide-react';
import { categoryFromFolder, MediaError, uploadAsset } from '../../lib/media';
import type { UploadMeta } from '../../lib/media';
import { MediaPickerDialog } from './MediaLibrary';

// Kept for existing imports (seed, profile admin): the implementation now lives in lib/media.ts
export { prepareImage, uploadImage } from '../../lib/media';
export type { UploadMeta } from '../../lib/media';

interface Props {
  value: string;
  /** Called with the new URL (typed, uploaded or picked from the library). `meta` is set after an upload / library pick; width/height 0 = unknown. */
  onChange: (url: string, meta?: UploadMeta | null) => void;
  folder?: string;
  /** Show a large preview (used for the About portrait) */
  large?: boolean;
  /** Show a Remove button (for optional images) */
  allowClear?: boolean;
}

export const ImageUploader: React.FC<Props> = ({ value, onChange, folder = 'misc', large = false, allowClear = false }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [broken, setBroken] = useState(false);

  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true); setErr(''); setNote('');
    try {
      const { asset, meta } = await uploadAsset(f, { category: categoryFromFolder(folder) });
      if (meta?.hasAlpha) setNote('Transparent background detected and preserved.');
      if (!asset.tracked) setNote((n) => n || 'Uploaded. (Run migration-004 to also list it with details in the Media Library.)');
      setBroken(false);
      onChange(asset.url, meta);
    } catch (e: any) { setErr(e instanceof MediaError ? e.message : e?.message || 'Upload failed'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };

  // Checkerboard shows transparency honestly; object-contain shows the whole image uncropped.
  const preview = (
    <div className={`checkerboard rounded-lg border border-white/15 overflow-hidden shrink-0 relative ${large ? 'w-40 h-52 sm:w-48 sm:h-60' : 'w-16 h-16'}`}>
      {value && !broken ? <img src={value} alt="Preview" className="w-full h-full object-contain" onError={() => setBroken(true)} onLoad={() => setBroken(false)} /> : null}
      {value && broken && <span className="absolute inset-0 flex items-center justify-center text-center text-[10px] leading-tight bg-zinc-900 text-red-300 p-1">Image not found</span>}
    </div>
  );
  const btn = 'flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-zinc-300 border border-white/15 rounded-lg hover:border-white/40 cursor-pointer disabled:opacity-60';

  return (
    <div className={`flex gap-3 ${large ? 'flex-col sm:flex-row sm:items-start' : 'items-center'}`}>
      {preview}
      <div className="flex-1 min-w-0 space-y-1.5">
        <input
          value={value} onChange={(e) => { setBroken(false); onChange(e.target.value, null); }} placeholder="Image URL, upload, or pick from the library →"
          aria-label="Image URL"
          className="w-full px-2.5 py-1.5 text-xs bg-black border border-white/15 rounded-lg text-white"
        />
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className={btn}>
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
          </button>
          <button type="button" onClick={() => setPickerOpen(true)} disabled={busy} className={btn}><Images className="w-3 h-3" /> Media Library</button>
          {allowClear && value && (
            <button type="button" onClick={() => { setErr(''); setNote(''); setBroken(false); onChange('', null); }} className={`${btn} hover:!border-red-400/60 hover:text-red-300`}>
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
        <div className="text-[10px] text-zinc-500">PNG, WebP, JPG, GIF, AVIF or SVG up to 15 MB. PNG/WebP transparency is kept as-is.</div>
        {note && <div className="text-[11px] text-emerald-400" role="status">{note}</div>}
        {err && <div className="text-[11px] text-red-400" role="alert">{err}</div>}
      </div>
      <input ref={input} type="file" accept="image/png,image/webp,image/jpeg,image/gif,image/svg+xml,image/avif" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {pickerOpen && (
        <MediaPickerDialog
          defaultCategory={categoryFromFolder(folder)}
          onClose={() => setPickerOpen(false)}
          onSelect={(a) => { setPickerOpen(false); setBroken(false); setErr(''); onChange(a.url, { hasAlpha: a.hasAlpha ?? false, width: a.width ?? 0, height: a.height ?? 0 }); }}
        />
      )}
    </div>
  );
};
