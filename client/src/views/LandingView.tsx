import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  Clock,
  RotateCcw,
  Calendar,
  BarChart3,
  Award,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { soundEffects } from '../utils/sound.js';
import { fireConfetti } from '../utils/confetti.js';

interface LandingViewProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onOpenAuth }) => {
  // Demo interactive state on the hero preview
  const [demoStreak, setDemoStreak] = useState(11);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [demoChecklist, setDemoChecklist] = useState([
    { id: '1', title: 'Wake up at 5:30 AM', done: true },
    { id: '2', title: '5km Morning Run', done: true },
    { id: '3', title: 'Cold Shower & Stretch', done: false },
  ]);

  const handleDemoToggle = (id: string) => {
    soundEffects.playChecklistClick();
    setDemoChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const allDemoDone = demoChecklist.every(i => i.done);

  const handleDemoComplete = () => {
    if (!allDemoDone || demoCompleted) return;
    soundEffects.playCheckpointComplete();
    fireConfetti();
    setDemoStreak(prev => prev + 1);
    setDemoCompleted(true);
  };

  const ironRules = [
    {
      step: '01',
      title: 'Every Habit Starts at Day 1',
      desc: 'No skips. No head starts. True discipline is built from the ground up, one day at a time.'
    },
    {
      step: '02',
      title: 'Strict Midnight Deadline',
      desc: 'Complete all required checklist items and mark your daily checkpoint before 11:59:59 PM in your timezone.'
    },
    {
      step: '03',
      title: 'Miss a Day. Day 1 Starts Again.',
      desc: 'If you fail to check in before midnight, your streak automatically resets to Day 1. No excuses, no backdating.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <nav className="w-full border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white font-mono">
                DAY<span className="text-purple-400">ZERO</span>
              </span>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider hidden sm:block">
                Discipline Over Motivation
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-surface-lighter transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all"
            >
              Start Day 1
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wide uppercase mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>The Zero-Tolerance Habit Tracker</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none">
              DISCIPLINE OVER <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">
                MOTIVATION.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Motivation gets you started. Discipline keeps you showing up.
              Complete your daily checkpoints, build your streak, and never skip a day.
              <strong className="text-white block mt-1">If you miss a single day, your streak resets to Day 1.</strong>
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onOpenAuth('signup')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-purple-600/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <span>Commit to Day 1</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenAuth('login')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-surface-lighter hover:bg-surface-hover border border-surface-border text-gray-200 font-semibold text-sm transition-colors"
              >
                Sign In to Your Dashboard
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500 font-mono">
              Server-enforced timezone verification • No backdating • 100% Free
            </p>
          </div>

          {/* Interactive Live Card Demo Preview */}
          <div className="mt-14 max-w-lg mx-auto">
            <div className="p-1 rounded-3xl bg-gradient-to-br from-purple-500/40 via-cyan-500/20 to-transparent shadow-2xl">
              <div className="rounded-[22px] bg-surface p-6 border border-surface-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Flame className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-lighter text-purple-300 border border-purple-500/20">
                        Fitness & Routine
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">MORNING DISCIPLINE</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono text-sm font-bold">
                    <Flame className="w-4 h-4" />
                    <span>{demoStreak} Days</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-lighter/80 border border-surface-border mb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-medium">Day 12 of your journey</p>
                    <span className="text-[11px] font-mono text-cyan-300">Target: 100 Days</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-border overflow-hidden mt-2">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 w-[12%]" />
                  </div>
                </div>

                {/* Interactive Demo Checklist */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                    <span>Today's Daily Checklist</span>
                    <span className="text-[10px] text-gray-400">Click to toggle demo</span>
                  </p>
                  {demoChecklist.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleDemoToggle(item.id)}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                        item.done ? 'bg-purple-500/10 text-gray-300 border border-purple-500/20' : 'bg-surface-lighter text-gray-400'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                          item.done ? 'bg-purple-500 text-white' : 'border border-gray-600'
                        }`}
                      >
                        {item.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className={item.done ? 'line-through text-gray-500' : 'text-gray-200'}>
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Complete Button */}
                <button
                  disabled={!allDemoDone || demoCompleted}
                  onClick={handleDemoComplete}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                    demoCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : !allDemoDone
                      ? 'bg-surface-lighter text-gray-500 border border-surface-border cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {demoCompleted
                      ? 'Day 12 Completed for Today ✓'
                      : !allDemoDone
                      ? 'Complete All Checklist Items First'
                      : 'Mark Today as Completed'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Iron Rules Section */}
      <section className="py-20 border-t border-surface-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">
              THE ZERO-TOLERANCE CODE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
              The 3 Iron Rules of DayZero
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Most habit apps let you pause, backdate, or cheat. DayZero does not.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ironRules.map(rule => (
              <div
                key={rule.step}
                className="p-8 rounded-2xl bg-surface border border-surface-border hover:border-purple-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-3xl font-black text-purple-400/40 font-mono">
                    {rule.step}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-4">{rule.title}</h3>
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed">{rule.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-surface-border flex items-center space-x-2 text-xs font-semibold text-purple-300">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Enforced strictly</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Built for Relentless Consistency
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Everything you need to master your habits and eliminate excuses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-surface-border">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Unlimited Custom Habits</h3>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                Gym, Coding, Reading, Fasting, Deep Work. Create unlimited habits with custom colors, icons, and target milestones.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-surface-border">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Daily Multi-Task Checklists</h3>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                Break complex habits into subtasks. The day's checkpoint unlocks only when all required tasks are executed.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-surface-border">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">GitHub-Style Calendar</h3>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                Visualize your dedication with an interactive contribution heatmap. See every completed day and missed day.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-surface-border">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Streak & Failure Memorial</h3>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                Past broken streaks are permanently honored in your Memorial Graveyard. Learn from failure and rise back to Day 1.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-surface-border">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Milestone Badges (7 to 365 Days)</h3>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                Unlock achievements for surviving 7 days, 30 days, 100 days, and the legendary 365-day immortal discipline mark.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-surface-border">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Midnight Warning System</h3>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                Real-time countdown to midnight in your exact IANA timezone. Urgent warnings ensure you never miss your checkpoint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 border-t border-surface-border bg-gradient-to-b from-surface to-background text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Stop Negotiating with Yourself.
          </h2>
          <p className="mt-3 text-sm text-gray-400 max-w-xl mx-auto">
            Tomorrow is the enemy of discipline. Start your Day 1 today.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-purple-600/30 active:scale-[0.98] transition-all flex items-center space-x-2"
            >
              <span>Begin Your Streak (Day 1)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-12 text-xs text-gray-600 font-mono">
            DAYZERO © 2026 • DISCIPLINE OVER MOTIVATION
          </p>
        </div>
      </section>
    </div>
  );
};

