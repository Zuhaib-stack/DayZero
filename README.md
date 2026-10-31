# DayZero — Discipline Over Motivation

> **"Complete your daily habits, build your streak, and never skip a day. If you miss a day, your streak resets to Day 1."**

**DayZero** is a modern, dark-themed, zero-tolerance habit tracking application engineered for people who demand relentless consistency. Unlike conventional habit trackers that allow pausing, backdating, or lenient rest days, DayZero operates on strict server-enforced accountability: **earn every day before midnight in your timezone, or restart from Day 1.**

---

## ⚡ Core Rules & Architecture

1. **Day 1 Baseline**: Every new habit begins at Day 1.
2. **Current Calendar Day Only**: Checkpoints can only be completed on the current calendar day in the user's configured IANA timezone.
3. **No Backdating or Future Marking**: Cheating is eliminated through server-side date validation.
4. **The Zero-Tolerance Reset**: Failing to complete a daily checkpoint before 11:59:59 PM automatically breaks the streak and resets that specific habit to Day 1.
5. **Streak Memorial Graveyard**: Historical broken streaks are permanently preserved in a read-only archive (showing days achieved, dates active, and reason for reset) without counting towards the new streak.
6. **Multi-Task Daily Checklists**: Habits can include daily checklists. Today's main checkpoint remains locked until all required subtasks are verified.
7. **Idempotent Single Checkpoint**: Each habit's checkpoint can only be recorded once per calendar day, protected by database unique constraints.
8. **Automatic Server-Side Logic**: Missed deadlines and streak resets evaluate automatically server-side even when users are logged out.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Canvas Confetti
- **Charts**: Recharts (Volume Area chart, Category distribution, Heatmaps)
- **Audio**: Web Audio API synthesizer tones (task clicks and victory fanfare)
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with embedded zero-dependency PGlite (or external PostgreSQL via `DATABASE_URL`)
- **Authentication**: JWT, bcrypt password hashing, reset token flow, IANA timezone support

---

## 🚀 Quick Start & How to Run

### Option 1: Unified Server (Frontend + Backend on Port 5000)
Run the entire application with a single command:
```bash
npm start
```
Open **`http://localhost:5000`** in your browser.

### Option 2: Development Mode (Vite Hot-Reload + Backend Watcher)
In terminal 1 (Backend API on port 5000):
```bash
cd server
npm run dev
```

In terminal 2 (Vite Dev Server on port 5173 with proxy to 5000):
```bash
cd client
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📁 Project Structure

```
d:\App
├── client/
│   ├── src/
│   │   ├── components/       # Navbar, HabitCard, HabitModal, CelebrationModal, etc.
│   │   ├── context/          # AuthContext (JWT auth state)
│   │   ├── services/         # API client & fetch wrapper
│   │   ├── types/            # TypeScript data contracts
│   │   ├── utils/            # Confetti, Web Audio synthesizer, Icons, Timezone helpers
│   │   ├── views/            # Landing, Dashboard, Checkpoints, Habits, Calendar, Analytics, Achievements, Settings
│   │   ├── App.tsx           # Main application router and state coordinator
│   │   └── main.tsx          # React entry point
│   └── dist/                 # Production-built client bundle
├── server/
│   ├── src/
│   │   ├── db/               # PostgreSQL schema migrations & initialization (PGlite / pg)
│   │   ├── middleware/       # JWT Auth verification
│   │   ├── routes/           # Auth, Habits, Checkpoints, Analytics, Achievements, Notifications, Settings
│   │   ├── services/         # Strict StreakEngine & AchievementEngine
│   │   ├── utils/            # IANA timezone calculations & midnight countdowns
│   │   └── index.ts          # Express server with background midnight reset runner
│   └── data/                 # Persistent disk storage for embedded PostgreSQL
└── package.json              # Monorepo task orchestration
```

---

## 🔒 Strict Checkpoint API Reference

- `POST /api/auth/register` — Create user account with name, email, password, and IANA timezone.
- `POST /api/auth/login` — Authenticate and receive JWT token.
- `GET /api/habits` — Fetch habits with live streak status, journey day, and midnight countdown.
- `POST /api/habits` — Create new habit with custom icon, color, category, target days, and checklist subtasks.
- `POST /api/checkpoints/checklist/toggle` — Check or uncheck a task for today.
- `POST /api/checkpoints/complete` — Verify and record today's checkpoint (locks if checklist is incomplete or if already marked).
- `GET /api/analytics/dashboard` — Live dashboard summary stats & daily quote.
- `GET /api/analytics/calendar` — GitHub-style contribution calendar data (completed, missed, current day).
- `GET /api/analytics/charts` — Trend charts and historical streak attempts.
- `GET /api/achievements` — Unlocked and milestone badges (7, 14, 30, 60, 100, 365 days).
- `PUT /api/settings/profile` — Update name and IANA timezone.

---

## 🏆 Badges & Gamification

- **First Step**: Created your very first habit.
- **Day 1 Conquered**: Earned your first checkpoint.
- **The 7-Day Iron Will**: 7 consecutive days without skipping.
- **Fortitude 14**: 2 weeks unbroken.
- **30-Day Habit Former**: 1 full month of consistency.
- **Diamond 60**: 60 days of relentless execution.
- **Centurion (100 Days)**: 100 days of elite discipline.
- **Immortal 365 (1 Year)**: An entire year without missing a single day.
- **The Phoenix**: Suffered a reset to Day 1, immediately got back up, and completed today.
- **Flawless Routine**: Completed every active habit and checklist item in a single day.

