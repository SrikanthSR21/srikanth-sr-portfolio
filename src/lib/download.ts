// Real file download (no new tab). Used by every "Download CV / Resume" button.

const clickAnchor = (href: string, filename?: string) => {
  const a = document.createElement('a');
  a.href = href;
  if (filename) a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/** "Srikanth SR" + a CV link → "Srikanth_SR_Resume.pdf" (extension taken from the link, default .pdf) */
export function resumeFileName(name: string, url: string): string {
  const base = (name || 'Resume').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_') || 'Resume';
  const ext = (url.split(/[?#]/)[0].match(/\.([a-z0-9]{2,5})$/i)?.[1] ?? 'pdf').toLowerCase();
  return `${base}_Resume.${ext}`;
}

/**
 * Downloads `url` as `filename`.
 *  1) Files in your Supabase storage: the link gets `?download=<filename>`, which makes the server send it as an attachment,
 *     so the browser saves it instead of opening it. Works on every browser and keeps you on the page.
 *  2) Any other link: fetched and saved from memory; if that site blocks it (CORS), the browser is asked to download it directly.
 * Returns false only when nothing could be started.
 */
export async function downloadFile(url: string, filename: string): Promise<boolean> {
  try {
    const u = new URL(url, window.location.href);
    if (u.pathname.includes('/storage/v1/object/public/')) {
      u.searchParams.set('download', filename);
      clickAnchor(u.href);
      return true;
    }
    try {
      const res = await fetch(u.href, { mode: 'cors' });
      if (!res.ok) throw new Error(String(res.status));
      const blobUrl = URL.createObjectURL(await res.blob());
      clickAnchor(blobUrl, filename);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
      return true;
    } catch {
      clickAnchor(u.href, filename);
      return true;
    }
  } catch {
    return false;
  }
}
