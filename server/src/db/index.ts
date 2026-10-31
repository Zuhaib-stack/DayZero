import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  if (config.databaseUrl) {
    console.log('Connecting to external PostgreSQL database...');
    const pool = new Pool({ connectionString: config.databaseUrl });
    dbInstance = {
      query: async (text: string, params?: any[]) => {
        const res = await pool.query(text, params);
        return { rows: res.rows };
      },
      close: async () => {
        await pool.end();
      }
    };
  } else {
    // Ensure data directory exists
    const dir = path.dirname(config.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    console.log(`Initializing embedded PostgreSQL (PGlite) at ${config.dbPath}...`);
    const pglite = new PGlite(config.dbPath);
    await pglite.waitReady;
    dbInstance = {
      query: async (text: string, params?: any[]) => {
        const res = await pglite.query(text, params);
        return { rows: res.rows };
      },
      close: async () => {
        await pglite.close();
      }
    };
  }

  await initSchema();
  return dbInstance;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const db = await getDb();
  const res = await db.query(sql, params);
  return res.rows as T[];
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

async function initSchema() {
  console.log('Running database migrations and initialization...');

  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      avatar TEXT,
      reset_token TEXT,
      reset_token_expiry BIGINT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Habits table
  await query(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'General',
      icon TEXT NOT NULL DEFAULT 'Flame',
      color TEXT NOT NULL DEFAULT '#8b5cf6',
      start_date DATE NOT NULL,
      target_days INTEGER DEFAULT 0,
      reminder_time TEXT,
      is_archived BOOLEAN DEFAULT FALSE,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_completed_date DATE,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Checklist template items for habits
  await query(`
    CREATE TABLE IF NOT EXISTS checklist_templates (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Daily completions (the core checkpoints)
  await query(`
    CREATE TABLE IF NOT EXISTS daily_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      streak_number INTEGER NOT NULL,
      completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_habit_daily_completion UNIQUE (habit_id, date)
    );
  `);

  // Daily checklist subtask completions
  await query(`
    CREATE TABLE IF NOT EXISTS checklist_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      template_id TEXT NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      is_completed BOOLEAN DEFAULT TRUE,
      completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_checklist_completion UNIQUE (habit_id, template_id, date)
    );
  `);

  // Streak attempts / memorial graveyard for historical resets
  await query(`
    CREATE TABLE IF NOT EXISTS streak_attempts (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      attempt_number INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      days_completed INTEGER NOT NULL,
      termination_reason TEXT DEFAULT 'Missed checkpoint',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Achievements catalog
  await query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      badge_icon TEXT NOT NULL,
      milestone_days INTEGER DEFAULT 0,
      category TEXT NOT NULL
    );
  `);

  // User unlocked achievements
  await query(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      unlocked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
    );
  `);

  // Notifications
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default achievements if empty
  await seedAchievements();
}

async function seedAchievements() {
  const existing = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM achievements');
  if (existing && parseInt(existing.count, 10) > 0) return;

  const defaultAchievements = [
    {
      id: 'ach-first-step',
      key: 'first_step',
      title: 'First Step',
      description: 'Created your very first habit. The journey begins.',
      badge_icon: 'Compass',
      milestone_days: 0,
      category: 'onboarding'
    },
    {
      id: 'ach-day-1',
      key: 'day_1_done',
      title: 'Day 1 Conquered',
      description: 'Completed your first daily checkpoint. Discipline over motivation.',
      badge_icon: 'CheckCircle2',
      milestone_days: 1,
      category: 'streak'
    },
    {
      id: 'ach-streak-7',
      key: 'streak_7',
      title: 'The 7-Day Iron Will',
      description: 'Maintained an unbroken 7-day streak. You survived the first week.',
      badge_icon: 'Zap',
      milestone_days: 7,
      category: 'streak'
    },
    {
      id: 'ach-streak-14',
      key: 'streak_14',
      title: 'Fortitude 14',
      description: 'Two consecutive weeks of zero skipped days.',
      badge_icon: 'ShieldCheck',
      milestone_days: 14,
      category: 'streak'
    },
    {
      id: 'ach-streak-30',
      key: 'streak_30',
      title: '30-Day Habit Former',
      description: 'A full month of absolute consistency. Neurons rewired.',
      badge_icon: 'Award',
      milestone_days: 30,
      category: 'streak'
    },
    {
      id: 'ach-streak-60',
      key: 'streak_60',
      title: 'Diamond 60',
      description: '60 days without an excuse. You are becoming unrecognizable.',
      badge_icon: 'Gem',
      milestone_days: 60,
      category: 'streak'
    },
    {
      id: 'ach-streak-100',
      key: 'streak_100',
      title: 'Centurion (100 Days)',
      description: '100 days of relentless execution. Elite discipline.',
      badge_icon: 'Trophy',
      milestone_days: 100,
      category: 'streak'
    },
    {
      id: 'ach-streak-365',
      key: 'streak_365',
      title: 'Immortal 365 (1 Year)',
      description: 'An entire year without missing a single day. Legend status.',
      badge_icon: 'Crown',
      milestone_days: 365,
      category: 'streak'
    },
    {
      id: 'ach-phoenix',
      key: 'phoenix_restart',
      title: 'The Phoenix',
      description: 'Suffered a reset to Day 1 and immediately got back up and completed today.',
      badge_icon: 'Flame',
      milestone_days: 0,
      category: 'resilience'
    },
    {
      id: 'ach-flawless-day',
      key: 'flawless_day',
      title: 'Flawless Routine',
      description: 'Completed all active habits and daily checklists in a single day.',
      badge_icon: 'Sparkles',
      milestone_days: 0,
      category: 'completion'
    }
  ];

  for (const ach of defaultAchievements) {
    await query(
      `INSERT INTO achievements (id, key, title, description, badge_icon, milestone_days, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (key) DO NOTHING`,
      [ach.id, ach.key, ach.title, ach.description, ach.badge_icon, ach.milestone_days, ach.category]
    );
  }
  console.log('Achievements seeded successfully.');
}

