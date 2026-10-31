import React, { useEffect, useState } from 'react';
import {
  Award,
  Flame,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Gem,
  Trophy,
  Crown,
  Sparkles,
  Compass,
  Lock
} from 'lucide-react';
import { api } from '../services/api.js';
import { Achievement } from '../types/index.js';
import { HABIT_ICONS } from '../utils/icons.js';

export const AchievementsView: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const res = await api.getAchievements();
      setAchievements(res.achievements);
      setUnlockedCount(res.unlockedCount);
      setTotalCount(res.totalCount);
      setCompletionRate(res.completionRate);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (iconName: string) => {
    const Icon = HABIT_ICONS[iconName] || Award;
    return Icon;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Discipline Milestones</h1>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Proof of your relentless consistency. Badges are unlocked strictly through continuous unbroken streaks.
        </p>
      </div>

      {/* Progress Journey Bar to Day 365 */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>The 365-Day Immortal Journey</span>
            </h2>
            <p className="text-xs text-gray-400">From Day 1 to 1 full year without missing a day</p>
          </div>
          <span className="font-mono text-xs font-bold text-amber-400">
            {unlockedCount} of {totalCount} Badges Unlocked ({completionRate}%)
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-surface-lighter overflow-hidden mt-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {/* Milestone Tick Marks */}
        <div className="grid grid-cols-5 text-center mt-3 text-[10px] text-gray-400 font-mono">
          <div>Day 1</div>
          <div>Day 7</div>
          <div>Day 30</div>
          <div>Day 100</div>
          <div className="text-amber-400 font-bold">Day 365</div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {achievements.map(ach => {
          const Icon = getBadgeIcon(ach.badge_icon);
          const isUnlocked = ach.is_unlocked;

          return (
            <div
              key={ach.id}
              className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-surface border-amber-500/30 shadow-lg shadow-amber-500/10 hover:border-amber-400'
                  : 'bg-surface/50 border-surface-border opacity-70 hover:opacity-100'
              }`}
            >
              {isUnlocked && (
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              )}

              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${
                      isUnlocked
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 ring-2 ring-amber-500/20'
                        : 'bg-surface-lighter text-gray-600 border border-surface-border'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {isUnlocked ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface-lighter text-gray-500 border border-surface-border flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">{ach.title}</h3>
                <p className="mt-1 text-xs text-gray-400 leading-relaxed">{ach.description}</p>
              </div>

              {/* Progress towards milestone */}
              <div className="mt-5 pt-3 border-t border-surface-border/60">
                {isUnlocked ? (
                  <p className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unlocked & Recorded</span>
                  </p>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                      <span>Streak Progress</span>
                      <span className="font-mono">{ach.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-lighter overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${ach.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

