import React, { useMemo, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { PortfolioInfo } from '../../types';
import { RecordsEditor, inputCls } from './RecordsEditor';
import { uploadImage } from './ImageUploader';
import { SaveBar } from './SaveBar';
import { useDraft, useSaver } from './AdminDirty';

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

type TextKey = 'personaName' | 'realName' | 'roleTitle' | 'location' | 'email' | 'phone' | 'whatsapp' | 'instagram' | 'linkedin' | 'githubPortfolioUrl' | 'resumeUrl';
const GROUPS: { title: string; fields: { key: TextKey; label: string; hint?: string }[] }[] = [
  { title: 'Hero', fields: [
    { key: 'personaName', label: 'Hero heading / brand name', hint: 'Big heading + navbar brand' },
    { key: 'realName', label: 'Real name', hint: 'Shown when visitors toggle the name in the hero' },
    { key: 'roleTitle', label: 'Hero sub-text', hint: 'e.g. CREATIVE DEVELOPER / ADS STRATEGIST' },
  ] },
  { title: 'Contact details', fields: [
    { key: 'location', label: 'Location' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'whatsapp', label: 'WhatsApp number', hint: 'With country code. Used for the WhatsApp button / fallback link' },
  ] },
  { title: 'Social links', fields: [
    { key: 'instagram', label: 'Instagram link', hint: 'https://instagram.com/yourname' },
    { key: 'linkedin', label: 'LinkedIn link', hint: 'linkedin.com/in/yourname' },
    { key: 'githubPortfolioUrl', label: 'Other portfolio / GitHub link' },
  ] },
];
const ALL_KEYS = GROUPS.flatMap((g) => g.fields.map((f) => f.key));

export const ProfileAdmin: React.FC = () => {
  const { settings, saveSetting } = useContent();
  const info = settings.info;
  const source = useMemo(() => ({
    ...(Object.fromEntries(ALL_KEYS.map((k) => [k, (info[k] as string) ?? ''])) as Record<TextKey, string>),
    aboutBio: info.aboutBio,
    certifications: info.certifications.join('\n'),
  }), [info]);
  const norm = (v: typeof source) => ({ ...v, certifications: v.certifications.split('\n').map((s) => s.trim()).filter(Boolean) });
  const { draft, setDraft, dirty, discard } = useDraft(source, norm);
  const { state, run } = useSaver();
  const [cvBusy, setCvBusy] = useState(false);
  const [cvMsg, setCvMsg] = useState('');

  // Always merge onto the latest saved info so skills/education edits are never overwritten.
  const mergeSave = (patch: Partial<PortfolioInfo>) => saveSetting('info', { ...settings.info, ...patch });

  const saveMain = () => run(() => mergeSave({
    ...(Object.fromEntries(ALL_KEYS.map((k) => [k, draft[k].trim()])) as Partial<PortfolioInfo>),
    aboutBio: draft.aboutBio,
    certifications: draft.certifications.split('\n').map((s) => s.trim()).filter(Boolean),
  }));

  const uploadCv = async (f?: File) => {
    if (!f) return;
    setCvBusy(true); setCvMsg('');
    try { const url = await uploadImage(f, 'resume', 'cv'); setDraft((d) => ({ ...d, resumeUrl: url })); setCvMsg('Uploaded. Press Save to publish it.'); }
    catch (e: any) { setCvMsg(e.message || 'Upload failed'); }
    finally { setCvBusy(false); }
  };

  const setF = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="space-y-8">
      <SaveBar title="Hero, contact & social" dirty={dirty} state={state} onSave={saveMain} onDiscard={discard} />

      {GROUPS.map((g) => (
        <fieldset key={g.title} className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-4">
          <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">{g.title}</legend>
          <div className="grid md:grid-cols-2 gap-4">
            {g.fields.map((f) => (
              <div key={f.key} className="grid gap-1.5 min-w-0 content-start">
                <label htmlFor={`p-${f.key}`} className="text-[10px] uppercase tracking-wider text-zinc-500">{f.label}</label>
                <input id={`p-${f.key}`} className={inputCls} value={draft[f.key]} onChange={setF(f.key)} />
                {f.hint && <span className="text-[10px] text-zinc-600">{f.hint}</span>}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-4">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">About</legend>
        <div className="grid gap-1.5">
          <label htmlFor="p-bio" className="text-[10px] uppercase tracking-wider text-zinc-500">About bio</label>
          <textarea id="p-bio" rows={6} className={inputCls} value={draft.aboutBio} onChange={setF('aboutBio')} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="p-cert" className="text-[10px] uppercase tracking-wider text-zinc-500">Certifications (one per line)</label>
          <textarea id="p-cert" rows={3} className={inputCls} value={draft.certifications} onChange={setF('certifications')} />
        </div>
      </fieldset>

      <fieldset className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 space-y-3">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">Resume / CV</legend>
        <p className="text-xs text-zinc-500">Upload a PDF, or paste a link, then press Save. When set, every “Resume” and “Download CV” button opens it. Leave empty to use the built-in printable CV.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label="CV link" className={`${inputCls} flex-1 min-w-[12rem]`} placeholder="https://… (PDF link)" value={draft.resumeUrl} onChange={setF('resumeUrl')} />
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-200 border border-white/20 rounded-lg hover:border-white/50 cursor-pointer">
            {cvBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload PDF
            <input type="file" accept="application/pdf" hidden onChange={(e) => uploadCv(e.target.files?.[0])} />
          </label>
          {draft.resumeUrl && <a href={draft.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-white underline">Preview</a>}
        </div>
        {cvMsg && <div role="status" className="text-xs text-zinc-300">{cvMsg}</div>}
      </fieldset>

      <RecordsEditor<{ id: string; category: string; items: string[] }>
        title="Skill groups"
        items={info.skills.map((s, i) => ({ id: `s${i}`, ...s }))}
        fields={[{ key: 'category', label: 'Category', type: 'text' }, { key: 'items', label: 'Skills (one per line)', type: 'lines' }]}
        titleKey="category" emptyText="No skill groups yet."
        blank={() => ({ id: uid('s'), category: 'New category', items: [] })}
        onSave={(rows) => mergeSave({ skills: rows.map(({ id, ...r }) => r) })} />

      <RecordsEditor<{ id: string; degree: string; institution: string; year: string }>
        title="Education"
        items={info.education.map((e, i) => ({ id: `e${i}`, ...e }))}
        fields={[{ key: 'degree', label: 'Degree', type: 'text' }, { key: 'institution', label: 'Institution', type: 'text' }, { key: 'year', label: 'Year', type: 'text' }]}
        titleKey="degree" emptyText="No education entries yet."
        blank={() => ({ id: uid('e'), degree: '', institution: '', year: '' })}
        onSave={(rows) => mergeSave({ education: rows.map(({ id, ...r }) => r) })} />
    </div>
  );
};
