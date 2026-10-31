import { Router, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getTodayInTimezone, getSecondsUntilMidnight } from '../utils/timezone.js';
import { evaluateHabitStreak, evaluateUserHabits, normalizeDate } from '../services/streakEngine.js';
import { checkAndAwardAchievements } from '../services/achievementEngine.js';

const router = Router();

// Validation for habit creation
const createHabitSchema = z.object({
  name: z.string().min(1, 'Habit name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.string().default('General'),
  icon: z.string().default('Flame'),
  color: z.string().default('#8b5cf6'),
  start_date: z.string().optional(),
  target_days: z.number().int().min(0).default(0),
  reminder_time: z.string().optional().nullable(),
  checklist_items: z.array(z.string().min(1)).optional()
});

// GET /api/habits - List habits with live streak status
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const today = getTodayInTimezone(user.timezone);
    const secondsRemaining = getSecondsUntilMidnight(user.timezone);

    // Run strict automatic missed-day detection & streak resets
    await evaluateUserHabits(user.id, user.timezone);

    // Fetch all active habits
    const habits = await query<any>(
      `SELECT * FROM habits 
       WHERE user_id = $1 AND is_archived = FALSE 
       ORDER BY created_at DESC`,
      [user.id]
    );

    // For each habit, attach today's completion state, checklist items, and journey day
    const habitCards = await Promise.all(
      habits.map(async (habit) => {
        const lastCompleted = normalizeDate(habit.last_completed_date);
        const isCompletedToday = lastCompleted === today;

        // Journey day: If completed today, it's habit.current_streak.
        // If not completed today, today is Day (current_streak + 1).
        const journeyDay = isCompletedToday ? habit.current_streak : habit.current_streak + 1;

        // Fetch checklist templates
        const templates = await query<any>(
          `SELECT id, title, sort_order 
           FROM checklist_templates 
           WHERE habit_id = $1 
           ORDER BY sort_order ASC, created_at ASC`,
          [habit.id]
        );

        // Fetch today's checklist completions
        const completions = await query<any>(
          `SELECT template_id, is_completed 
           FROM checklist_completions 
           WHERE habit_id = $1 AND date = $2`,
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

        return {
          ...habit,
          start_date: normalizeDate(habit.start_date),
          last_completed_date: lastCompleted,
          is_completed_today: isCompletedToday,
          journey_day: journeyDay,
          all_checklist_completed: allChecklistCompleted,
          checklist,
          seconds_until_midnight: secondsRemaining
        };
      })
    );

    return res.json({ habits: habitCards, today, secondsRemaining });
  } catch (error) {
    console.error('List habits error:', error);
    return res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// POST /api/habits - Create a new habit
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const validated = createHabitSchema.parse(req.body);
    const today = getTodayInTimezone(user.timezone);
    const startDate = validated.start_date || today;

    const habitId = `hbt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await query(
      `INSERT INTO habits (id, user_id, name, description, category, icon, color, start_date, target_days, reminder_time, current_streak, longest_streak)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0)`,
      [
        habitId,
        user.id,
        validated.name.trim(),
        validated.description?.trim() || null,
        validated.category,
        validated.icon,
        validated.color,
        startDate,
        validated.target_days,
        validated.reminder_time || null
      ]
    );

    // Insert checklist items if provided
    if (validated.checklist_items && validated.checklist_items.length > 0) {
      for (let i = 0; i < validated.checklist_items.length; i++) {
        const itemTitle = validated.checklist_items[i].trim();
        if (itemTitle) {
          const tmplId = `tmpl_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
          await query(
            `INSERT INTO checklist_templates (id, habit_id, title, sort_order)
             VALUES ($1, $2, $3, $4)`,
            [tmplId, habitId, itemTitle, i]
          );
        }
      }
    }

    // Check achievement for first step
    await checkAndAwardAchievements(user.id, user.timezone);

    const createdHabit = await queryOne('SELECT * FROM habits WHERE id = $1', [habitId]);
    return res.status(201).json({
      message: 'Habit created successfully. Day 1 of your journey begins today.',
      habit: {
        ...createdHabit,
        start_date: normalizeDate(createdHabit.start_date),
        journey_day: 1,
        is_completed_today: false
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create habit error:', error);
    return res.status(500).json({ error: 'Failed to create habit' });
  }
});

// GET /api/habits/:id - Detailed habit view
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const habit = await queryOne<any>(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [id, user.id]
    );

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Evaluate streak for this habit
    await evaluateHabitStreak(habit, user.timezone);

    const today = getTodayInTimezone(user.timezone);
    const lastCompleted = normalizeDate(habit.last_completed_date);
    const isCompletedToday = lastCompleted === today;

    // Checklist templates
    const templates = await query<any>(
      'SELECT id, title, sort_order FROM checklist_templates WHERE habit_id = $1 ORDER BY sort_order ASC',
      [habit.id]
    );

    // Checklist completions for today
    const checklistCompletions = await query<any>(
      'SELECT template_id, is_completed FROM checklist_completions WHERE habit_id = $1 AND date = $2',
      [habit.id, today]
    );
    const completedSet = new Set(checklistCompletions.filter(c => c.is_completed).map(c => c.template_id));

    // Daily completions history (for heatmap/calendar)
    const completionsHistory = await query<any>(
      `SELECT date, streak_number, completed_at, notes 
       FROM daily_completions 
       WHERE habit_id = $1 
       ORDER BY date DESC`,
      [habit.id]
    );

    // Historical failed attempts (read-only memorial graveyard)
    const previousAttempts = await query<any>(
      `SELECT * FROM streak_attempts 
       WHERE habit_id = $1 
       ORDER BY attempt_number DESC`,
      [habit.id]
    );

    return res.json({
      habit: {
        ...habit,
        start_date: normalizeDate(habit.start_date),
        last_completed_date: lastCompleted,
        is_completed_today: isCompletedToday,
        journey_day: isCompletedToday ? habit.current_streak : habit.current_streak + 1
      },
      checklist: templates.map(t => ({
        id: t.id,
        title: t.title,
        is_completed: completedSet.has(t.id)
      })),
      completions: completionsHistory.map(c => ({
        ...c,
        date: normalizeDate(c.date)
      })),
      previousAttempts: previousAttempts.map(a => ({
        ...a,
        start_date: normalizeDate(a.start_date),
        end_date: normalizeDate(a.end_date)
      }))
    });
  } catch (error) {
    console.error('Get habit details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve habit' });
  }
});

// PUT /api/habits/:id - Edit habit
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const validated = createHabitSchema.parse(req.body);

    const existing = await queryOne('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [id, user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    await query(
      `UPDATE habits 
       SET name = $1, description = $2, category = $3, icon = $4, color = $5, target_days = $6, reminder_time = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9`,
      [
        validated.name.trim(),
        validated.description?.trim() || null,
        validated.category,
        validated.icon,
        validated.color,
        validated.target_days,
        validated.reminder_time || null,
        id,
        user.id
      ]
    );

    // If checklist_items provided, sync checklist templates
    if (validated.checklist_items) {
      // Remove existing templates and replace with new ones
      await query('DELETE FROM checklist_templates WHERE habit_id = $1', [id]);
      for (let i = 0; i < validated.checklist_items.length; i++) {
        const itemTitle = validated.checklist_items[i].trim();
        if (itemTitle) {
          const tmplId = `tmpl_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
          await query(
            `INSERT INTO checklist_templates (id, habit_id, title, sort_order)
             VALUES ($1, $2, $3, $4)`,
            [tmplId, id, itemTitle, i]
          );
        }
      }
    }

    return res.json({ message: 'Habit updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update habit error:', error);
    return res.status(500).json({ error: 'Failed to update habit' });
  }
});

// POST /api/habits/:id/archive - Toggle archive
router.post('/:id/archive', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const habit = await queryOne<any>('SELECT is_archived FROM habits WHERE id = $1 AND user_id = $2', [id, user.id]);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const newStatus = !habit.is_archived;
    await query('UPDATE habits SET is_archived = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, id]);

    return res.json({
      message: newStatus ? 'Habit archived' : 'Habit unarchived',
      is_archived: newStatus
    });
  } catch (error) {
    console.error('Archive habit error:', error);
    return res.status(500).json({ error: 'Failed to archive habit' });
  }
});

// DELETE /api/habits/:id - Delete habit permanently
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const result = await query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [id, user.id]);
    return res.json({ message: 'Habit and associated history deleted permanently' });
  } catch (error) {
    console.error('Delete habit error:', error);
    return res.status(500).json({ error: 'Failed to delete habit' });
  }
});

export default router;

