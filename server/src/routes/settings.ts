import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, queryOne } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { isValidTimezone } from '../utils/timezone.js';
import { normalizeDate } from '../services/streakEngine.js';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  timezone: z.string().refine(isValidTimezone, 'Invalid IANA timezone identifier'),
  avatar: z.string().optional().nullable()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

// PUT /api/settings/profile - Update name, timezone, avatar
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const validated = updateProfileSchema.parse(req.body);

    await query(
      `UPDATE users 
       SET name = $1, timezone = $2, avatar = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [validated.name.trim(), validated.timezone, validated.avatar || null, user.id]
    );

    const updatedUser = await queryOne(
      'SELECT id, email, name, timezone, avatar FROM users WHERE id = $1',
      [user.id]
    );

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/settings/password - Change password
router.put('/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const validated = changePasswordSchema.parse(req.body);

    const userRecord = await queryOne<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id]
    );

    if (!userRecord) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(validated.currentPassword, userRecord.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(validated.newPassword, salt);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, user.id]
    );

    return res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/settings/attempts - View all historical habit attempts (Graveyard & memorial)
router.get('/attempts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const attempts = await query<any>(
      `SELECT sa.*, h.name as habit_name, h.category, h.color, h.icon
       FROM streak_attempts sa
       JOIN habits h ON sa.habit_id = h.id
       WHERE sa.user_id = $1
       ORDER BY sa.created_at DESC`,
      [user.id]
    );

    return res.json({
      attempts: attempts.map(a => ({
        ...a,
        start_date: normalizeDate(a.start_date),
        end_date: normalizeDate(a.end_date)
      }))
    });
  } catch (error) {
    console.error('Get attempts error:', error);
    return res.status(500).json({ error: 'Failed to retrieve streak history' });
  }
});

// DELETE /api/settings/account - Delete user account and all associated data
router.delete('/account', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    await query('DELETE FROM users WHERE id = $1', [user.id]);
    return res.json({ message: 'Account and all habit records have been permanently deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;

