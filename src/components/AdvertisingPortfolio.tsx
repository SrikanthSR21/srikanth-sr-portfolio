import { useContent } from '../context/ContentContext';
import React, { useState } from 'react';
import { AdCampaignItem, FontPairOption } from '../types';
import { TrendingUp, BarChart3, CheckCircle2 } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { useToneAttrs } from '../lib/tone';

interface AdvertisingPortfolioProps {
  campaigns: AdCampaignItem[];
  fontPair: FontPairOption;
}

export const AdvertisingPortfolio: React.FC<AdvertisingPortfolioProps> = ({
  campaigns,
  fontPair,
}) => {
  const tone = useToneAttrs('advertising');
  const { t } = useContent();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const shown = campaigns.filter((c) => c.visible !== false);
  // Original chips stay; any new work type you add in the admin (e.g. "Social Media") gets its own chip automatically.
  const BASE_FILTERS = ['All', 'Meta Ads', 'Google Ads', 'SEO'];
  const extra = Array.from(new Set(shown.map((c) => c.platform).filter(Boolean)))
    .filter((p) => !BASE_FILTERS.some((b) => b !== 'All' && p.includes(b)));
  const filters = [...BASE_FILTERS, ...extra];
  const activeFilter = filters.includes(selectedFilter) ? selectedFilter : 'All';

  const filteredCampaigns =
    activeFilter === 'All' ? shown : shown.filter((c) => c.platform.includes(activeFilter));

  return (
    <section id="advertising" {...tone} className="py-16 sm:py-24 px-5 sm:px-6 border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto">
        <SectionHeading id="advertising" eyebrow={t('ads.eyebrow')} title={t('ads.title')} subtitle={t('ads.subtitle')} fontPair={fontPair} className="mb-10 sm:mb-12"
          aside={(
          <div role="group" aria-label="Filter work by type" className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-white/15 overflow-x-auto max-w-full">
            {filters.map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setSelectedFilter(filterKey)}
                aria-pressed={activeFilter === filterKey}
                className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === filterKey
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
          )} />

        {/* Adaptive Cards Grid (Scenario A with Screenshot vs Scenario B purely White Text on Black) */}
        {filteredCampaigns.length === 0 && <p className="text-sm font-mono-code text-zinc-500">No work to show for this filter yet.</p>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {filteredCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="group relative flex flex-col justify-between min-w-0 rounded-[var(--radius-card,20px)] bg-black border border-white/15 overflow-hidden transition-all duration-300 hover:border-white hover:scale-[1.01] hover:shadow-[0_0_30px_rgb(var(--fg-rgb)/0.14)]"
            >
              {/* SCENARIO A: Screenshot Available */}
              {camp.hasScreenshot && camp.screenshotImage ? (
                <>
                  {/* Clean borderless container displaying high-quality colorful dashboard screenshot */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950 border-b border-white/10">
                    <img
                      src={camp.screenshotImage}
                      alt={camp.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-4 left-4 right-4">
                      <span className="inline-block max-w-full truncate text-[11px] font-mono-code px-2.5 py-1 bg-black/85 text-white rounded-lg border border-white/20 backdrop-blur-md">
                        {camp.platform} · Verified Live Data
                      </span>
                    </div>
                  </div>

                  {/* Text below screenshot */}
                  <div className="p-5 sm:p-8 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="text-xs font-mono-code text-zinc-400 uppercase tracking-widest mb-1.5">
                        {camp.clientBrand}
                      </div>
                      <h3
                        className={`card-heading text-xl sm:text-2xl font-bold text-white uppercase tracking-tight mb-2 break-words ${fontPair.headlineClass}`}
                      >
                        {camp.title}
                      </h3>
                      <div className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-white shrink-0" />
                        <span>{camp.metricHeadline}</span>
                      </div>
                      <p className="tx-body text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6 break-words">
                        {camp.summary}
                      </p>
                    </div>

                    {/* Key Stats Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-white/10">
                      {camp.keyStats.map((stat, sIdx) => (
                        <div key={sIdx} className="bg-zinc-950/80 p-2.5 rounded-xl border border-white/10 text-center">
                          <div className="text-sm sm:text-base font-bold text-white tabular-nums">
                            {stat.value}
                          </div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* SCENARIO B: No Screenshot (Pure White Text on Matte Black, Bold Typographic Stat Layout) */
                <div className="p-5 sm:p-10 flex flex-col justify-between flex-grow sm:min-h-[380px] bg-gradient-to-b from-zinc-950 to-black">
                  <div>
                    {/* Header badge / kicker */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                      <span className="text-xs font-mono-code px-3 py-1 bg-white/10 text-white rounded-lg border border-white/20">
                        {camp.platform} · High-Density Architecture
                      </span>
                      <span className="text-xs font-mono-code text-zinc-500">
                        {camp.clientBrand}
                      </span>
                    </div>

                    <h3
                      className={`card-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white uppercase tracking-tight mb-4 break-words ${fontPair.headlineClass}`}
                    >
                      {camp.title}
                    </h3>

                    {/* Large Bold Stat Showcase */}
                    <div className="my-6 p-5 rounded-2xl bg-white/5 border border-white/15">
                      <div className="text-xs font-mono-code text-zinc-400 uppercase tracking-wider mb-1">
                        Quantified Performance Breakthrough
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-white break-words">
                        {camp.metricHeadline}
                      </div>
                    </div>

                    <p className="tx-body text-sm text-zinc-300 leading-relaxed mb-6">
                      {camp.summary}
                    </p>

                    {/* Bullet Highlights */}
                    <div className="space-y-2 mb-8">
                      {camp.achievements.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantitative Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/15">
                    {camp.keyStats.map((stat, sIdx) => (
                      <div key={sIdx} className="text-left">
                        <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums tracking-tight">
                          {stat.value}
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
