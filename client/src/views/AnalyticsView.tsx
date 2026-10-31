import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Flame,
  History,
  Trophy,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { api } from '../services/api.js';
import { ChartData, Habit } from '../types/index.js';

interface AnalyticsViewProps {
  habits: Habit[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ habits }) => {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getChartData();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const trendData = data?.trendData || [];
  const categoryStats = data?.categoryStats || [];
  const topHabits = data?.topHabits || [];
  const recentResets = data?.recentResets || [];

  const CATEGORY_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Discipline Analytics</h1>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Objective metrics on your daily commitments, consistency trends, and past streak attempts.
        </p>
      </div>

      {/* Main Trend Area Chart */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Daily Completion Volume (Past 14 Days)</span>
            </h2>
            <p className="text-xs text-gray-400">Total checkpoint completions logged per calendar day</p>
          </div>
        </div>

        <div className="h-64 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">
              Loading charts...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#252936' }}
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: '#252936' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#11131a',
                    border: '1px solid #252936',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completions"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#purpleGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two Column Grid: Category Breakdown + Top Streaks Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl">
          <div className="flex items-center space-x-2 mb-4">
            <PieIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Completions by Category</h3>
          </div>

          {categoryStats.length === 0 ? (
            <p className="text-xs text-gray-500 py-8 text-center">No completions logged yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((cat, idx) => {
                const totalComp = categoryStats.reduce((sum, c) => sum + c.completions, 0);
                const percent = totalComp > 0 ? Math.round((cat.completions / totalComp) * 100) : 0;
                const col = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-200">{cat.category}</span>
                      <span className="font-mono text-gray-400">
                        {cat.completions} completions ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-lighter overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: col }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Longest Streaks Leaderboard */}
        <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl">
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Streak Records by Habit</h3>
          </div>

          {topHabits.length === 0 ? (
            <p className="text-xs text-gray-500 py-8 text-center">No habits found.</p>
          ) : (
            <div className="space-y-3">
              {topHabits.map((h, i) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-surface-lighter/70 border border-surface-border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-gray-500 w-4">#{i + 1}</span>
                    <div>
                      <h4 className="font-bold text-white">{h.name}</h4>
                      <span className="text-[10px] text-gray-400">{h.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">Current</span>
                      <span className="font-mono font-bold text-orange-400">{h.current_streak}d</span>
                    </div>
                    <div className="text-right pl-3 border-l border-surface-border">
                      <span className="text-[10px] text-gray-400 block">Best</span>
                      <span className="font-mono font-bold text-purple-300">{h.longest_streak}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historical Failed Attempts (Memorial Graveyard) */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl">
        <div className="flex items-center space-x-2 mb-2">
          <History className="w-4 h-4 text-rose-400" />
          <h3 className="text-base font-bold text-white">Streak Memorial Graveyard (Historical Resets)</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Every failed checkpoint resets a habit to Day 1. These previous attempts are strictly archived as proof of resilience.
        </p>

        {recentResets.length === 0 ? (
          <div className="p-6 rounded-xl bg-surface-lighter/50 border border-surface-border text-center text-xs text-gray-400">
            No broken streaks recorded! You have maintained complete discipline on all active habits.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Habit</th>
                  <th className="py-2.5 px-3">Attempt</th>
                  <th className="py-2.5 px-3">Streak Reached</th>
                  <th className="py-2.5 px-3">Dates Active</th>
                  <th className="py-2.5 px-3">Termination Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {recentResets.map(attempt => (
                  <tr key={attempt.id} className="hover:bg-surface-lighter/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">{attempt.habit_name || 'Habit'}</td>
                    <td className="py-3 px-3 font-mono text-gray-400">#{attempt.attempt_number}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        {attempt.days_completed} Days
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">
                      {attempt.start_date} → {attempt.end_date}
                    </td>
                    <td className="py-3 px-3 text-gray-400 italic">{attempt.termination_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

