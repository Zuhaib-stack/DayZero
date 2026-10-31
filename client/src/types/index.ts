export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  avatar?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  is_completed: boolean;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string;
  color: string;
  start_date: string;
  target_days: number;
  reminder_time: string | null;
  is_archived: boolean;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  status: string;
  is_completed_today: boolean;
  journey_day: number;
  all_checklist_completed: boolean;
  checklist: ChecklistItem[];
  seconds_until_midnight?: number;
}

export interface StreakAttempt {
  id: string;
  habit_id: string;
  habit_name?: string;
  habit_color?: string;
  attempt_number: number;
  start_date: string;
  end_date: string;
  days_completed: number;
  termination_reason: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  badge_icon: string;
  milestone_days: number;
  category: string;
  is_unlocked: boolean;
  unlocked_at?: string;
  progress: number;
}

export interface DashboardStats {
  userName: string;
  today: string;
  totalActive: number;
  completedToday: number;
  longestStreakEver: number;
  maxCurrentStreak: number;
  totalCompletions: number;
  overallPercentage: number;
  dailyQuote: {
    text: string;
    author: string;
  };
}

export interface CalendarDay {
  date: string;
  count: number;
  status: 'completed' | 'partial' | 'missed' | 'today' | 'empty';
  isToday: boolean;
}

export interface CalendarData {
  startDate: string;
  endDate: string;
  totalDays: number;
  days: CalendarDay[];
}

export interface ChartData {
  trendData: { date: string; fullDate: string; completions: number }[];
  categoryStats: { category: string; completions: number; habitsCount: number }[];
  topHabits: {
    id: string;
    name: string;
    category: string;
    color: string;
    current_streak: number;
    longest_streak: number;
  }[];
  recentResets: StreakAttempt[];
}

export interface NotificationItem {
  id: string;
  habit_id?: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

