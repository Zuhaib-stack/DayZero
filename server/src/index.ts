import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { getDb, query } from './db/index.js';
import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';
import checkpointRoutes from './routes/checkpoints.js';
import analyticsRoutes from './routes/analytics.js';
import achievementRoutes from './routes/achievements.js';
import notificationRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import { evaluateUserHabits } from './services/streakEngine.js';

const app = express();

// Middlewares
const allowedOrigins = [
  /\.vercel\.app$/,
  /\.railway\.app$/,
  /\.onrender\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(pattern => pattern.test(origin));
    if (allowed || process.env.ALLOWED_ORIGIN === origin) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    appName: 'DayZero API',
    tagline: 'Discipline Over Motivation',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if available
import path from 'path';
import fs from 'fs';

const clientDistPath = fs.existsSync(path.resolve(process.cwd(), 'client', 'dist'))
  ? path.resolve(process.cwd(), 'client', 'dist')
  : path.resolve(process.cwd(), '..', 'client', 'dist');

if (fs.existsSync(clientDistPath)) {
  console.log(`Serving static production client from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Periodic background worker to check midnight resets even when users are logged out
async function runBackgroundMidnightEvaluation() {
  try {
    const users = await query<{ id: string; timezone: string }>('SELECT id, timezone FROM users');
    for (const u of users) {
      await evaluateUserHabits(u.id, u.timezone || 'UTC');
    }
  } catch (err) {
    console.error('Error in background midnight streak evaluation:', err);
  }
}

// Start server
async function start() {
  try {
    await getDb();
    console.log('Database connected and initialized successfully.');

    // Run background check every 10 minutes
    setInterval(runBackgroundMidnightEvaluation, 10 * 60 * 1000);
    // And run once immediately on startup
    runBackgroundMidnightEvaluation();

    app.listen(config.port, () => {
      console.log(`DayZero backend server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to initialize DayZero server:', error);
    process.exit(1);
  }
}

start();
