import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { formatCountdown } from '../utils/time.js';

interface MidnightWarningBannerProps {
  secondsRemaining: number;
  uncompletedCount: number;
  onNavigateToCheckpoints: () => void;
}

export const MidnightWarningBanner: React.FC<MidnightWarningBannerProps> = ({
  secondsRemaining,
  uncompletedCount,
  onNavigateToCheckpoints
}) => {
  if (uncompletedCount === 0 || secondsRemaining <= 0) return null;

  const isUrgent = secondsRemaining < 14400; // < 4 hours

  return (
    <div
      className={`w-full mb-6 p-4 rounded-2xl border transition-all ${
        isUrgent
          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-lg shadow-rose-950/30'
          : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isUrgent ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight text-white">
                {isUrgent ? 'CRITICAL DEADLINE WARNING' : 'DAILY CHECKPOINT REMINDER'}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
                {uncompletedCount} Pending {uncompletedCount === 1 ? 'Habit' : 'Habits'}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5">
              Unchecked checkpoints reset strictly to Day 1 at 11:59:59 PM. Do not break the chain.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-1.5 font-mono text-xs px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatCountdown(secondsRemaining)}</span>
          </div>

          <button
            onClick={onNavigateToCheckpoints}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors flex items-center space-x-1"
          >
            <span>Complete Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

