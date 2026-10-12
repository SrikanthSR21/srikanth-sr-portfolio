import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { supabase, BUCKET } from '../../lib/supabase';

export interface UploadMeta { hasAlpha: boolean; width: number; height: number }

/** True when any pixel of the (down-sampled) image is not fully opaque. */
function detectAlpha(bmp: ImageBitmap): boolean {
  const side = 256;
  const s = Math.min(1, side / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bmp.width * s));
  c.height = Math.max(1, Math.round(bmp.height * s));
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}

const MAX_SIDE = 1800;
const KEEP_ORIGINAL_UNDER = 4 * 1024 * 1024; // PNG/WebP up to 4 MB that already fit are uploaded byte-for-byte

/**
 * Prepare an image for upload.
 *  - PNG/WebP that are small enough are uploaded UNCHANGED (exact pixels, exact transparency).
 *  - Larger ones are resized and re-encoded: PNG when they have transparency, WebP otherwise.
 *  - Nothing with transparency is ever flattened or converted to JPEG.
 *  - JPEG photos are resized and re-encoded as WebP (smaller, no transparency to lose).
 */
export async function prepareImage(file: File): Promise<{ blob: Blob; meta: UploadMeta | null }> {
  const passthrough = ['image/svg+xml', 'image/gif'];
  if (!file.type.startsWith('image/') || passthrough.includes(file.type)) return { blob: file, meta: null };

  const bmp = await createImageBitmap(file);
  const alphaCapable = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/avif';
  const hasAlpha = alphaCapable && detectAlpha(bmp);
  const meta: UploadMeta = { hasAlpha, width: bmp.width, height: bmp.height };

  const fits = Math.max(bmp.width, bmp.height) <= MAX_SIDE;
  if ((file.type === 'image/png' || file.type === 'image/webp') && fits && file.size <= KEEP_ORIGINAL_UNDER) {
    bmp.close?.();
    return { blob: file, meta };
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height); // transparent, never filled
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();

  const type = hasAlpha ? 'image/png' : 'image/webp';
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? file), type, 0.88));
  // If the browser cannot encode the type it silently returns PNG: still lossless-with-alpha, so that is fine.
  return { blob: blob.type === 'image/jpeg' ? file : blob, meta };
}

const EXT: Record<string, string> = {
  'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif',
};

export async function uploadImage(file: Blob, folder: string, name = 'image'): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured');
  const clean = name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]/gi, '-').slice(0, 40);
  const ext = EXT[file.type] || file.type.split('/')[1] || 'bin';
  const path = `${folder}/${Date.now()}-${clean}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type, cacheControl: '31536000',
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

interface Props {
  value: string;
  /** Called with the new URL (typed or uploaded). `meta` is only set after an upload. */
  onChange: (url: string, meta?: UploadMeta | null) => void;
  folder?: string;
  /** Show a large preview (used for the About portrait) */
  large?: boolean;
}

export const ImageUploader: React.FC<Props> = ({ value, onChange, folder = 'misc', large = false }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');

  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true); setErr(''); setNote('');
    try {
      const { blob, meta } = await prepareImage(f);
      const url = await uploadImage(blob, folder, f.name);
      if (meta?.hasAlpha) setNote('Transparent background detected and preserved.');
      onChange(url, meta);
    } catch (e: any) { setErr(e.message || 'Upload failed'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };

  // Checkerboard shows transparency honestly; object-contain shows the whole image uncropped.
  const preview = (
    <div className={`checkerboard rounded-lg border border-white/15 overflow-hidden shrink-0 ${large ? 'w-40 h-52 sm:w-48 sm:h-60' : 'w-16 h-16'}`}>
      {value ? <img src={value} alt="Preview" className="w-full h-full object-contain" /> : null}
    </div>
  );

  return (
    <div className={`flex gap-3 ${large ? 'flex-col sm:flex-row sm:items-start' : 'items-center'}`}>
      {preview}
      <div className="flex-1 min-w-0 space-y-1.5">
        <input
          value={value} onChange={(e) => onChange(e.target.value, null)} placeholder="Image URL or upload →"
          aria-label="Image URL"
          className="w-full px-2.5 py-1.5 text-xs bg-black border border-white/15 rounded-lg text-white"
        />
        <button type="button" onClick={() => input.current?.click()} disabled={busy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-zinc-300 border border-white/15 rounded-lg hover:border-white/40 cursor-pointer disabled:opacity-60">
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {busy ? 'Uploading…' : 'Upload image'}
        </button>
        <div className="text-[10px] text-zinc-500">PNG, WebP or JPG. PNG/WebP transparency is kept as-is.</div>
        {note && <div className="text-[11px] text-emerald-400" role="status">{note}</div>}
        {err && <div className="text-[11px] text-red-400" role="alert">{err}</div>}
      </div>
      <input ref={input} type="file" accept="image/png,image/webp,image/jpeg,image/gif,image/svg+xml,image/avif" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
};
