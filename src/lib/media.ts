// Media library core: upload, metadata, reference tracking, safe delete / replace.
//
// Source of truth for "does the file exist" = the Supabase Storage bucket itself.
// Metadata (category, alt text, dimensions, attribution, external images) lives in public.media_assets
// (migration-004). If that table has not been created yet everything still works from the bucket listing;
// only external-image records and extra metadata need the migration.

import { supabase, BUCKET } from './supabase';

export type MediaCategory = 'profile' | 'project' | 'advertising' | 'logo' | 'experience' | 'skill' | 'document' | 'other';
export const MEDIA_CATEGORIES: { id: MediaCategory; label: string; folder: string }[] = [
  { id: 'profile', label: 'Profile images', folder: 'profile' },
  { id: 'project', label: 'Project images', folder: 'projects' },
  { id: 'advertising', label: 'Advertising screenshots', folder: 'advertising' },
  { id: 'logo', label: 'Company logos', folder: 'logos' },
  { id: 'experience', label: 'Work experience', folder: 'experience' },
  { id: 'skill', label: 'Skill icons', folder: 'skills' },
  { id: 'document', label: 'Documents (CV)', folder: 'resume' },
  { id: 'other', label: 'Other media', folder: 'misc' },
];
export const categoryLabel = (c: MediaCategory) => MEDIA_CATEGORIES.find((m) => m.id === c)?.label ?? 'Other media';
export const folderForCategory = (c: MediaCategory) => MEDIA_CATEGORIES.find((m) => m.id === c)?.folder ?? 'misc';
export function categoryFromFolder(folderOrPath: string): MediaCategory {
  const top = folderOrPath.split('/')[0];
  return MEDIA_CATEGORIES.find((m) => m.folder === top)?.id ?? 'other';
}

export interface MediaAsset {
  id: string;
  source: 'upload' | 'external';
  url: string;
  storagePath?: string;
  filename: string;
  mime?: string;
  size?: number;
  width?: number;
  height?: number;
  hasAlpha?: boolean | null;
  category: MediaCategory;
  alt: string;
  sourceName?: string;
  sourceUrl?: string;
  license?: string;
  attribution?: string;
  createdAt?: string;
  /** A metadata row exists in media_assets */
  tracked: boolean;
  /** Metadata row exists but the file is gone from storage */
  missing?: boolean;
}

export class MediaError extends Error {}

export const formatBytes = (n?: number) => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
};

const isImageMime = (m?: string) => !!m && m.startsWith('image/');
export const isImageAsset = (a: MediaAsset) => (a.mime ? isImageMime(a.mime) : /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(a.filename)) || a.source === 'external';

// ------------------------------------------------------------------ image processing (moved from ImageUploader)

export interface UploadMeta { hasAlpha: boolean; width: number; height: number }

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
const KEEP_ORIGINAL_UNDER = 4 * 1024 * 1024;
export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/webp', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/avif'];

/**
 *  - PNG/WebP that already fit are uploaded UNCHANGED (exact pixels, exact transparency).
 *  - Larger ones are resized: PNG when they have transparency, WebP otherwise. Transparency is never flattened.
 *  - JPEG photos are resized and re-encoded as WebP.
 */
export async function prepareImage(file: File | Blob): Promise<{ blob: Blob; meta: UploadMeta | null }> {
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  const type = hasAlpha ? 'image/png' : 'image/webp';
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? file), type, 0.88));
  return { blob: blob.type === 'image/jpeg' ? file : blob, meta: { ...meta, width: canvas.width, height: canvas.height } };
}

const EXT: Record<string, string> = {
  'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif', 'application/pdf': 'pdf',
};

export const publicUrl = (path: string) => supabase!.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

function friendlyError(e: any): MediaError {
  const msg = String(e?.message ?? e ?? '');
  if (e instanceof MediaError) return e;
  if (/failed to fetch|network|load failed|timeout/i.test(msg) || (typeof navigator !== 'undefined' && navigator.onLine === false))
    return new MediaError('Network error: check your connection and try again. Nothing was changed.');
  if (/exceeded|too large|payload|413|quota/i.test(msg)) return new MediaError('The storage provider rejected the file as too large or over quota.');
  if (/row-level security|not authorized|unauthorized|403|jwt/i.test(msg)) return new MediaError('Not allowed: sign in as the admin and make sure migration / storage policies from schema.sql are applied.');
  if (/mime|type/i.test(msg) && /not supported|invalid/i.test(msg)) return new MediaError('The storage bucket does not accept this file type.');
  return new MediaError(msg || 'Unexpected error');
}

export function validateImageFile(file: File) {
  if (!file.size) throw new MediaError(`“${file.name}” is empty.`);
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new MediaError(`“${file.name}” is not a supported image (use PNG, JPG, WebP, GIF, AVIF or SVG).`);
  if (file.size > MAX_INPUT_BYTES) throw new MediaError(`“${file.name}” is ${formatBytes(file.size)}: the limit is ${formatBytes(MAX_INPUT_BYTES)}. Please compress it first.`);
}

const cleanName = (name: string) => name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').slice(0, 40) || 'image';

async function putObject(path: string, blob: Blob) {
  if (!supabase) throw new MediaError('Supabase is not configured.');
  const attempt = () => supabase!.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
  let { error } = await attempt();
  // one automatic retry for transient network failures (the path is unique, so a retry can never overwrite anything)
  if (error && /failed to fetch|network|load failed/i.test(error.message)) ({ error } = await attempt());
  if (error) throw friendlyError(error);
}

/** Legacy helper kept for existing callers (seed, CV upload). Returns the public URL; metadata is registered best-effort. */
export async function uploadImage(file: Blob, folder: string, name = 'image'): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured');
  const ext = EXT[file.type] || file.type.split('/')[1] || 'bin';
  const path = `${folder}/${Date.now()}-${cleanName(name)}.${ext}`;
  await putObject(path, file);
  const url = publicUrl(path);
  void registerRow({
    id: crypto.randomUUID(), source: 'upload', url, storagePath: path, filename: path.split('/').pop()!, mime: file.type, size: file.size,
    category: categoryFromFolder(folder), alt: '', tracked: true,
  }).catch(() => { /* table may not exist yet */ });
  return url;
}

/** Validates, optimises, uploads and registers an image. Throws a MediaError with a readable message. */
export async function uploadAsset(file: File, opts: { category: MediaCategory; alt?: string }): Promise<{ asset: MediaAsset; meta: UploadMeta | null }> {
  validateImageFile(file);
  let prepared;
  try { prepared = await prepareImage(file); }
  catch { throw new MediaError(`“${file.name}” could not be read as an image (corrupt or unsupported file).`); }
  const { blob, meta } = prepared;
  const ext = EXT[blob.type] || 'bin';
  const path = `${folderForCategory(opts.category)}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${cleanName(file.name)}.${ext}`;
  await putObject(path, blob);
  const asset: MediaAsset = {
    id: crypto.randomUUID(), source: 'upload', url: publicUrl(path), storagePath: path, filename: path.split('/').pop()!, mime: blob.type, size: blob.size,
    width: meta?.width, height: meta?.height, hasAlpha: meta ? meta.hasAlpha : null, category: opts.category, alt: opts.alt ?? '', createdAt: new Date().toISOString(), tracked: false,
  };
  try { await registerRow(asset); asset.tracked = true; } catch { /* migration not applied: the file is still uploaded and usable */ }
  return { asset, meta };
}

// ------------------------------------------------------------------ metadata table

export const isTableMissing = (e: any) =>
  !!e && (e.code === 'PGRST205' || e.code === '42P01' || /media_assets/.test(String(e.message)) && /(not find|does not exist|schema cache)/i.test(String(e.message)));

const toRow = (a: MediaAsset) => ({
  id: a.id, source: a.source, url: a.url, storage_path: a.storagePath ?? null, filename: a.filename, mime_type: a.mime ?? null,
  size_bytes: a.size ?? null, width: a.width ?? null, height: a.height ?? null, has_alpha: a.hasAlpha ?? null, category: a.category, alt_text: a.alt || null,
  source_name: a.sourceName || null, source_url: a.sourceUrl || null, license: a.license || null, attribution: a.attribution || null, updated_at: new Date().toISOString(),
});
const fromRow = (r: any): MediaAsset => ({
  id: r.id, source: r.source, url: r.url, storagePath: r.storage_path ?? undefined, filename: r.filename, mime: r.mime_type ?? undefined,
  size: r.size_bytes != null ? Number(r.size_bytes) : undefined, width: r.width ?? undefined, height: r.height ?? undefined, hasAlpha: r.has_alpha,
  category: (MEDIA_CATEGORIES.some((m) => m.id === r.category) ? r.category : 'other') as MediaCategory, alt: r.alt_text ?? '',
  sourceName: r.source_name ?? undefined, sourceUrl: r.source_url ?? undefined, license: r.license ?? undefined, attribution: r.attribution ?? undefined,
  createdAt: r.created_at, tracked: true,
});

async function registerRow(a: MediaAsset) {
  if (!supabase) throw new MediaError('Supabase is not configured.');
  const q = a.storagePath
    ? supabase.from('media_assets').upsert(toRow(a), { onConflict: 'storage_path' })
    : supabase.from('media_assets').upsert(toRow(a), { onConflict: 'id' });
  const { error } = await q;
  if (error) throw error;
}

/** Save edited metadata. Creates the row for files that were uploaded before the media table existed. */
export async function saveAssetMeta(a: MediaAsset, patch: Partial<Pick<MediaAsset, 'alt' | 'category' | 'sourceName' | 'sourceUrl' | 'license' | 'attribution' | 'width' | 'height' | 'filename'>>): Promise<MediaAsset> {
  const next = { ...a, ...patch, tracked: true };
  try { await registerRow(next); } catch (e: any) {
    if (isTableMissing(e)) throw new MediaError('Run supabase/migration-004-media-skills-typography.sql first to store media details.');
    throw friendlyError(e);
  }
  return next;
}

function probeImage(url: string, timeoutMs = 10000): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => { img.src = ''; reject(new MediaError('The image took too long to load.')); }, timeoutMs);
    img.onload = () => { clearTimeout(timer); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { clearTimeout(timer); reject(new MediaError('That URL did not load as an image. Check the link (it must be a direct image URL).')); };
    img.referrerPolicy = 'no-referrer';
    img.src = url;
  });
}

export interface ExternalInput { url: string; alt?: string; category: MediaCategory; sourceName?: string; sourceUrl?: string; license?: string; attribution?: string }

/** Saves a link to an externally hosted image. Nothing is downloaded or copied: the file stays on the other host. */
export async function addExternalAsset(inp: ExternalInput): Promise<MediaAsset> {
  let u: URL;
  try { u = new URL(inp.url.trim()); } catch { throw new MediaError('Please enter a full image URL starting with https://'); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new MediaError('Only http(s) image URLs are allowed.');
  const dims = await probeImage(u.toString());
  const asset: MediaAsset = {
    id: crypto.randomUUID(), source: 'external', url: u.toString(), filename: decodeURIComponent(u.pathname.split('/').pop() || u.hostname).slice(0, 120) || u.hostname,
    width: dims.width, height: dims.height, category: inp.category, alt: inp.alt ?? '', sourceName: inp.sourceName, sourceUrl: inp.sourceUrl,
    license: inp.license, attribution: inp.attribution, createdAt: new Date().toISOString(), tracked: true,
  };
  try {
    const { data: existing } = await supabase!.from('media_assets').select('id').eq('url', asset.url).eq('source', 'external').maybeSingle();
    if (existing) throw new MediaError('That image URL is already in your library.');
    await registerRow(asset);
  } catch (e: any) {
    if (e instanceof MediaError) throw e;
    if (isTableMissing(e)) throw new MediaError('External images need the media table: run supabase/migration-004-media-skills-typography.sql once.');
    throw friendlyError(e);
  }
  return asset;
}

// ------------------------------------------------------------------ listing

interface StorageObj { path: string; size?: number; mime?: string; createdAt?: string }

async function listFolder(prefix: string, out: StorageObj[], depth = 0): Promise<void> {
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase!.storage.from(BUCKET).list(prefix, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw error;
    if (!data?.length) return;
    for (const e of data) {
      const path = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.id === null || e.id === undefined) { if (depth < 4) await listFolder(path, out, depth + 1); }
      else if (e.name !== '.emptyFolderPlaceholder') out.push({ path, size: (e.metadata as any)?.size, mime: (e.metadata as any)?.mimetype, createdAt: e.created_at ?? undefined });
    }
    if (data.length < 100) return;
    offset += 100;
  }
}

export interface LibraryResult { assets: MediaAsset[]; tableMissing: boolean }

export async function loadLibrary(): Promise<LibraryResult> {
  if (!supabase) throw new MediaError('Supabase is not configured.');
  const files: StorageObj[] = [];
  try { await listFolder('', files); } catch (e: any) { throw friendlyError(e); }

  let rows: MediaAsset[] = [];
  let tableMissing = false;
  const { data, error } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false }).limit(5000);
  if (error) { if (isTableMissing(error)) tableMissing = true; else throw friendlyError(error); }
  else rows = (data ?? []).map(fromRow);

  const byPath = new Map(rows.filter((r) => r.storagePath).map((r) => [r.storagePath!, r]));
  const seen = new Set<string>();
  const assets: MediaAsset[] = [];

  for (const f of files) {
    seen.add(f.path);
    const row = byPath.get(f.path);
    const filename = f.path.split('/').pop()!;
    if (row) assets.push({ ...row, size: f.size ?? row.size, mime: f.mime ?? row.mime, createdAt: row.createdAt ?? f.createdAt, url: publicUrl(f.path) });
    else assets.push({
      id: `path:${f.path}`, source: 'upload', url: publicUrl(f.path), storagePath: f.path, filename, mime: f.mime, size: f.size,
      category: /\.pdf$/i.test(filename) ? 'document' : categoryFromFolder(f.path), alt: '', createdAt: f.createdAt, tracked: false,
    });
  }
  for (const r of rows) {
    if (r.source === 'external') assets.push(r);
    else if (r.storagePath && !seen.has(r.storagePath)) assets.push({ ...r, missing: true });
  }
  assets.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
  return { assets, tableMissing };
}

// ------------------------------------------------------------------ references (where is each asset used?)

export interface MediaRef { area: string; label: string; field: string }

const BUCKET_MARK = `/object/public/${BUCKET}/`;
/** Normalised identity of an image URL: uploaded files are matched by storage path (host-independent), others by full URL. */
export function assetKeyFromUrl(value: string): string {
  const i = value.indexOf(BUCKET_MARK);
  if (i >= 0) { try { return 'path:' + decodeURIComponent(value.slice(i + BUCKET_MARK.length).split(/[?#]/)[0]); } catch { /* fall through */ } }
  return 'url:' + value.trim();
}
export const assetKey = (a: MediaAsset) => (a.source === 'upload' && a.storagePath ? 'path:' + a.storagePath : assetKeyFromUrl(a.url));

const AREA_NAMES: Record<string, string> = {
  info: 'Profile & contact', images: 'About portrait', skills: 'Skills', theme: 'Theme', clients: 'Brand ticker', nav: 'Navigation', texts: 'Texts',
  projects: 'Project', ad_campaigns: 'Advertising campaign', experience: 'Work experience',
};
const FIELD_NAMES: Record<string, string> = {
  heroImage: 'preview image', screenshotImage: 'screenshot', image: 'image', logo: 'logo', 'branding.frameLogo': 'CYBERBIX emblem', profile: 'portrait', resumeUrl: 'CV file', icon: 'icon',
};

export type ContentSnapshot = Record<string, unknown>; // e.g. { info, images, skills, projects, ad_campaigns, experience, … }

/** One pass over all saved content: map<assetKey, where it is used>. Only exact image URLs count as references. */
export function collectReferences(content: ContentSnapshot): Map<string, MediaRef[]> {
  const map = new Map<string, MediaRef[]>();
  const add = (value: string, area: string, label: string, field: string) => {
    if (!/^https?:\/\//i.test(value)) return;
    const k = assetKeyFromUrl(value);
    const list = map.get(k) ?? [];
    if (!list.some((r) => r.area === area && r.label === label && r.field === field)) list.push({ area, label, field: FIELD_NAMES[field] ?? field });
    map.set(k, list);
  };
  const walk = (v: unknown, area: string, label: string, field: string) => {
    if (typeof v === 'string') return add(v, area, label, field);
    if (Array.isArray(v)) return v.forEach((x) => walk(x, area, label, field));
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const own = [o.title, o.company, o.name, o.role, o.category].find((x) => typeof x === 'string' && x.trim()) as string | undefined;
      for (const [k, x] of Object.entries(o)) walk(x, area, own ?? label, k);
    }
  };
  for (const [key, value] of Object.entries(content)) {
    if (key === 'theme') continue;
    if (key === 'texts') { // only the CYBERBIX emblem is an image; every other text is plain words
      const logo = (value as Record<string, unknown> | undefined)?.['branding.frameLogo'];
      if (typeof logo === 'string') add(logo, 'Brand ticker', 'CYBERBIX frame', 'branding.frameLogo');
      continue;
    }
    walk(value, AREA_NAMES[key] ?? key, '', key);
  }
  return map;
}

/** Replaces every occurrence of an asset's URL in `value`. Returns the new value and whether anything changed. */
function replaceIn(value: any, fromKey: string, toUrl: string): [any, boolean] {
  if (typeof value === 'string') return /^https?:\/\//i.test(value) && assetKeyFromUrl(value) === fromKey ? [toUrl, true] : [value, false];
  if (Array.isArray(value)) {
    let changed = false;
    const out = value.map((x) => { const [n, c] = replaceIn(x, fromKey, toUrl); changed ||= c; return n; });
    return [changed ? out : value, changed];
  }
  if (value && typeof value === 'object') {
    let changed = false;
    const out: Record<string, any> = {};
    for (const [k, x] of Object.entries(value)) { const [n, c] = replaceIn(x, fromKey, toUrl); changed ||= c; out[k] = n; }
    return [changed ? out : value, changed];
  }
  return [value, false];
}
export { replaceIn as replaceAssetUrl };

// ------------------------------------------------------------------ delete

export interface DeleteResult { deleted: string[]; failed: { asset: MediaAsset; reason: string }[] }

export async function deleteAssets(assets: MediaAsset[]): Promise<DeleteResult> {
  if (!supabase) throw new MediaError('Supabase is not configured.');
  const result: DeleteResult = { deleted: [], failed: [] };
  const files = assets.filter((a) => a.source === 'upload' && a.storagePath && !a.missing);

  // 1) storage objects first, in small batches so one failure cannot take everything down
  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50);
    const { error } = await supabase.storage.from(BUCKET).remove(batch.map((a) => a.storagePath!));
    if (error) batch.forEach((a) => result.failed.push({ asset: a, reason: friendlyError(error).message }));
    else batch.forEach((a) => result.deleted.push(a.id));
  }
  // 2) external links and "missing file" records have nothing in storage: they are just records
  assets.filter((a) => a.source === 'external' || a.missing).forEach((a) => result.deleted.push(a.id));

  // 3) metadata rows (best effort; table may not exist)
  const okAssets = assets.filter((a) => result.deleted.includes(a.id));
  const paths = okAssets.map((a) => a.storagePath).filter(Boolean) as string[];
  const ids = okAssets.filter((a) => a.source === 'external' || a.missing).map((a) => a.id).filter((id) => !id.startsWith('path:'));
  try {
    if (paths.length) await supabase.from('media_assets').delete().in('storage_path', paths);
    if (ids.length) await supabase.from('media_assets').delete().in('id', ids);
  } catch { /* ignore */ }
  return result;
}
