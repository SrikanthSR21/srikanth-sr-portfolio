import React from 'react';
import type { HeroMetric } from '../lib/defaults';
import type { MetricCardSettings } from '../lib/typography';

interface Props {
  metrics: HeroMetric[];
  settings: MetricCardSettings;
  className?: string;
}

/** The four headline numbers under the hero buttons, as floating cards.
 *  Look and motion come from index.css (.mc-*) and the colours follow the dark / light theme variables. */
export const MetricCards: React.FC<Props> = ({ metrics, settings, className = '' }) => (
  <div
    className={`mc-grid grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 text-center w-full max-w-4xl ${className}`}
    data-mc-style={settings.style}
    data-mc-enter={settings.entrance}
    data-mc-float={settings.float ? 'on' : 'off'}
    data-mc-hover={settings.hover ? 'on' : 'off'}
  >
    {metrics.map((m, i) => (
      <div key={m.id} className="mc-card" style={{ ['--i' as string]: i } as React.CSSProperties}>
        <div className="tx-metricValue text-2xl sm:text-3xl font-extrabold text-white tabular-nums break-words">{m.value}</div>
        <div className="tx-metricLabel text-[11px] sm:text-xs text-zinc-400 uppercase tracking-wider mt-1.5 break-words">{m.label}</div>
      </div>
    ))}
  </div>
);
