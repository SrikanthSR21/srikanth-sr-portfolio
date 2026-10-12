import React from 'react';
import {
  Megaphone, Search, BarChart3, Palette, PenTool, Code, Globe, Wrench, Target, TrendingUp, Layers, Camera, Image as ImageIcon,
  Film, Mail, Share2, Smartphone, Monitor, Database, Cpu, Zap, Sparkles, Brush, Type, LayoutDashboard, ShoppingCart, MessageSquare,
  Users, FileText, Lightbulb, Rocket, Package, Hash, Star, CheckCircle2,
} from 'lucide-react';

type Ico = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
/** Curated icon set: the admin stores only the key, so arbitrary component names can never be injected. */
export const SKILL_ICONS: Record<string, Ico> = {
  Megaphone, Search, BarChart3, Palette, PenTool, Code, Globe, Wrench, Target, TrendingUp, Layers, Camera, Image: ImageIcon, Film, Mail, Share2,
  Smartphone, Monitor, Database, Cpu, Zap, Sparkles, Brush, Type, LayoutDashboard, ShoppingCart, MessageSquare, Users, FileText, Lightbulb, Rocket,
  Package, Hash, Star, CheckCircle2,
};

/** icon = curated key | https image URL | emoji / short text. Falls back to `fallback` (a curated key) or a check mark. */
export const SkillIcon: React.FC<{ icon?: string; fallback?: string; className?: string }> = ({ icon, fallback, className = 'w-4 h-4' }) => {
  const v = (icon ?? '').trim();
  if (v && SKILL_ICONS[v]) { const C = SKILL_ICONS[v]; return <C className={className} aria-hidden="true" />; }
  if (/^https?:\/\//i.test(v)) return <img src={v} alt="" loading="lazy" decoding="async" className={`${className} object-contain`} />;
  if (v) return <span aria-hidden="true" className="leading-none text-[1.1em] select-none">{v.slice(0, 4)}</span>;
  const F = (fallback && SKILL_ICONS[fallback]) || CheckCircle2;
  return <F className={className} aria-hidden="true" />;
};
