import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { useColorMode } from '../lib/colorMode';

/** Public dark/light switch. Stores the visitor's choice in their own browser only. */
export const ThemeToggle: React.FC<{ className?: string; showLabel?: boolean }> = ({ className = '', showLabel = false }) => {
  const { settings } = useContent();
  const { mode, toggle } = useColorMode(settings.theme.defaultMode);
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`inline-flex items-center justify-center gap-2 h-10 min-w-10 px-2.5 rounded-full border border-white/20 text-zinc-300 hover:text-white hover:border-white/50 transition-colors cursor-pointer ${className}`}
    >
      {mode === 'dark' ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
      {showLabel && <span className="text-xs font-semibold uppercase tracking-wider">{mode === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
};
