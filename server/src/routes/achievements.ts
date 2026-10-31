import { Router, Response } from 'express';
import { query, queryOne } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { checkAndAwardAchievements } from '../services/achievementEngine.js';

const router = Router();

// GET /api/achievements - List all badges and user progress
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    // Check if any pending achievements qualify
    await checkAndAwardAchievements(user.id, user.timezone);

    // Fetch all achievements with unlock details if completed
    const achievements = await query<any>(
      `SELECT a.*, ua.unlocked_at, 
              CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as is_unlocked
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       ORDER BY a.milestone_days ASC, a.title ASC`,
      [user.id]
    );

    // Get current max streak for progress calculation
    const maxStreakRes = await queryOne<{ max_streak: number | null }>(
      'SELECT MAX(longest_streak) as max_streak FROM habits WHERE user_id = $1',
      [user.id]
    );
    const maxStreak = maxStreakRes?.max_streak || 0;

    const enriched = achievements.map(a => {
      let progress = 0;
      if (a.is_unlocked) {
        progress = 100;
      } else if (a.milestone_days > 0) {
        progress = Math.min(100, Math.round((maxStreak / a.milestone_days) * 100));
      }
      return {
        ...a,
        progress,
        currentMaxStreak: maxStreak
      };
    });

    const unlockedCount = enriched.filter(a => a.is_unlocked).length;
    const totalCount = enriched.length;

    return res.json({
      achievements: enriched,
      unlockedCount,
      totalCount,
      completionRate: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0
    });
  } catch (error) {
    console.error('Achievements error:', error);
    return res.status(500).json({ error: 'Failed to retrieve achievements' });
  }
});

export default router;

