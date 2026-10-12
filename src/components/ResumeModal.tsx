import React from 'react';
import { PortfolioInfo, ExperienceItem } from '../types';
import { X, Printer, Download, Mail, Phone, MapPin, Linkedin, Globe, CheckCircle } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  info: PortfolioInfo;
  workExperience: ExperienceItem[];
}

export const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  onClose,
  info,
  workExperience,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-zinc-950 border border-white/20 rounded-[24px] shadow-2xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-black border-b border-white/15 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              CURRICULUM VITAE (CV) PREVIEW
            </span>
            <span className="text-xs font-mono-code text-zinc-400">· Srikanth SR</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white text-black text-xs font-bold uppercase rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CV Document Container */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-grow bg-white text-black font-sans print:p-0 print:m-0">
          {/* Resume Header */}
          <div className="text-center pb-6 border-b-2 border-black">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-black">
              {info.realName}
            </h1>
            <div className="text-base sm:text-lg font-bold tracking-wider uppercase text-zinc-800 mt-1">
              {info.roleTitle}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-700 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {info.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {info.phone}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {info.email}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 text-xs text-zinc-600 font-medium">
              <span>LinkedIn: {info.linkedin}</span>
              <span>•</span>
              <span>Portfolio: {info.githubPortfolioUrl}</span>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="mt-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black border-b border-zinc-400 pb-1 mb-2">
              PROFILE SUMMARY
            </h2>
            <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed text-justify">
              {info.aboutBio}
            </p>
          </div>

          {/* Core Skills */}
          <div className="mt-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black border-b border-zinc-400 pb-1 mb-2">
              CORE SKILLS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-800">
              {info.skills.map((grp, i) => (
                <div key={i}>
                  <strong className="text-black font-semibold">{grp.category}:</strong>{' '}
                  <span>{grp.items.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Professional Experience */}
          <div className="mt-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black border-b border-zinc-400 pb-1 mb-3">
              PROFESSIONAL EXPERIENCE
            </h2>

            <div className="space-y-4">
              {workExperience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <div className="text-sm font-bold text-black">
                      {exp.role} <span className="font-normal text-zinc-700">| {exp.company}</span>
                    </div>
                    <div className="text-xs font-medium text-zinc-600 tabular-nums">
                      {exp.period}
                    </div>
                  </div>

                  <ul className="mt-1.5 list-disc list-inside space-y-1 text-xs text-zinc-800">
                    {exp.achievements.map((ach, idx) => (
                      <li key={idx} className="leading-snug">
                        {ach}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="mt-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black border-b border-zinc-400 pb-1 mb-2">
              EDUCATION
            </h2>
            <div className="space-y-2 text-xs text-zinc-800">
              {info.education.map((edu, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <div>
                    <strong className="text-black">{edu.degree}</strong> — {edu.institution}
                  </div>
                  <div className="text-zinc-600">{edu.year}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications & Additional Info */}
          <div className="mt-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-black border-b border-zinc-400 pb-1 mb-2">
              CERTIFICATIONS & ADDITIONAL INFORMATION
            </h2>
            <div className="space-y-1.5 text-xs text-zinc-800">
              {info.certifications.map((cert, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span>•</span>
                  <span>{cert}</span>
                </div>
              ))}
              <div className="flex items-start gap-1.5">
                <span>•</span>
                <span><strong>Languages:</strong> Tamil (Native), English (Communicative), Malayalam (Communicative)</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span>•</span>
                <span><strong>Relocation:</strong> Open to immediate relocation including United Arab Emirates (UAE)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
