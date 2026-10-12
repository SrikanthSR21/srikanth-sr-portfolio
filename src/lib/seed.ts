import { uploadImage } from '../components/admin/ImageUploader';
import { AdCampaignItem, ProjectItem } from '../types';

/** Bundled (Vite-hashed) images can't be stored in the DB — they change on every deploy.
 *  This uploads them to Supabase Storage once and returns permanent URLs. */
async function toCloud(src: string | undefined, folder: string): Promise<string | undefined> {
  if (!src || /^https?:\/\//.test(src) && src.includes('/storage/v1/object/public/')) return src;
  const blob = await (await fetch(src)).blob();
  return uploadImage(blob, folder, src.split('/').pop() || 'seed');
}

export async function cloudifyProjects(items: ProjectItem[]): Promise<ProjectItem[]> {
  return Promise.all(items.map(async (p) => ({ ...p, heroImage: (await toCloud(p.heroImage, 'projects')) || '' })));
}
export async function cloudifyCampaigns(items: AdCampaignItem[]): Promise<AdCampaignItem[]> {
  return Promise.all(items.map(async (c) => ({ ...c, screenshotImage: await toCloud(c.screenshotImage, 'advertising') })));
}
export { toCloud };
