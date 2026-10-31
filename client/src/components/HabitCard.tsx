import React, { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  Circle,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  Info,
  Calendar,
  Check,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { Habit } from '../types/index.js';
import { getHabitIcon } from '../utils/icons.js';
import { soundEffects } from '../utils/sound.js';

interface HabitCardProps {
  habit: Habit;
  onComplete: (habitId: string, notes?: string) => Promise<void>;
  onToggleChecklist: (habitId: string, templateId: string, isCompleted: boolean) => Promise<void>;
  onEdit: (habit: Habit) => void;
  onViewDetails: (habit: Habit) => void;
  onArchive: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onComplete,
  onToggleChecklist,
  onEdit,
  onViewDetails,
  onArchive,
  onDelete
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [togglingItem, setTogglingItem] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const Icon = getHabitIcon(habit.icon);

  // Target progress percentage if target_days > 0
  const progressPercent = habit.target_days > 0
    ? Math.min(100, Math.round((habit.current_streak / habit.target_days) * 100))
    : 0;

  const handleChecklistClick = async (templateId: string, currentStatus: boolean) => {
    try {
      setTogglingItem(templateId);
      soundEffects.playChecklistClick();
      await onToggleChecklist(habit.id, templateId, !currentStatus);
    } finally {
      setTogglingItem(null);
    }
  };

  const handleCompleteClick = async () => {
    if (completing || habit.is_completed_today || !habit.all_checklist_completed) return;
    try {
      setCompleting(true);
      await onComplete(habit.id, notes);
      setNotesOpen(false);
      setNotes('');
    } finally {
      setCompleting(false);
    }
  };

  const completedChecklistCount = habit.checklist.filter(c => c.is_completed).length;
  const totalChecklistCount = habit.checklist.length;

  return (
    <div className="relative group rounded-2xl bg-surface border border-surface-border p-6 shadow-xl hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between">
      {/* Top row: Icon, Category & Menu */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${habit.color}20`,
                border: `1.5px solid ${habit.color}50`,
                color: habit.color
              }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-surface-lighter text-gray-400 border border-surface-border">
                {habit.category}
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-1 group-hover:text-purple-300 transition-colors">
                {habit.name}
              </h3>
            </div>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-lighter transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-36 rounded-xl bg-surface-lighter border border-surface-border shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onViewDetails(habit);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-surface-hover hover:text-white flex items-center space-x-2"
                >
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(habit);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-surface-hover hover:text-white flex items-center space-x-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Edit Habit</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive(habit.id);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-surface-hover hover:text-white flex items-center space-x-2"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>{habit.is_archived ? 'Unarchive' : 'Archive'}</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(habit.id);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 border-t border-surface-border/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Habit</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description if present */}
        {habit.description && (
          <p className="mt-2.5 text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {habit.description}
          </p>
        )}

        {/* Journey & Streak Stats Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-surface-lighter/70 border border-surface-border/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Current Journey
              </p>
              <p className="text-base font-extrabold text-white font-mono mt-0.5">
                Day {habit.journey_day} <span className="text-xs font-normal text-gray-400">of your journey</span>
              </p>
            </div>

            {/* Streak Counter Fire Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-sm shadow-orange-500/10">
              <Flame className={`w-4 h-4 ${habit.current_streak > 0 ? 'text-orange-400 animate-pulse' : 'text-gray-500'}`} />
              <span className="text-sm font-bold font-mono">
                {habit.current_streak} {habit.current_streak === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>

          {/* Longest streak record */}
          <div className="mt-2.5 pt-2 border-t border-surface-border/50 flex items-center justify-between text-[11px] text-gray-400">
            <span>Personal Best:</span>
            <span className="font-semibold text-gray-200 font-mono">
              {habit.longest_streak} {habit.longest_streak === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Target duration progress bar */}
          {habit.target_days > 0 && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                <span>Target: {habit.target_days} Days</span>
                <span className="font-mono text-purple-300">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Daily Checklist Tasks if configured */}
        {habit.checklist.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2">
              <span className="flex items-center space-x-1.5">
                <span>Daily Checklist</span>
                <span className="text-[10px] text-purple-400 font-mono">
                  ({completedChecklistCount}/{totalChecklistCount})
                </span>
              </span>
              {habit.all_checklist_completed && (
                <span className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Tasks ready</span>
                </span>
              )}
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {habit.checklist.map(item => (
                <div
                  key={item.id}
                  onClick={() => !habit.is_completed_today && handleChecklistClick(item.id, item.is_completed)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                    habit.is_completed_today
                      ? 'opacity-80 cursor-default bg-surface-lighter/50'
                      : item.is_completed
                      ? 'bg-purple-500/10 text-gray-300 border border-purple-500/20'
                      : 'bg-surface-lighter hover:bg-surface-hover text-gray-400 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                      item.is_completed
                        ? 'bg-purple-500 text-white'
                        : 'border border-gray-600'
                    }`}
                  >
                    {item.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={`flex-1 select-none ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-200'}`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkpoint Action Section */}
      <div className="mt-5 pt-4 border-t border-surface-border">
        {habit.is_completed_today ? (
          <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center space-x-2 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-wide">
              Day {habit.current_streak} Completed for Today
            </span>
          </div>
        ) : (
          <div>
            {/* Checklist requirement hint */}
            {!habit.all_checklist_completed && (
              <p className="text-[11px] text-amber-400/90 mb-2 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Complete all checklist tasks before marking checkpoint</span>
              </p>
            )}

            {/* Optional notes toggle */}
            {notesOpen && (
              <div className="mb-2.5">
                <input
                  type="text"
                  placeholder="Optional note for today's entry..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-surface-lighter border border-surface-border rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                disabled={completing || !habit.all_checklist_completed}
                onClick={handleCompleteClick}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg ${
                  !habit.all_checklist_completed
                    ? 'bg-surface-lighter text-gray-500 border border-surface-border cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25 hover:shadow-purple-600/40 active:scale-[0.98]'
                }`}
              >
                {!habit.all_checklist_completed ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Checkpoint Locked</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{completing ? 'Verifying...' : 'Mark as Completed'}</span>
                  </>
                )}
              </button>

              {habit.all_checklist_completed && !notesOpen && (
                <button
                  onClick={() => setNotesOpen(true)}
                  title="Add note for today"
                  className="p-2.5 rounded-xl bg-surface-lighter border border-surface-border text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

