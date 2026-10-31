import { query, queryOne } from '../db/index.js';
import { getTodayInTimezone, getYesterdayInTimezone } from '../utils/timezone.js';
import { format, subDays, parseISO } from 'date-fns';

export interface HabitRecord {
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
}

/**
 * Normalizes SQL date fields which might be returned as Date objects or strings
 */
export function normalizeDate(dateVal: any): string | null {
  if (!dateVal) return null;
  if (typeof dateVal === 'string') {
    return dateVal.split('T')[0];
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  return String(dateVal).split('T')[0];
}

/**
 * Server-side strict evaluation: checks if streak is broken by missing yesterday's deadline.
 * If broken, automatically moves to streak_attempts and resets habit current_streak to 0 (Day 1).
 */
export async function evaluateHabitStreak(habit: HabitRecord, timezone: string): Promise<HabitRecord> {
  const today = getTodayInTimezone(timezone);
  const yesterday = getYesterdayInTimezone(timezone);
  const lastCompleted = normalizeDate(habit.last_completed_date);

  // If habit has an active streak (> 0)
  if (habit.current_streak > 0) {
    // If not completed today AND not completed yesterday, then yesterday's deadline was missed!
    if (lastCompleted !== today && lastCompleted !== yesterday) {
      console.log(`[StreakEngine] Streak broken for habit "${habit.name}" (${habit.id}). Last completed: ${lastCompleted}, Yesterday was: ${yesterday}. Resetting to Day 1.`);

      // Calculate streak start date
      let streakStartDate = habit.start_date;
      if (lastCompleted) {
        try {
          const lastDateObj = parseISO(lastCompleted);
          const calculatedStart = subDays(lastDateObj, Math.max(0, habit.current_streak - 1));
          streakStartDate = format(calculatedStart, 'yyyy-MM-dd');
        } catch (e) {
          streakStartDate = habit.start_date;
        }
      }

      // Record in streak_attempts graveyard
      const countRes = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM streak_attempts WHERE habit_id = $1',
        [habit.id]
      );
      const attemptNumber = (parseInt(countRes?.count || '0', 10)) + 1;

      await query(
        `INSERT INTO streak_attempts (id, habit_id, user_id, attempt_number, start_date, end_date, days_completed, termination_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          habit.id,
          habit.user_id,
          attemptNumber,
          streakStartDate,
          lastCompleted || habit.start_date,
          habit.current_streak,
          `Missed checkpoint deadline before midnight (${yesterday})`
        ]
      );

      // Reset habit streak to 0
      await query(
        `UPDATE habits 
         SET current_streak = 0, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [habit.id]
      );

      // Add notification for the user
      await query(
        `INSERT INTO notifications (id, user_id, habit_id, type, title, message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          habit.user_id,
          habit.id,
          'streak_reset',
          `Streak Broken: ${habit.name}`,
          `You missed the daily checkpoint. Your streak of ${habit.current_streak} days has ended. Restarting at Day 1. Discipline over motivation.`
        ]
      );

      habit.current_streak = 0;
    }
  }

  return habit;
}

/**
 * Evaluates all active habits for a user
 */
export async function evaluateUserHabits(userId: string, timezone: string): Promise<void> {
  const habits = await query<HabitRecord>(
    'SELECT * FROM habits WHERE user_id = $1 AND is_archived = FALSE',
    [userId]
  );
  for (const h of habits) {
    await evaluateHabitStreak(h, timezone);
  }
}

