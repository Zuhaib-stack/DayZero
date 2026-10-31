import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { api } from './services/api.js';
import { Habit, DashboardStats, Achievement } from './types/index.js';
import { Navbar } from './components/Navbar.js';
import { LandingView } from './views/LandingView.js';
import { DashboardView } from './views/DashboardView.js';
import { CheckpointsView } from './views/CheckpointsView.js';
import { HabitsView } from './views/HabitsView.js';
import { CalendarView } from './views/CalendarView.js';
import { AnalyticsView } from './views/AnalyticsView.js';
import { AchievementsView } from './views/AchievementsView.js';
import { SettingsView } from './views/SettingsView.js';
import { HabitModal } from './components/HabitModal.js';
import { HabitDetailModal } from './components/HabitDetailModal.js';
import { CelebrationModal } from './components/CelebrationModal.js';
import { AuthModal } from './components/AuthModal.js';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Navigation
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Habit & Dashboard State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailHabit, setSelectedDetailHabit] = useState<Habit | null>(null);

  // Celebration Modal
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    streakNumber: number;
    habitName: string;
    motivationalMessage: string;
    unlockedAchievements: Achievement[];
  }>({
    streakNumber: 1,
    habitName: '',
    motivationalMessage: '',
    unlockedAchievements: []
  });

  // Ticker for midnight countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch habits and stats when logged in
  useEffect(() => {
    if (user) {
      loadHabitsAndStats();
    }
  }, [user]);

  const loadHabitsAndStats = async () => {
    try {
      setLoadingData(true);
      const [habitsRes, statsRes] = await Promise.all([
        api.getHabits(),
        api.getDashboardStats().catch(() => null)
      ]);
      setHabits(habitsRes.habits);
      setSecondsRemaining(habitsRes.secondsRemaining || 0);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Actions
  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenCreateHabit = () => {
    setEditingHabit(null);
    setHabitModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitModalOpen(true);
  };

  const handleViewDetails = (habit: Habit) => {
    setSelectedDetailHabit(habit);
    setDetailModalOpen(true);
  };

  const handleSaveHabit = async (habitData: any) => {
    if (editingHabit) {
      await api.updateHabit(editingHabit.id, habitData);
    } else {
      await api.createHabit(habitData);
    }
    await loadHabitsAndStats();
  };

  const handleArchiveHabit = async (habitId: string) => {
    await api.toggleArchiveHabit(habitId);
    await loadHabitsAndStats();
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit and all its history?')) {
      await api.deleteHabit(habitId);
      await loadHabitsAndStats();
    }
  };

  const handleToggleChecklist = async (habitId: string, templateId: string, isCompleted: boolean) => {
    const res = await api.toggleChecklistItem({ habit_id: habitId, template_id: templateId, is_completed: isCompleted });
    setHabits(prev =>
      prev.map(h => {
        if (h.id === habitId) {
          return {
            ...h,
            checklist: res.checklist,
            all_checklist_completed: res.all_checklist_completed
          };
        }
        return h;
      })
    );
  };

  const handleCompleteHabit = async (habitId: string, notes?: string) => {
    const res = await api.completeCheckpoint({ habit_id: habitId, notes });
    
    // Trigger celebration dialog
    setCelebrationData({
      streakNumber: res.habit.current_streak,
      habitName: res.habit.name,
      motivationalMessage: res.motivationalMessage,
      unlockedAchievements: res.newlyUnlockedAchievements || []
    });
    setCelebrationOpen(true);

    // Refresh state
    await loadHabitsAndStats();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-gray-400 tracking-wider">INITIALIZING DAYZERO...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the premium Landing View!
  if (!user) {
    return (
      <>
        <LandingView onOpenAuth={handleOpenAuth} />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authMode}
        />
      </>
    );
  }

  // Logged-in App shell
  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        secondsUntilMidnight={secondsRemaining}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentView === 'dashboard' && (
          <DashboardView
            habits={habits}
            stats={stats}
            secondsRemaining={secondsRemaining}
            onCompleteHabit={handleCompleteHabit}
            onToggleChecklist={handleToggleChecklist}
            onOpenCreateHabit={handleOpenCreateHabit}
            onEditHabit={handleEditHabit}
            onViewDetails={handleViewDetails}
            onArchiveHabit={handleArchiveHabit}
            onDeleteHabit={handleDeleteHabit}
            onNavigateToCheckpoints={() => setCurrentView('checkpoints')}
          />
        )}

        {currentView === 'checkpoints' && (
          <CheckpointsView
            habits={habits}
            secondsRemaining={secondsRemaining}
            onCompleteHabit={handleCompleteHabit}
            onToggleChecklist={handleToggleChecklist}
          />
        )}

        {currentView === 'habits' && (
          <HabitsView
            habits={habits}
            onOpenCreateHabit={handleOpenCreateHabit}
            onEditHabit={handleEditHabit}
            onViewDetails={handleViewDetails}
            onArchiveHabit={handleArchiveHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        )}

        {currentView === 'calendar' && <CalendarView habits={habits} />}

        {currentView === 'analytics' && <AnalyticsView habits={habits} />}

        {currentView === 'achievements' && <AchievementsView />}

        {currentView === 'settings' && <SettingsView />}
      </main>

      {/* Modals */}
      <HabitModal
        isOpen={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
        onSubmit={handleSaveHabit}
        initialData={editingHabit}
      />

      <HabitDetailModal
        habit={selectedDetailHabit}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />

      <CelebrationModal
        isOpen={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        streakNumber={celebrationData.streakNumber}
        habitName={celebrationData.habitName}
        motivationalMessage={celebrationData.motivationalMessage}
        unlockedAchievements={celebrationData.unlockedAchievements}
      />
    </div>
  );
};

