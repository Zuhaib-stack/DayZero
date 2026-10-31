import { Router, Response } from 'express';
import { query } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications - List all notifications
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const notifications = await query<any>(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [user.id]
    );

    const unreadCount = notifications.filter(n => !n.is_read).length;
    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/:id/read - Mark one notification as read
router.post('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, user.id]
    );

    return res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [user.id]
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Read all notifications error:', error);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;

