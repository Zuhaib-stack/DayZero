import { Router, Response } from 'express';
import { query, queryOne } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getTodayInTimezone } from '../utils/timezone.js';
import { normalizeDate } from '../services/streakEngine.js';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';

const router = Router();

// GET /api/analytics/dashboard - Comprehensive stats for dashboard overview
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const today = getTodayInTimezone(user.timezone);

    // 1. Total active habits
    const activeHabitsRes = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND is_archived = FALSE',
      [user.id]
    );
    const totalActive = parseInt(activeHabitsRes?.count || '0', 10);

    // 2. Habits completed today
    const todayCompletionsRes = await queryOne<{ count: string }>(
      'SELECT COUNT(DISTINCT habit_id) as count FROM daily_completions WHERE user_id = $1 AND date = $2',
      [user.id, today]
    );
    const completedToday = parseInt(todayCompletionsRes?.count || '0', 10);

    // 3. Longest streak ever achieved across all habits
    const maxStreakRes = await queryOne<{ max_streak: number | null }>(
      'SELECT MAX(longest_streak) as max_streak FROM habits WHERE user_id = $1',
      [user.id]
    );
    const longestStreakEver = maxStreakRes?.max_streak || 0;

    // 4. Current active streaks sum and max
    const currentStreaksRes = await queryOne<{ max_current: number | null; sum_current: string | null }>(
      'SELECT MAX(current_streak) as max_current, SUM(current_streak) as sum_current FROM habits WHERE user_id = $1 AND is_archived = FALSE',
      [user.id]
    );
    const maxCurrentStreak = currentStreaksRes?.max_current || 0;

    // 5. Overall completion percentage
    // Total completions ever vs days since first habit
    const totalCompletionsRes = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM daily_completions WHERE user_id = $1',
      [user.id]
    );
    const totalCompletions = parseInt(totalCompletionsRes?.count || '0', 10);

    const earliestHabit = await queryOne<{ start_date: any }>(
      'SELECT MIN(start_date) as start_date FROM habits WHERE user_id = $1',
      [user.id]
    );
    
    let overallPercentage = 0;
    if (totalActive > 0) {
      overallPercentage = Math.round((completedToday / totalActive) * 100);
    }

    // 6. Motivational quotes rotation
    const quotes = [
      { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
      { text: "We must all suffer one of two things: the pain of discipline or the pain of regret.", author: "Jim Rohn" },
      { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
      { text: "Discipline equals freedom.", author: "Jocko Willink" },
      { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
      { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" }
    ];
    const todayIndex = Math.abs(today.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0)) % quotes.length;
    const dailyQuote = quotes[todayIndex];

    return res.json({
      userName: user.name,
      today,
      totalActive,
      completedToday,
      longestStreakEver,
      maxCurrentStreak,
      totalCompletions,
      overallPercentage,
      dailyQuote
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/analytics/calendar - GitHub-style contribution calendar
router.get('/calendar', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const habitId = req.query.habit_id as string | undefined;
    const todayStr = getTodayInTimezone(user.timezone);
    const todayDate = parseISO(todayStr);

    // Look back past 180 days (or ~26 weeks) to today
    const startDate = subDays(todayDate, 180);
    const daysInterval = eachDayOfInterval({ start: startDate, end: todayDate });

    // Query daily completions for this user (or single habit if specified)
    let completionsQuery = `
      SELECT date, COUNT(*) as count, ARRAY_AGG(habit_id) as habit_ids 
      FROM daily_completions 
      WHERE user_id = $1 AND date >= $2 AND date <= $3
    `;
    const params: any[] = [user.id, format(startDate, 'yyyy-MM-dd'), todayStr];

    if (habitId) {
      completionsQuery += ' AND habit_id = $4';
      params.push(habitId);
    }
    completionsQuery += ' GROUP BY date';

    const completions = await query<any>(completionsQuery, params);
    const completionMap = new Map<string, { count: number; habit_ids: string[] }>();
    for (const c of completions) {
      completionMap.set(normalizeDate(c.date)!, {
        count: parseInt(c.count, 10),
        habit_ids: c.habit_ids
      });
    }

    // Also get total active habits count for comparison
    const activeHabitsRes = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND is_archived = FALSE',
      [user.id]
    );
    const totalActive = parseInt(activeHabitsRes?.count || '0', 10);

    // Get habit start_date if specific habit is selected
    let selectedHabitStartDate: string | null = null;
    if (habitId) {
      const h = await queryOne<any>('SELECT start_date FROM habits WHERE id = $1', [habitId]);
      if (h) selectedHabitStartDate = normalizeDate(h.start_date);
    }

    // Build day items
    const calendarDays = daysInterval.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const data = completionMap.get(dateStr);
      const count = data?.count || 0;
      const isToday = dateStr === todayStr;

      let status = 'empty';
      if (isToday) {
        status = count > 0 ? 'completed' : 'today';
      } else if (count > 0) {
        if (habitId) {
          status = 'completed';
        } else {
          status = count >= totalActive && totalActive > 0 ? 'completed' : 'partial';
        }
      } else {
        // If before start date of habit, empty. If after start date and was 0 completed, missed!
        if (habitId && selectedHabitStartDate && dateStr >= selectedHabitStartDate) {
          status = 'missed';
        } else if (!habitId && totalActive > 0) {
          status = 'missed';
        }
      }

      return {
        date: dateStr,
        count,
        status, // 'completed' | 'partial' | 'missed' | 'today' | 'empty'
        isToday
      };
    });

    return res.json({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: todayStr,
      totalDays: calendarDays.length,
      days: calendarDays
    });
  } catch (error) {
    console.error('Calendar analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

// GET /api/analytics/charts - Data for Recharts graphs
router.get('/charts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const todayStr = getTodayInTimezone(user.timezone);
    const todayDate = parseISO(todayStr);

    // 1. Last 14 days completion trend
    const last14Days = eachDayOfInterval({ start: subDays(todayDate, 13), end: todayDate });
    const trendData = await Promise.all(
      last14Days.map(async (d) => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const compRes = await queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM daily_completions WHERE user_id = $1 AND date = $2',
          [user.id, dateStr]
        );
        return {
          date: format(d, 'MMM dd'),
          fullDate: dateStr,
          completions: parseInt(compRes?.count || '0', 10)
        };
      })
    );

    // 2. Category breakdown
    const categoryStats = await query<any>(
      `SELECT h.category, COUNT(dc.id) as completions, COUNT(DISTINCT h.id) as habits_count
       FROM habits h
       LEFT JOIN daily_completions dc ON h.id = dc.habit_id
       WHERE h.user_id = $1
       GROUP BY h.category
       ORDER BY completions DESC`,
      [user.id]
    );

    // 3. Top streaks by habit
    const topHabits = await query<any>(
      `SELECT id, name, category, color, current_streak, longest_streak 
       FROM habits 
       WHERE user_id = $1 
       ORDER BY longest_streak DESC 
       LIMIT 6`,
      [user.id]
    );

    // 4. Historical failed attempts list (Graveyard / Memorial)
    const attempts = await query<any>(
      `SELECT sa.*, h.name as habit_name, h.color as habit_color
       FROM streak_attempts sa
       JOIN habits h ON sa.habit_id = h.id
       WHERE sa.user_id = $1
       ORDER BY sa.created_at DESC
       LIMIT 10`,
      [user.id]
    );

    return res.json({
      trendData,
      categoryStats: categoryStats.map(c => ({
        category: c.category,
        completions: parseInt(c.completions, 10),
        habitsCount: parseInt(c.habits_count, 10)
      })),
      topHabits,
      recentResets: attempts.map(a => ({
        ...a,
        start_date: normalizeDate(a.start_date),
        end_date: normalizeDate(a.end_date)
      }))
    });
  } catch (error) {
    console.error('Charts analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch charts data' });
  }
});

export default router;

