import React, { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  Clock,
  Trophy,
  Plus,
  Quote,
  Sparkles,
  Target,
  AlertCircle
} from 'lucide-react';
import { Habit, DashboardStats } from '../types/index.js';
import { HabitCard } from '../components/HabitCard.js';
import { MidnightWarningBanner } from '../components/MidnightWarningBanner.js';
import { formatNiceDate } from '../utils/time.js';

interface DashboardViewProps {
  habits: Habit[];
  stats: DashboardStats | null;
  secondsRemaining: number;
  onCompleteHabit: (habitId: string, notes?: string) => Promise<void>;
  onToggleChecklist: (habitId: string, templateId: string, isCompleted: boolean) => Promise<void>;
  onOpenCreateHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onViewDetails: (habit: Habit) => void;
  onArchiveHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onNavigateToCheckpoints: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  habits,
  stats,
  secondsRemaining,
  onCompleteHabit,
  onToggleChecklist,
  onOpenCreateHabit,
  onEditHabit,
  onViewDetails,
  onArchiveHabit,
  onDeleteHabit,
  onNavigateToCheckpoints
}) => {
  const activeHabits = habits.filter(h => !h.is_archived);
  const completedTodayCount = activeHabits.filter(h => h.is_completed_today).length;
  const pendingCount = activeHabits.length - completedTodayCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Top Welcome & Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{stats?.userName || 'Warrior'}</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 font-mono">
            {stats?.today ? formatNiceDate(stats.today) : 'Today'}
          </p>
        </div>

        <button
          onClick={onOpenCreateHabit}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center space-x-2 self-start sm:self-auto transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Midnight Warning Banner */}
      <MidnightWarningBanner
        secondsRemaining={secondsRemaining}
        uncompletedCount={pendingCount}
        onNavigateToCheckpoints={onNavigateToCheckpoints}
      />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Habits */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Habits</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {activeHabits.length}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {completedTodayCount} completed today
          </p>
        </div>

        {/* Today's Completion Rate */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Discipline</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono mt-2">
            {stats?.overallPercentage || (activeHabits.length > 0 ? Math.round((completedTodayCount / activeHabits.length) * 100) : 0)}%
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {pendingCount === 0 && activeHabits.length > 0 ? 'All habits completed! Flawless.' : `${pendingCount} remaining today`}
          </p>
        </div>

        {/* Max Current Streak */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Streak</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-orange-300 font-mono mt-2">
            {stats?.maxCurrentStreak || 0} <span className="text-sm font-normal text-gray-400">days</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Longest active streak
          </p>
        </div>

        {/* Longest Streak Ever */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Best</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono mt-2">
            {stats?.longestStreakEver || 0} <span className="text-sm font-normal text-gray-400">days</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Historical record
          </p>
        </div>
      </div>

      {/* Motivational Quote Card */}
      {stats?.dailyQuote && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-surface to-surface border border-purple-500/20 shadow-md flex items-start space-x-4">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 flex-shrink-0">
            <Quote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-purple-100 italic leading-relaxed">
              "{stats.dailyQuote.text}"
            </p>
            <p className="text-[11px] text-gray-400 mt-1 font-mono uppercase tracking-wider">
              — {stats.dailyQuote.author}
            </p>
          </div>
        </div>
      )}

      {/* Habits Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Today's Habit Cards</h2>
            <p className="text-xs text-gray-400">Check off daily tasks and claim today's checkpoint.</p>
          </div>
          <span className="text-xs font-mono text-purple-400">
            {completedTodayCount} / {activeHabits.length} Done Today
          </span>
        </div>

        {activeHabits.length === 0 ? (
          <div className="py-16 px-4 rounded-3xl bg-surface border border-surface-border text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
              <Flame className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No habits forged yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Day 1 begins when you commit. Add your first habit and start building discipline today.
            </p>
            <button
              onClick={onOpenCreateHabit}
              className="mt-5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30"
            >
              Forge Your First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onComplete={onCompleteHabit}
                onToggleChecklist={onToggleChecklist}
                onEdit={onEditHabit}
                onViewDetails={onViewDetails}
                onArchive={onArchiveHabit}
                onDelete={onDeleteHabit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

