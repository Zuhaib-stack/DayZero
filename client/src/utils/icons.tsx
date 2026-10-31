import React from 'react';
import {
  Flame,
  Dumbbell,
  BookOpen,
  Code,
  Brain,
  Heart,
  Trophy,
  Target,
  Zap,
  Sunrise,
  Moon,
  Shield,
  Coffee,
  CheckCircle2,
  Sparkles,
  Award,
  Gem,
  Crown,
  Compass,
  ShieldCheck,
  LucideIcon
} from 'lucide-react';

export const HABIT_ICONS: Record<string, LucideIcon> = {
  Flame,
  Dumbbell,
  BookOpen,
  Code,
  Brain,
  Heart,
  Trophy,
  Target,
  Zap,
  Sunrise,
  Moon,
  Shield,
  Coffee,
  CheckCircle2,
  Sparkles,
  Award,
  Gem,
  Crown,
  Compass,
  ShieldCheck
};

export const COLOR_OPTIONS = [
  { name: 'Purple', value: '#8b5cf6', bg: 'bg-purple-500', glow: 'shadow-purple-500/30' },
  { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500', glow: 'shadow-cyan-500/30' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500', glow: 'shadow-blue-500/30' },
  { name: 'Emerald', value: '#10b981', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/30' },
  { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-500', glow: 'shadow-amber-500/30' },
  { name: 'Rose', value: '#f43f5e', bg: 'bg-rose-500', glow: 'shadow-rose-500/30' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500', glow: 'shadow-indigo-500/30' },
  { name: 'Fuchsia', value: '#d946ef', bg: 'bg-fuchsia-500', glow: 'shadow-fuchsia-500/30' }
];

export const CATEGORY_OPTIONS = [
  'Fitness',
  'Coding & Dev',
  'Reading & Study',
  'Health & Wellness',
  'Mindset & Focus',
  'Writing & Journaling',
  'Productivity',
  'General'
];

export function getHabitIcon(iconName: string): LucideIcon {
  return HABIT_ICONS[iconName] || Flame;
}

