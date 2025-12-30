import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import ClockWidget from '@/components/ClockWidget';
import HabitTable from '@/components/HabitTable';
import HabitStatistics from '@/components/HabitStatistics';
import HabitGoals from '@/components/HabitGoals';
import AddHabitRow from '@/components/AddHabitRow';
import DailySchedule from '@/components/DailySchedule';
import MotivationModal from '@/components/MotivationModal';
import NotificationPrompt from '@/components/NotificationPrompt';
import NotificationSettings from '@/components/NotificationSettings';
import PomodoroTimer from '@/components/PomodoroTimer';
import ThemeToggle from '@/components/ThemeToggle';
import Reminders from '@/components/Reminders';
import UserMenu from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/hooks/useDataSync';
import { useNotifications, NotificationPreferences } from '@/hooks/useNotifications';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
  category?: string;
  weeklyGoal?: number;
}

interface ScheduleItem {
  id: string;
  time: string;
  task: string;
  emoji?: string;
  completed?: boolean;
}

interface Reminder {
  id: string;
  day: string;
  time: string;
  name: string;
  emoji: string;
  completed?: boolean;
}

const defaultHabits: Habit[] = [
  { id: '1', name: 'clean desk', icon: '🧹', completedDays: Array(7).fill(false), activeDays: Array(7).fill(true) },
  { id: '2', name: 'check into notion', icon: '💻', completedDays: Array(7).fill(false), activeDays: Array(7).fill(true) },
  { id: '3', name: 'journal', icon: '📝', completedDays: Array(7).fill(false), activeDays: Array(7).fill(true) },
  { id: '4', name: 'exercise', icon: '💪', completedDays: Array(7).fill(false), activeDays: [true, true, true, true, true, false, false] },
  { id: '5', name: 'drink water', icon: '💧', completedDays: Array(7).fill(false), activeDays: Array(7).fill(true) },
  { id: '6', name: 'meditate', icon: '🧘', completedDays: Array(7).fill(false), activeDays: Array(7).fill(true) },
  { id: '7', name: 'listen to uplifting music', icon: '🎵', completedDays: Array(7).fill(false), activeDays: Array(7).fill(true) },
  { id: '8', name: 'brush hair', icon: '💇', completedDays: Array(7).fill(false), activeDays: Array(7).fill(true) },
  { id: '9', name: 'shower', icon: '🚿', completedDays: Array(7).fill(false), activeDays: Array(7).fill(true) },
  { id: '10', name: 'skin care', icon: '😊', completedDays: Array(7).fill(false), activeDays: Array(7).fill(true) },
  { id: '11', name: 'brush teeth', icon: '🦷', completedDays: Array(7).fill(false), activeDays: Array(7).fill(true) },
  { id: '12', name: 'style hair', icon: '💇', completedDays: Array(7).fill(false), activeDays: [true, false, false, true, false, false, false] },
];

const defaultSchedule: ScheduleItem[] = [
  { id: '1', time: '05:00', task: 'morning ritual', emoji: '🌅' },
  { id: '2', time: '09:00', task: 'cleaning ritual', emoji: '🧹' },
  { id: '3', time: '11:00', task: 'prepare lunch', emoji: '🍳' },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    fetchHabits, saveHabits, 
    fetchSchedule, saveSchedule, 
    fetchReminders, saveReminders, 
    fetchSettings, saveSettings,
    migrateLocalData 
  } = useDataSync();
  
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('habits-v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((h: any) => ({
        ...h,
        activeDays: h.activeDays || Array(7).fill(true)
      }));
    }
    return defaultHabits;
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('schedule');
    return saved ? JSON.parse(saved) : defaultSchedule;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => {
    const saved = localStorage.getItem('notificationPrefs');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      reminderTime: 5,
      habitCompletions: true,
      dailyReminder: true,
      scheduleReminders: true,
      customReminders: true,
      eyeBlinkReminders: false,
      waterIntakeReminders: false,
    };
  });

  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const today = new Date();

  // Initialize notifications
  const { notifyHabitComplete } = useNotifications(reminders, schedule, notificationPrefs);

  // Reset dataLoaded when user changes (login/logout)
  useEffect(() => {
    if (user?.id !== lastUserId) {
      setDataLoaded(false);
      setLastUserId(user?.id || null);
    }
  }, [user?.id, lastUserId]);

  // Load data from cloud when user logs in
  useEffect(() => {
    if (user && !dataLoaded && !authLoading) {
      const loadCloudData = async () => {
        try {
          // First try to migrate local data
          await migrateLocalData();
          
          // Then fetch from cloud
          const [cloudHabits, cloudSchedule, cloudReminders, cloudSettings] = await Promise.all([
            fetchHabits(),
            fetchSchedule(),
            fetchReminders(),
            fetchSettings()
          ]);
          
          // Always update from cloud data (even if empty - user might have cleared everything)
          if (cloudHabits.length > 0) {
            setHabits(cloudHabits);
          }
          if (cloudSchedule.length > 0) {
            setSchedule(cloudSchedule);
          }
          if (cloudReminders.length > 0) {
            setReminders(cloudReminders);
          }
          if (cloudSettings) {
            setNotificationPrefs(cloudSettings);
          }
          
          setDataLoaded(true);
        } catch (error) {
          console.error('Error loading cloud data:', error);
          setDataLoaded(true); // Mark as loaded to prevent infinite retries
        }
      };
      
      loadCloudData();
    }
  }, [user, dataLoaded, authLoading, migrateLocalData, fetchHabits, fetchSchedule, fetchReminders, fetchSettings]);

  // Save to local storage (for offline/non-logged in users)
  useEffect(() => {
    localStorage.setItem('habits-v3', JSON.stringify(habits));
    if (user && dataLoaded) {
      saveHabits(habits);
    }
  }, [habits, user, dataLoaded, saveHabits]);

  useEffect(() => {
    localStorage.setItem('schedule', JSON.stringify(schedule));
    if (user && dataLoaded) {
      saveSchedule(schedule);
    }
  }, [schedule, user, dataLoaded, saveSchedule]);

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
    if (user && dataLoaded) {
      saveReminders(reminders);
    }
  }, [reminders, user, dataLoaded, saveReminders]);

  useEffect(() => {
    localStorage.setItem('notificationPrefs', JSON.stringify(notificationPrefs));
    if (user && dataLoaded) {
      saveSettings(notificationPrefs);
    }
  }, [notificationPrefs, user, dataLoaded, saveSettings]);


  const handleToggleDay = useCallback((habitId: string, dayIndex: number) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const newCompletedDays = [...habit.completedDays];
        const wasCompleted = newCompletedDays[dayIndex];
        newCompletedDays[dayIndex] = !wasCompleted;

        // Send notification on completion (guarded for mobile browsers that don't support Notifications)
        const canUseNotifications = typeof window !== 'undefined' && 'Notification' in window;
        if (!wasCompleted && canUseNotifications && window.Notification.permission === 'granted') {
          notifyHabitComplete(habit.name, habit.icon);
        }

        return { ...habit, completedDays: newCompletedDays };
      }
      return habit;
    }));
  }, [notifyHabitComplete]);

  const handleAddHabit = (name: string, icon: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      icon,
      completedDays: Array(7).fill(false),
      activeDays: Array(7).fill(true),
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(habit => habit.id !== habitId));
  };

  const handleReorderHabits = (reorderedHabits: Habit[]) => {
    setHabits(reorderedHabits);
  };

  const handleUpdateActiveDays = (habitId: string, activeDays: boolean[]) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        return { ...habit, activeDays };
      }
      return habit;
    }));
  };

  const handleUpdateGoal = (habitId: string, goal: number) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        return { ...habit, weeklyGoal: goal };
      }
      return habit;
    }));
  };

  const handleAddScheduleItem = (time: string, task: string, emoji: string) => {
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      time,
      task,
      emoji,
    };
    setSchedule(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const handleDeleteScheduleItem = (id: string) => {
    setSchedule(prev => prev.filter(item => item.id !== id));
  };

  const handleEditScheduleItem = (id: string, time: string, task: string, emoji: string) => {
    setSchedule(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, time, task, emoji };
      }
      return item;
    }).sort((a, b) => a.time.localeCompare(b.time)));
  };

  const handleAddReminder = (reminder: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      ...reminder,
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleToggleScheduleComplete = (id: string) => {
    setSchedule(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleToggleReminderComplete = (id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      <MotivationModal />
      <NotificationPrompt />
      
      {/* Top Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {!user && !authLoading && (
          <div className="hidden sm:block">
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              Sign in
            </Button>
          </div>
        )}
        {user && <UserMenu />}
        <ThemeToggle />
      </div>
      
      {/* Title - with compact clock on mobile */}
      <header className="pt-8 pb-4 px-4 sm:px-6">
        <div className="flex items-center justify-center gap-3 lg:flex-col lg:gap-0">
          <div className="lg:hidden">
            <ClockWidget compact />
          </div>
          <div className="text-left lg:text-center">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground tracking-tight">
              Daily Habits
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">Build better routines, one day at a time</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-3 sm:px-4 md:px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 lg:gap-8">

            {/* Mobile: Today's Plan & Reminders - beautiful compact cards */}
            <div className="lg:hidden mb-4">
              <div className="grid grid-cols-2 gap-3">
                <DailySchedule
                  items={schedule}
                  onAddItem={handleAddScheduleItem}
                  onDeleteItem={handleDeleteScheduleItem}
                  onEditItem={handleEditScheduleItem}
                  onToggleComplete={handleToggleScheduleComplete}
                  compact
                />
                <Reminders
                  reminders={reminders}
                  onAdd={handleAddReminder}
                  onDelete={handleDeleteReminder}
                  onToggleComplete={handleToggleReminderComplete}
                  eyeBlinkEnabled={notificationPrefs.eyeBlinkReminders}
                  waterIntakeEnabled={notificationPrefs.waterIntakeReminders}
                  onToggleEyeBlink={(enabled) => setNotificationPrefs(prev => ({ ...prev, eyeBlinkReminders: enabled }))}
                  onToggleWaterIntake={(enabled) => setNotificationPrefs(prev => ({ ...prev, waterIntakeReminders: enabled }))}
                  compact
                />
              </div>
            </div>

            {/* Mobile: Habit Table (main section) */}
            <div className="lg:hidden space-y-4 animate-fade-in">
              <div className="bg-popover rounded-2xl border border-border/50 p-2 sm:p-4 shadow-sm">
                <div className="overflow-x-auto overscroll-x-contain touch-pan-x">
                  <HabitTable
                    habits={habits}
                    onToggleDay={handleToggleDay}
                    onDeleteHabit={handleDeleteHabit}
                    onUpdateActiveDays={handleUpdateActiveDays}
                    onReorder={handleReorderHabits}
                    onUpdateGoal={handleUpdateGoal}
                  />
                </div>
                <AddHabitRow onAdd={handleAddHabit} />
              </div>
            </div>

            {/* Mobile: Pomodoro Timer */}
            <div className="lg:hidden">
              <PomodoroTimer />
            </div>

            {/* Mobile: Stats */}
            <div className="lg:hidden">
              <HabitStatistics habits={habits} />
            </div>

            {/* Mobile: Goals & Settings */}
            <div className="lg:hidden space-y-4">
              <HabitGoals habits={habits} onUpdateGoal={handleUpdateGoal} />
              <NotificationSettings
                preferences={notificationPrefs}
                onUpdate={setNotificationPrefs}
              />
            </div>

            {/* Desktop: Left Column */}
            <div className="hidden lg:block space-y-5">
              <div className="flex justify-start">
                <ClockWidget />
              </div>
              <Reminders
                reminders={reminders}
                onAdd={handleAddReminder}
                onDelete={handleDeleteReminder}
                onToggleComplete={handleToggleReminderComplete}
                eyeBlinkEnabled={notificationPrefs.eyeBlinkReminders}
                waterIntakeEnabled={notificationPrefs.waterIntakeReminders}
                onToggleEyeBlink={(enabled) => setNotificationPrefs(prev => ({ ...prev, eyeBlinkReminders: enabled }))}
                onToggleWaterIntake={(enabled) => setNotificationPrefs(prev => ({ ...prev, waterIntakeReminders: enabled }))}
              />
              <PomodoroTimer />
              <DailySchedule
                items={schedule}
                onAddItem={handleAddScheduleItem}
                onDeleteItem={handleDeleteScheduleItem}
                onEditItem={handleEditScheduleItem}
                onToggleComplete={handleToggleScheduleComplete}
              />
              <NotificationSettings
                preferences={notificationPrefs}
                onUpdate={setNotificationPrefs}
              />
            </div>

            {/* Desktop: Right Column */}
            <div className="hidden lg:block space-y-4 animate-fade-in">
              <HabitGoals habits={habits} onUpdateGoal={handleUpdateGoal} />
              <HabitStatistics habits={habits} />
              <div className="overflow-x-auto bg-popover rounded-2xl border border-border/50 p-4">
                <HabitTable
                  habits={habits}
                  onToggleDay={handleToggleDay}
                  onDeleteHabit={handleDeleteHabit}
                  onUpdateActiveDays={handleUpdateActiveDays}
                  onReorder={handleReorderHabits}
                  onUpdateGoal={handleUpdateGoal}
                />
                <AddHabitRow onAdd={handleAddHabit} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile: Sign in prompt for non-logged users */}
        {!user && !authLoading && (
          <div className="sm:hidden mt-6 p-4 bg-popover rounded-2xl border border-border/50">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Sign in to sync your habits across all devices
            </p>
            <Button className="w-full" onClick={() => navigate('/auth')}>
              Sign in
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
