import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, CheckCircle2, AlertOctagon, Flame } from 'lucide-react';
import { api } from '../services/api.js';
import { CalendarData, Habit } from '../types/index.js';
import { formatNiceDate } from '../utils/time.js';

interface CalendarViewProps {
  habits: Habit[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ habits }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; status: string } | null>(null);

  useEffect(() => {
    loadCalendar();
  }, [selectedHabitId]);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const data = await api.getCalendarData(selectedHabitId || undefined);
      setCalendarData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const days = calendarData?.days || [];

  // Summary counts
  const totalDays = days.length;
  const completedDays = days.filter(d => d.status === 'completed').length;
  const missedDays = days.filter(d => d.status === 'missed').length;
  const consistencyRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  // Group days into weeks (columns)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getDayColor = (status: string, isToday: boolean) => {
    if (isToday) return 'border-2 border-cyan-400 bg-cyan-950/60 shadow-sm shadow-cyan-400/30';
    switch (status) {
      case 'completed':
        return 'bg-purple-500 hover:bg-purple-400 shadow-sm shadow-purple-500/20';
      case 'partial':
        return 'bg-purple-800/80 hover:bg-purple-700';
      case 'missed':
        return 'bg-rose-950/50 border border-rose-500/30 hover:border-rose-400';
      default:
        return 'bg-surface-lighter hover:bg-surface-border';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Discipline Calendar</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            GitHub-style contribution heatmap. Missed days break the chain. Previous days are read-only.
          </p>
        </div>

        {/* Habit Selector */}
        <div className="flex items-center space-x-2 bg-surface px-3 py-1.5 rounded-xl border border-surface-border">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedHabitId}
            onChange={e => setSelectedHabitId(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-surface">All Habits (Combined Activity)</option>
            {habits.map(h => (
              <option key={h.id} value={h.id} className="bg-surface">
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-surface-border">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Days Evaluated</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">{totalDays}</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Completed Days</span>
          <p className="text-2xl font-bold font-mono text-purple-300 mt-1">{completedDays}</p>
        </div>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Missed Deadlines</span>
          <p className="text-2xl font-bold font-mono text-rose-300 mt-1">{missedDays}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Consistency Rate</span>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">{consistencyRate}%</p>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white tracking-wide">
            {selectedHabitId
              ? `${habits.find(h => h.id === selectedHabitId)?.name || 'Habit'} Execution History`
              : 'Overall Consistency Heatmap (Past 180 Days)'}
          </h2>

          {hoveredDay ? (
            <div className="text-xs font-mono text-cyan-300 animate-in fade-in">
              {hoveredDay.date}: <span className="font-bold uppercase">{hoveredDay.status}</span> ({hoveredDay.count} completed)
            </div>
          ) : (
            <span className="text-xs text-gray-400">Hover over any day to inspect</span>
          )}
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-flex gap-1.5 p-2 bg-surface-lighter/50 rounded-xl border border-surface-border/50">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1.5">
                {week.map(day => (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={`${day.date} - ${day.status}`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md transition-all cursor-pointer ${getDayColor(
                      day.status,
                      day.isToday
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-surface-border flex flex-wrap items-center justify-between text-xs text-gray-400 gap-3">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-gray-300">Legend:</span>
            <div className="flex items-center space-x-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-purple-500 shadow-sm shadow-purple-500/30" />
              <span>Completed</span>
            </div>
            {!selectedHabitId && (
              <div className="flex items-center space-x-1.5">
                <div className="w-3.5 h-3.5 rounded-sm bg-purple-800/80" />
                <span>Partial</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-rose-950/50 border border-rose-500/40" />
              <span>Missed (Reset)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3.5 h-3.5 rounded-sm border-2 border-cyan-400 bg-cyan-950/60" />
              <span>Current Day</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-surface-lighter" />
              <span>Prior / Empty</span>
            </div>
          </div>

          <div className="font-mono text-[11px] text-gray-400">
            Read-only historical audit trail
          </div>
        </div>
      </div>
    </div>
  );
};

