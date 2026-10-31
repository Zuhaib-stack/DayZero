import { User, Habit, DashboardStats, CalendarData, ChartData, Achievement, StreakAttempt, NotificationItem } from '../types/index.js';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('dayzero_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string; timezone?: string }) =>
    request<{ token: string; user: User; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string; demoResetToken?: string | null }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (body: { token: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  // Habits
  getHabits: () => request<{ habits: Habit[]; today: string; secondsRemaining: number }>('/habits'),

  createHabit: (body: {
    name: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    start_date?: string;
    target_days?: number;
    reminder_time?: string | null;
    checklist_items?: string[];
  }) =>
    request<{ habit: Habit; message: string }>('/habits', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  getHabitDetails: (id: string) =>
    request<{
      habit: Habit;
      checklist: any[];
      completions: any[];
      previousAttempts: StreakAttempt[];
    }>(`/habits/${id}`),

  updateHabit: (id: string, body: any) =>
    request<{ message: string }>(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  toggleArchiveHabit: (id: string) =>
    request<{ message: string; is_archived: boolean }>(`/habits/${id}/archive`, {
      method: 'POST'
    }),

  deleteHabit: (id: string) =>
    request<{ message: string }>(`/habits/${id}`, {
      method: 'DELETE'
    }),

  // Checkpoints
  getTodayCheckpoints: () =>
    request<{
      today: string;
      totalActive: number;
      completedToday: number;
      percentage: number;
      checkpoints: any[];
    }>('/checkpoints/today'),

  toggleChecklistItem: (body: { habit_id: string; template_id: string; is_completed: boolean }) =>
    request<{ message: string; checklist: any[]; all_checklist_completed: boolean }>(
      '/checkpoints/checklist/toggle',
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    ),

  completeCheckpoint: (body: { habit_id: string; notes?: string }) =>
    request<{
      message: string;
      motivationalMessage: string;
      habit: Habit;
      newlyUnlockedAchievements: Achievement[];
    }>('/checkpoints/complete', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  // Analytics
  getDashboardStats: () => request<DashboardStats>('/analytics/dashboard'),

  getCalendarData: (habitId?: string) =>
    request<CalendarData>(`/analytics/calendar${habitId ? `?habit_id=${habitId}` : ''}`),

  getChartData: () => request<ChartData>('/analytics/charts'),

  // Achievements
  getAchievements: () =>
    request<{
      achievements: Achievement[];
      unlockedCount: number;
      totalCount: number;
      completionRate: number;
    }>('/achievements'),

  // Notifications
  getNotifications: () =>
    request<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ message: string }>(`/notifications/${id}/read`, { method: 'POST' }),

  markAllNotificationsRead: () =>
    request<{ message: string }>('/notifications/read-all', { method: 'POST' }),

  // Settings
  updateProfile: (body: { name: string; timezone: string; avatar?: string | null }) =>
    request<{ message: string; user: User }>('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/settings/password', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  getStreakAttempts: () =>
    request<{ attempts: StreakAttempt[] }>('/settings/attempts'),

  deleteAccount: () =>
    request<{ message: string }>('/settings/account', { method: 'DELETE' })
};

