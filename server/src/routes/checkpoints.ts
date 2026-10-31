import { Router, Response } from 'express';
import { query, queryOne } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getTodayInTimezone, getYesterdayInTimezone } from '../utils/timezone.js';
import { evaluateHabitStreak, normalizeDate, HabitRecord } from '../services/streakEngine.js';
import { checkAndAwardAchievements } from '../services/achievementEngine.js';

const router = Router();

// GET /api/checkpoints/today - Summary of all active checkpoints for today
router.get('/today', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const today = getTodayInTimezone(user.timezone);

    // Fetch user habits
    const habits = await query<HabitRecord>(
      'SELECT * FROM habits WHERE user_id = $1 AND is_archived = FALSE ORDER BY created_at ASC',
      [user.id]
    );

    const checkpoints = await Promise.all(
      habits.map(async (habit) => {
        // First evaluate streak status
        const evaluated = await evaluateHabitStreak(habit, user.timezone);
        const lastCompleted = normalizeDate(evaluated.last_completed_date);
        const isCompletedToday = lastCompleted === today;

        // Templates & checklist
        const templates = await query<any>(
          'SELECT id, title FROM checklist_templates WHERE habit_id = $1 ORDER BY sort_order ASC',
          [habit.id]
        );

        const completions = await query<any>(
          'SELECT template_id, is_completed FROM checklist_completions WHERE habit_id = $1 AND date = $2',
          [habit.id, today]
        );
        const completedTemplateIds = new Set(
          completions.filter(c => c.is_completed).map(c => c.template_id)
        );

        const checklist = templates.map(t => ({
          id: t.id,
          title: t.title,
          is_completed: completedTemplateIds.has(t.id)
        }));

        const allChecklistCompleted = checklist.length === 0 || checklist.every(c => c.is_completed);
        const journeyDay = isCompletedToday ? evaluated.current_streak : evaluated.current_streak + 1;

        return {
          habit_id: habit.id,
          name: habit.name,
          category: habit.category,
          icon: habit.icon,
          color: habit.color,
          current_streak: evaluated.current_streak,
          longest_streak: evaluated.longest_streak,
          target_days: habit.target_days,
          journey_day: journeyDay,
          is_completed_today: isCompletedToday,
          all_checklist_completed: allChecklistCompleted,
          checklist
        };
      })
    );

    const totalActive = checkpoints.length;
    const completedToday = checkpoints.filter(c => c.is_completed_today).length;
    const percentage = totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0;

    return res.json({
      today,
      totalActive,
      completedToday,
      percentage,
      checkpoints
    });
  } catch (error) {
    console.error('Get today checkpoints error:', error);
    return res.status(500).json({ error: 'Failed to retrieve checkpoints' });
  }
});

// POST /api/checkpoints/checklist/toggle - Toggle checklist item for today
router.post('/checklist/toggle', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { habit_id, template_id, is_completed } = req.body;

    if (!habit_id || !template_id) {
      return res.status(400).json({ error: 'habit_id and template_id are required' });
    }

    const today = getTodayInTimezone(user.timezone);

    // Verify template belongs to user's habit
    const template = await queryOne<any>(
      `SELECT ct.id FROM checklist_templates ct
       JOIN habits h ON ct.habit_id = h.id
       WHERE ct.id = $1 AND h.id = $2 AND h.user_id = $3`,
      [template_id, habit_id, user.id]
    );

    if (!template) {
      return res.status(404).json({ error: 'Checklist task not found' });
    }

    const completionId = `clc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Upsert completion record for today
    await query(
      `INSERT INTO checklist_completions (id, habit_id, template_id, user_id, date, is_completed, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (habit_id, template_id, date)
       DO UPDATE SET is_completed = $6, completed_at = CURRENT_TIMESTAMP`,
      [completionId, habit_id, template_id, user.id, today, Boolean(is_completed)]
    );

    // Return current completion state of all items for this habit
    const allTemplates = await query<any>(
      'SELECT id, title FROM checklist_templates WHERE habit_id = $1 ORDER BY sort_order ASC',
      [habit_id]
    );
    const completions = await query<any>(
      'SELECT template_id, is_completed FROM checklist_completions WHERE habit_id = $1 AND date = $2',
      [habit_id, today]
    );
    const completedSet = new Set(completions.filter(c => c.is_completed).map(c => c.template_id));

    const checklist = allTemplates.map(t => ({
      id: t.id,
      title: t.title,
      is_completed: completedSet.has(t.id)
    }));

    const allChecklistCompleted = checklist.length === 0 || checklist.every(c => c.is_completed);

    return res.json({
      message: 'Checklist item updated',
      checklist,
      all_checklist_completed: allChecklistCompleted
    });
  } catch (error) {
    console.error('Checklist toggle error:', error);
    return res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

// POST /api/checkpoints/complete - Complete today's checkpoint strictly
router.post('/complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { habit_id, notes } = req.body;

    if (!habit_id) {
      return res.status(400).json({ error: 'habit_id is required' });
    }

    // 1. Fetch habit
    const habit = await queryOne<HabitRecord>(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [habit_id, user.id]
    );

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    if (habit.is_archived) {
      return res.status(400).json({ error: 'Cannot complete checkpoint for archived habit' });
    }

    // 2. Strict server-side date verification in user's IANA timezone
    const today = getTodayInTimezone(user.timezone);
    const yesterday = getYesterdayInTimezone(user.timezone);

    // 3. Evaluate any missed days before processing completion
    await evaluateHabitStreak(habit, user.timezone);

    // Reload habit post evaluation
    const updatedHabit = await queryOne<HabitRecord>(
      'SELECT * FROM habits WHERE id = $1',
      [habit_id]
    );
    if (!updatedHabit) return res.status(404).json({ error: 'Habit not found' });

    const lastCompleted = normalizeDate(updatedHabit.last_completed_date);

    // 4. Rule 10: Complete daily checkpoint only once
    if (lastCompleted === today) {
      return res.status(400).json({
        error: 'Today’s checkpoint has already been marked as completed. Duplicate completions are prohibited.'
      });
    }

    // 5. Rule 5 & Daily Habit Checklist check:
    // If habit has daily checklist items, verify all are checked
    const templates = await query<any>(
      'SELECT id FROM checklist_templates WHERE habit_id = $1',
      [habit_id]
    );

    if (templates.length > 0) {
      const todayChecks = await query<any>(
        'SELECT template_id FROM checklist_completions WHERE habit_id = $1 AND date = $2 AND is_completed = TRUE',
        [habit_id, today]
      );
      const completedIds = new Set(todayChecks.map(c => c.template_id));
      const incomplete = templates.some(t => !completedIds.has(t.id));

      if (incomplete) {
        return res.status(400).json({
          error: 'Daily checklist incomplete! All required tasks must be completed before the checkpoint can be marked.'
        });
      }
    }

    // 6. Calculate new streak:
    // If last completed was yesterday, streak increments by 1.
    // If not completed yesterday (e.g. Day 1, or after a reset), streak becomes 1.
    let newStreak = 1;
    if (lastCompleted === yesterday) {
      newStreak = updatedHabit.current_streak + 1;
    } else {
      newStreak = 1;
    }

    const newLongestStreak = Math.max(updatedHabit.longest_streak, newStreak);

    // 7. Insert completion record with unique constraint protection
    const completionId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      await query(
        `INSERT INTO daily_completions (id, habit_id, user_id, date, streak_number, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [completionId, habit_id, user.id, today, newStreak, notes || null]
      );
    } catch (dbErr: any) {
      if (dbErr.message && dbErr.message.includes('unique')) {
        return res.status(400).json({ error: 'Checkpoint for today was already recorded.' });
      }
      throw dbErr;
    }

    // 8. Update habit streak and last_completed_date
    await query(
      `UPDATE habits 
       SET current_streak = $1, longest_streak = $2, last_completed_date = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [newStreak, newLongestStreak, today, habit_id]
    );

    // 9. Check achievements
    const newlyUnlockedAchievements = await checkAndAwardAchievements(user.id, user.timezone);

    // 10. Motivational messages based on milestone
    let motivationalMessage = `Day ${newStreak} Completed. Keep showing up.`;
    if (newStreak === 1) {
      motivationalMessage = 'Day 1 conquered. The foundation of discipline is laid.';
    } else if (newStreak === 7) {
      motivationalMessage = '7 Days Unbroken! One week of unbreakable will.';
    } else if (newStreak === 30) {
      motivationalMessage = '30-Day Milestone reached! Discipline has forged a real habit.';
    } else if (newStreak === 100) {
      motivationalMessage = '100 DAYS! Elite tier discipline.';
    } else if (newStreak === 365) {
      motivationalMessage = '365 DAYS! 1 FULL YEAR WITHOUT SKIPPING A DAY. LEGENDARY.';
    }

    return res.json({
      message: 'Checkpoint marked successfully!',
      motivationalMessage,
      habit: {
        ...updatedHabit,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_completed_date: today,
        is_completed_today: true,
        journey_day: newStreak
      },
      newlyUnlockedAchievements
    });
  } catch (error) {
    console.error('Complete checkpoint error:', error);
    return res.status(500).json({ error: 'Failed to complete checkpoint' });
  }
});

export default router;

