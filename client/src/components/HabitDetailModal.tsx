import React, { useEffect, useState } from 'react';
import { X, Flame, Calendar, History, Trophy, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Habit, StreakAttempt } from '../types/index.js';
import { api } from '../services/api.js';
import { getHabitIcon } from '../utils/icons.js';
import { formatNiceDate } from '../utils/time.js';

interface HabitDetailModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({ habit, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<{
    habit: Habit;
    checklist: any[];
    completions: any[];
    previousAttempts: StreakAttempt[];
  } | null>(null);

  useEffect(() => {
    if (habit && isOpen) {
      loadDetails();
    }
  }, [habit, isOpen]);

  const loadDetails = async () => {
    if (!habit) return;
    try {
      setLoading(true);
      const res = await api.getHabitDetails(habit.id);
      setDetails(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !habit) return null;

  const Icon = getHabitIcon(habit.icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
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
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-lighter text-gray-400">
                  {habit.category}
                </span>
                {habit.is_archived && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Archived
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                {habit.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-lighter transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {habit.description && (
            <p className="text-sm text-gray-300 bg-surface-lighter/60 p-3.5 rounded-xl border border-surface-border/60 leading-relaxed">
              {habit.description}
            </p>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-lighter border border-surface-border">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Journey</span>
              <p className="text-lg font-bold text-white font-mono mt-0.5">Day {habit.journey_day}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <span className="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">Current Streak</span>
              <p className="text-lg font-bold text-orange-300 font-mono mt-0.5">{habit.current_streak} days</p>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">Longest Streak</span>
              <p className="text-lg font-bold text-purple-300 font-mono mt-0.5">{habit.longest_streak} days</p>
            </div>
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">Target</span>
              <p className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
                {habit.target_days > 0 ? `${habit.target_days} days` : 'Unlimited'}
              </p>
            </div>
          </div>

          {/* Historical Streak Resets & Attempts (Read-Only Memorial Graveyard) */}
          <div>
            <div className="flex items-center space-x-2 text-sm font-bold text-white mb-2.5">
              <History className="w-4 h-4 text-rose-400" />
              <span>Historical Streak Attempts & Resets</span>
            </div>

            {loading ? (
              <p className="text-xs text-gray-400 py-4 text-center">Loading history...</p>
            ) : details?.previousAttempts && details.previousAttempts.length > 0 ? (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {details.previousAttempts.map(attempt => (
                  <div
                    key={attempt.id}
                    className="p-3 rounded-xl bg-surface-lighter/80 border border-surface-border text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-200">Attempt #{attempt.attempt_number}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          {attempt.days_completed} Days Achieved
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {attempt.start_date} → {attempt.end_date}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 text-right max-w-[180px] truncate">
                      {attempt.termination_reason}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-lighter/40 border border-surface-border text-xs text-gray-400 text-center">
                Zero broken streaks! You have maintained complete continuity from Day 1.
              </div>
            )}
          </div>

          {/* Recent Daily Completions */}
          <div>
            <div className="flex items-center space-x-2 text-sm font-bold text-white mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Recent Completion Log</span>
            </div>

            {details?.completions && details.completions.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {details.completions.map(c => (
                  <div
                    key={c.date}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-lighter text-xs text-gray-300"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-purple-300 font-semibold">{c.date}</span>
                      <span className="text-[11px] text-gray-400">(Streak: {c.streak_number})</span>
                    </div>
                    {c.notes && <span className="text-gray-400 italic text-[11px] truncate max-w-[200px]">{c.notes}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No completions logged yet. Complete today to begin!</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-lighter/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-lighter hover:bg-surface-border text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

