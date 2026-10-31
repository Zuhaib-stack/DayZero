import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Flame,
  CheckCircle2,
  Lock,
  Check,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Habit } from '../types/index.js';
import { getHabitIcon } from '../utils/icons.js';
import { soundEffects } from '../utils/sound.js';
import { formatCountdown } from '../utils/time.js';

interface CheckpointsViewProps {
  habits: Habit[];
  secondsRemaining: number;
  onCompleteHabit: (habitId: string, notes?: string) => Promise<void>;
  onToggleChecklist: (habitId: string, templateId: string, isCompleted: boolean) => Promise<void>;
}

export const CheckpointsView: React.FC<CheckpointsViewProps> = ({
  habits,
  secondsRemaining,
  onCompleteHabit,
  onToggleChecklist
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [completingId, setCompletingId] = useState<string | null>(null);

  const activeHabits = habits.filter(h => !h.is_archived);

  const filteredHabits = activeHabits.filter(h => {
    if (filter === 'pending') return !h.is_completed_today;
    if (filter === 'completed') return h.is_completed_today;
    return true;
  });

  const completedCount = activeHabits.filter(h => h.is_completed_today).length;
  const totalCount = activeHabits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleComplete = async (habitId: string) => {
    try {
      setCompletingId(habitId);
      await onCompleteHabit(habitId);
    } finally {
      setCompletingId(null);
    }
  };

  const handleChecklistClick = async (habitId: string, templateId: string, current: boolean) => {
    soundEffects.playChecklistClick();
    await onToggleChecklist(habitId, templateId, !current);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Today's Checkpoints</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Strict daily execution. Check off all tasks and verify today's checkpoint before midnight.
          </p>
        </div>

        {/* Midnight Countdown */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-surface border border-surface-border font-mono text-xs">
          <Clock className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span className="text-gray-400">Midnight in:</span>
          <span className="text-cyan-300 font-bold">{formatCountdown(secondsRemaining)}</span>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-lg">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-gray-300">Today's Overall Execution</span>
          <span className="font-mono text-purple-300 font-bold">
            {completedCount} / {totalCount} Completed ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-surface-lighter overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2 bg-surface p-1 rounded-xl border border-surface-border">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'pending' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Pending ({totalCount - completedCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'completed' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Checkpoint Cards List */}
      {filteredHabits.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-surface border border-surface-border">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
          <h3 className="text-sm font-bold text-white">No checkpoints in this filter</h3>
          <p className="text-xs text-gray-400 mt-1">
            {filter === 'pending' ? 'All habits completed for today! Outstanding work.' : 'No habits to display.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHabits.map(habit => {
            const Icon = getHabitIcon(habit.icon);
            const isCompleted = habit.is_completed_today;
            const canComplete = habit.all_checklist_completed && !isCompleted;
            const isPendingThis = completingId === habit.id;

            return (
              <div
                key={habit.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-surface/50 border-emerald-500/20'
                    : 'bg-surface border-surface-border hover:border-purple-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Habit Info */}
                  <div className="flex items-center space-x-3.5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${habit.color}20`,
                        border: `1.5px solid ${habit.color}50`,
                        color: habit.color
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-surface-lighter text-gray-400">
                          {habit.category}
                        </span>
                        <span className="text-xs font-bold text-orange-400 flex items-center space-x-1 font-mono">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{habit.current_streak} days streak</span>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {habit.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        Day {habit.journey_day} of your journey
                      </p>
                    </div>
                  </div>

                  {/* Right: Checkpoint Action */}
                  <div className="sm:self-center">
                    {isCompleted ? (
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Completed Today ✓</span>
                      </div>
                    ) : (
                      <button
                        disabled={!canComplete || isPendingThis}
                        onClick={() => handleComplete(habit.id)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-lg ${
                          !canComplete
                            ? 'bg-surface-lighter text-gray-500 border border-surface-border cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 active:scale-[0.98]'
                        }`}
                      >
                        {!canComplete ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Checkpoint Locked</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isPendingThis ? 'Confirming...' : 'Mark as Completed'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Checklist Tasks */}
                {habit.checklist.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-surface-border/60">
                    <p className="text-[11px] font-semibold text-gray-400 mb-2">
                      Checklist tasks ({habit.checklist.filter(c => c.is_completed).length}/{habit.checklist.length}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {habit.checklist.map(task => (
                        <div
                          key={task.id}
                          onClick={() => !isCompleted && handleChecklistClick(habit.id, task.id, task.is_completed)}
                          className={`flex items-center space-x-2.5 p-2 rounded-lg text-xs cursor-pointer transition-all ${
                            task.is_completed
                              ? 'bg-purple-500/10 text-gray-300 border border-purple-500/20'
                              : 'bg-surface-lighter hover:bg-surface-hover text-gray-400'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center ${
                              task.is_completed ? 'bg-purple-500 text-white' : 'border border-gray-600'
                            }`}
                          >
                            {task.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={task.is_completed ? 'line-through text-gray-500' : 'text-gray-200'}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

