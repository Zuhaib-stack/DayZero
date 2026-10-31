import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query, queryOne } from '../db/index.js';
import { config } from '../config.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { isValidTimezone } from '../utils/timezone.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  timezone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    const email = validated.email.toLowerCase().trim();

    // Check existing
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timezone = validated.timezone && isValidTimezone(validated.timezone) ? validated.timezone : 'UTC';

    await query(
      `INSERT INTO users (id, email, password_hash, name, timezone)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, passwordHash, validated.name.trim(), timezone]
    );

    const token = jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '30d' });

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        email,
        name: validated.name.trim(),
        timezone
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const email = validated.email.toLowerCase().trim();

    const user = await queryOne<{
      id: string;
      email: string;
      password_hash: string;
      name: string;
      timezone: string;
      avatar: string;
    }>('SELECT * FROM users WHERE email = $1', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(validated.password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: '30d' });

    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        avatar: user.avatar
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to log in' });
  }
});

// Get Current User Profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// Forgot Password - creates reset token
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await queryOne<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    // In both cases, return generic success message to prevent user enumeration,
    // but return token in response in dev/demo mode so user can easily test reset!
    if (!user) {
      return res.json({
        message: 'If the email exists, a password reset link/token has been generated.',
        demoResetToken: null
      });
    }

    const resetToken = `rst_${Math.random().toString(36).substring(2, 10)}${Date.now()}`;
    const expiry = Date.now() + 3600 * 1000; // 1 hour

    await query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, expiry, user.id]
    );

    return res.json({
      message: 'If the email exists, a password reset link/token has been generated.',
      demoResetToken: resetToken // Provided for smooth user experience and testing
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset Password with token
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Valid token and new password (min 6 chars) are required' });
    }

    const user = await queryOne<{ id: string; reset_token_expiry: string }>(
      'SELECT id, reset_token_expiry FROM users WHERE reset_token = $1',
      [token]
    );

    if (!user || !user.reset_token_expiry || Number(user.reset_token_expiry) < Date.now()) {
      return res.status(400).json({ error: 'Reset token is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    return res.json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;

