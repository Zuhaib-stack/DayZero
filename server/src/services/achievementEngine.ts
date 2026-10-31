import { query, queryOne } from '../db/index.js';
import { getTodayInTimezone } from '../utils/timezone.js';

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  badge_icon: string;
  milestone_days: number;
  category: string;
  unlocked_at?: string;
}

export async function checkAndAwardAchievements(userId: string, timezone: string): Promise<Achievement[]> {
  const newlyUnlocked: Achievement[] = [];
  const today = getTodayInTimezone(timezone);

  // 1. Get already unlocked achievement keys
  const unlockedRows = await query<{ key: string }>(
    `SELECT a.key FROM user_achievements ua
     JOIN achievements a ON ua.achievement_id = a.id
     WHERE ua.user_id = $1`,
    [userId]
  );
  const unlockedKeys = new Set(unlockedRows.map(r => r.key));

  // 2. Fetch all achievements
  const allAchievements = await query<Achievement>('SELECT * FROM achievements');

  // 3. User metrics
  const habitsCountRes = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM habits WHERE user_id = $1',
    [userId]
  );
  const totalHabits = parseInt(habitsCountRes?.count || '0', 10);

  const maxStreakRes = await queryOne<{ max_streak: number | null }>(
    'SELECT MAX(longest_streak) as max_streak FROM habits WHERE user_id = $1',
    [userId]
  );
  const maxStreak = maxStreakRes?.max_streak || 0;

  const totalCompletionsRes = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM daily_completions WHERE user_id = $1',
    [userId]
  );
  const totalCompletions = parseInt(totalCompletionsRes?.count || '0', 10);

  // Check attempts for Phoenix
  const attemptsRes = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM streak_attempts WHERE user_id = $1',
    [userId]
  );
  const attemptsCount = parseInt(attemptsRes?.count || '0', 10);

  // Check today completions vs total active habits
  const activeHabitsRes = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND is_archived = FALSE',
    [userId]
  );
  const activeHabitsCount = parseInt(activeHabitsRes?.count || '0', 10);

  const todayCompletionsRes = await queryOne<{ count: string }>(
    `SELECT COUNT(DISTINCT habit_id) as count FROM daily_completions
     WHERE user_id = $1 AND date = $2`,
    [userId, today]
  );
  const todayCompletionsCount = parseInt(todayCompletionsRes?.count || '0', 10);

  // Evaluate each achievement
  for (const ach of allAchievements) {
    if (unlockedKeys.has(ach.key)) continue;

    let qualify = false;

    switch (ach.key) {
      case 'first_step':
        if (totalHabits >= 1) qualify = true;
        break;
      case 'day_1_done':
        if (totalCompletions >= 1) qualify = true;
        break;
      case 'streak_7':
        if (maxStreak >= 7) qualify = true;
        break;
      case 'streak_14':
        if (maxStreak >= 14) qualify = true;
        break;
      case 'streak_30':
        if (maxStreak >= 30) qualify = true;
        break;
      case 'streak_60':
        if (maxStreak >= 60) qualify = true;
        break;
      case 'streak_100':
        if (maxStreak >= 100) qualify = true;
        break;
      case 'streak_365':
        if (maxStreak >= 365) qualify = true;
        break;
      case 'phoenix_restart':
        if (attemptsCount >= 1 && totalCompletions >= 1) qualify = true;
        break;
      case 'flawless_day':
        if (activeHabitsCount > 0 && todayCompletionsCount >= activeHabitsCount) qualify = true;
        break;
    }

    if (qualify) {
      const userAchId = `uach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(
        `INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, achievement_id) DO NOTHING`,
        [userAchId, userId, ach.id]
      );

      // Create a notification for achievement
      await query(
        `INSERT INTO notifications (id, user_id, type, title, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId,
          'achievement',
          `Achievement Unlocked: ${ach.title}!`,
          ach.description
        ]
      );

      newlyUnlocked.push({ ...ach, unlocked_at: new Date().toISOString() });
    }
  }

  return newlyUnlocked;
}

