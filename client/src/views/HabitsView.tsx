import React, { useState } from 'react';
import { ListTodo, Plus, Archive, Trash2, Edit2, Info, Flame, Target } from 'lucide-react';
import { Habit } from '../types/index.js';
import { getHabitIcon } from '../utils/icons.js';

interface HabitsViewProps {
  habits: Habit[];
  onOpenCreateHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onViewDetails: (habit: Habit) => void;
  onArchiveHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onOpenCreateHabit,
  onEditHabit,
  onViewDetails,
  onArchiveHabit,
  onDeleteHabit
}) => {
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredHabits = habits.filter(h => {
    if (tab === 'active' && h.is_archived) return false;
    if (tab === 'archived' && !h.is_archived) return false;
    if (selectedCategory !== 'all' && h.category !== selectedCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(habits.map(h => h.category)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ListTodo className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">My Habits</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Manage your daily commitments, configure custom checklists, and track independent progress.
          </p>
        </div>

        <button
          onClick={onOpenCreateHabit}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center space-x-2 self-start sm:self-auto transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Habit</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex rounded-xl bg-surface p-1 border border-surface-border">
          <button
            onClick={() => setTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'active' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Active Habits ({habits.filter(h => !h.is_archived).length})
          </button>
          <button
            onClick={() => setTab('archived')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'archived' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Archived ({habits.filter(h => h.is_archived).length})
          </button>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-surface text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-surface text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Habit Cards Grid */}
      {filteredHabits.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-surface border border-surface-border">
          <p className="text-sm font-semibold text-gray-300">No habits found</p>
          <p className="text-xs text-gray-500 mt-1">
            {tab === 'archived' ? 'No habits are currently archived.' : 'Start your discipline journey by creating a habit.'}
          </p>
          {tab === 'active' && (
            <button
              onClick={onOpenCreateHabit}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
            >
              Forge New Habit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHabits.map(habit => {
            const Icon = getHabitIcon(habit.icon);
            return (
              <div
                key={habit.id}
                className="p-5 rounded-2xl bg-surface border border-surface-border shadow-md flex flex-col justify-between hover:border-purple-500/30 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                        style={{
                          backgroundColor: `${habit.color}20`,
                          border: `1.5px solid ${habit.color}50`,
                          color: habit.color
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-lighter text-gray-400">
                          {habit.category}
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5">{habit.name}</h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-400 text-xs font-mono font-bold">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{habit.current_streak}d</span>
                    </div>
                  </div>

                  {habit.description && (
                    <p className="mt-2 text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {habit.description}
                    </p>
                  )}

                  <div className="mt-4 p-3 rounded-xl bg-surface-lighter/60 text-xs text-gray-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Journey:</span>
                      <span className="font-mono font-bold text-white">Day {habit.journey_day}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Personal Best:</span>
                      <span className="font-mono text-purple-300">{habit.longest_streak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Daily Checklist:</span>
                      <span>{habit.checklist?.length || 0} tasks</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-surface-border/80 flex items-center justify-between">
                  <button
                    onClick={() => onViewDetails(habit)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditHabit(habit)}
                      title="Edit Habit"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-lighter transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onArchiveHabit(habit.id)}
                      title={habit.is_archived ? 'Unarchive' : 'Archive'}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      title="Delete Habit"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

