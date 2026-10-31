import React, { useEffect } from 'react';
import { Award, Flame, CheckCircle, Sparkles, X } from 'lucide-react';
import { Achievement } from '../types/index.js';
import { fireConfetti, fireMilestoneConfetti } from '../utils/confetti.js';
import { soundEffects } from '../utils/sound.js';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakNumber: number;
  habitName: string;
  motivationalMessage: string;
  unlockedAchievements?: Achievement[];
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  streakNumber,
  habitName,
  motivationalMessage,
  unlockedAchievements = []
}) => {
  useEffect(() => {
    if (isOpen) {
      if (unlockedAchievements.length > 0 || streakNumber % 7 === 0) {
        fireMilestoneConfetti();
        soundEffects.playAchievementUnlock();
      } else {
        fireConfetti();
        soundEffects.playCheckpointComplete();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-surface border border-purple-500/40 p-6 sm:p-8 shadow-2xl shadow-purple-500/20 text-center relative overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Fire & Day Banner */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 shadow-xl shadow-purple-500/30 flex items-center justify-center mb-4">
          <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
            <Flame className="w-8 h-8 text-orange-400 animate-pulse" />
          </div>
        </div>

        <span className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 mb-2">
          CHECKPOINT EARNED
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
          DAY {streakNumber}
        </h2>
        <p className="text-xs text-gray-400 font-semibold tracking-wide uppercase mt-1">
          {habitName}
        </p>

        {/* Motivational message quote */}
        <div className="my-5 p-4 rounded-2xl bg-surface-lighter/80 border border-surface-border">
          <p className="text-sm font-medium text-purple-200 italic leading-relaxed">
            "{motivationalMessage}"
          </p>
          <p className="text-[10px] text-gray-400 mt-2 tracking-widest uppercase font-mono">
            Discipline Over Motivation
          </p>
        </div>

        {/* Newly Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="my-4 space-y-2">
            <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>NEW BADGE UNLOCKED!</span>
            </div>
            {unlockedAchievements.map(ach => (
              <div
                key={ach.id}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left flex items-center space-x-3"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-200">{ach.title}</h4>
                  <p className="text-[11px] text-gray-400 leading-snug">{ach.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all"
        >
          Keep Showing Up
        </button>
      </div>
    </div>
  );
};

