import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Book, Eye, EyeOff } from 'lucide-react';
import ClockWidget from '@/components/ClockWidget';
import HabitTable from '@/components/HabitTable';
import MonthlyHabitCalendar from '@/components/MonthlyHabitCalendar';
import WeeklyReportCards from '@/components/WeeklyReportCards';
import HabitStatistics from '@/components/HabitStatistics';
import HabitGoals from '@/components/HabitGoals';
import AddHabitRow from '@/components/AddHabitRow';
import MotivationModal from '@/components/MotivationModal';
import NotificationPrompt from '@/components/NotificationPrompt';
import NotificationSettings from '@/components/NotificationSettings';
import PomodoroTimerWithPopup from '@/components/PomodoroTimerWithPopup';
import RemindersRedesigned from '@/components/RemindersRedesigned';
import ThemeToggle from '@/components/ThemeToggle';

import UserMenu from '@/components/UserMenu';
import MobileInstallPrompt from '@/components/MobileInstallPrompt';
import ReminderAlert from '@/components/ReminderAlert';
import { OnboardingTour } from '@/components/OnboardingTour';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/hooks/useDataSync';
import { useNotifications, NotificationPreferences } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
  category?: string;
  weeklyGoal?: number;
  hidden?: boolean;
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
  const { toast } = useToast();
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

  const [showHiddenHabits, setShowHiddenHabits] = useState(false);

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
      waterIntakeInterval: 30,
      soundEnabled: true,
    };
  });

  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(() => {
    return localStorage.getItem('lastUserId');
  });
  const [reminderAlertType, setReminderAlertType] = useState<'eye' | 'water' | null>(null);
  const [motivationDismissed, setMotivationDismissed] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const today = new Date();

  // Initialize notifications
  const { notifyHabitComplete } = useNotifications(reminders, schedule, notificationPrefs);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      // Use replace to prevent going back to protected route
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Visual reminder alerts for eye blink and water intake
  useEffect(() => {
    if (authLoading || !user) return;

    if (!notificationPrefs.eyeBlinkReminders && !notificationPrefs.waterIntakeReminders) {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
      return;
    }

    const checkVisualReminders = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;

      // Eye blink - every 20 minutes
      if (notificationPrefs.eyeBlinkReminders && minutes % 20 === 0 && seconds < 5) {
        setReminderAlertType('eye');
        // Send notification if document is hidden (user not on screen)
        if (document.hidden && notificationsSupported && window.Notification.permission === 'granted') {
          try {
            new window.Notification('👁️ Eye Break!', {
              body: 'Look away from the screen for 20 seconds.',
              icon: '/pwa-192x192.png',
            });
          } catch (e) {
            console.error('Notification error:', e);
          }
        }
      }

      // Water intake - customizable interval (default 30 minutes)
      const waterInterval = notificationPrefs.waterIntakeInterval || 30;
      if (notificationPrefs.waterIntakeReminders && minutes % waterInterval === 0 && seconds < 5) {
        setReminderAlertType('water');
        // Send notification if document is hidden
        if (document.hidden && notificationsSupported && window.Notification.permission === 'granted') {
          try {
            new window.Notification('💧 Hydration Time!', {
              body: 'Take a sip of water to stay hydrated.',
              icon: '/pwa-192x192.png',
            });
          } catch (e) {
            console.error('Notification error:', e);
          }
        }
      }
    };

    reminderIntervalRef.current = setInterval(checkVisualReminders, 5000);
    
    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  }, [notificationPrefs.eyeBlinkReminders, notificationPrefs.waterIntakeReminders, notificationPrefs.waterIntakeInterval]);

  // Reset data when user changes (login/logout/switch accounts) - clear shared local storage
  useEffect(() => {
    if (user?.id && user.id !== lastUserId) {
      // User changed - clear local storage to prevent data leakage between accounts
      localStorage.removeItem('habits-v3');
      localStorage.removeItem('schedule');
      localStorage.removeItem('reminders');
      localStorage.removeItem('notificationPrefs');
      
      // Reset state to empty (will be populated from cloud)
      setHabits([]);
      setSchedule([]);
      setReminders([]);
      setNotificationPrefs({
        enabled: true,
        reminderTime: 5,
        habitCompletions: true,
        dailyReminder: true,
        scheduleReminders: true,
        customReminders: true,
        eyeBlinkReminders: false,
        waterIntakeReminders: false,
      });
      
      // Store current user ID
      localStorage.setItem('lastUserId', user.id);
      setLastUserId(user.id);
      setDataLoaded(false);
    } else if (!user && lastUserId) {
      // User logged out - clear everything
      localStorage.removeItem('habits-v3');
      localStorage.removeItem('schedule');
      localStorage.removeItem('reminders');
      localStorage.removeItem('notificationPrefs');
      localStorage.removeItem('lastUserId');
      
      setHabits(defaultHabits);
      setSchedule(defaultSchedule);
      setReminders([]);
      setLastUserId(null);
      setDataLoaded(false);
    }
  }, [user?.id, lastUserId]);

  // Sync data function
  const syncData = useCallback(async () => {
    if (!user) return;
    
    try {
      const [cloudHabits, cloudSchedule, cloudReminders, cloudSettings] = await Promise.all([
        fetchHabits(),
        fetchSchedule(),
        fetchReminders(),
        fetchSettings()
      ]);
      
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
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }, [user, fetchHabits, fetchSchedule, fetchReminders, fetchSettings]);

  // Load data from cloud when user logs in
  useEffect(() => {
    if (user && !dataLoaded && !authLoading) {
      const loadCloudData = async () => {
        try {
          // First try to migrate local data
          await migrateLocalData();
          
          // Then fetch from cloud
          await syncData();
          
          setDataLoaded(true);
        } catch (error) {
          console.error('Error loading cloud data:', error);
          setDataLoaded(true); // Mark as loaded to prevent infinite retries
        }
      };
      
      loadCloudData();
    }
  }, [user, dataLoaded, authLoading, migrateLocalData, syncData]);

  // Note: Removed auto-sync interval - data is synced on each change via save functions
  // This prevents the checkbox flickering issue where old cloud data overwrites local changes

  // Save to local storage (for offline/non-logged in users)
  useEffect(() => {
    localStorage.setItem('habits-v3', JSON.stringify(habits));
    if (user && dataLoaded) {
      // Debounce save to prevent spamming
      const timeoutId = setTimeout(() => {
        saveHabits(habits);
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [habits, user, dataLoaded, saveHabits]);

  useEffect(() => {
    localStorage.setItem('schedule', JSON.stringify(schedule));
    if (user && dataLoaded) {
      const timeoutId = setTimeout(() => {
        saveSchedule(schedule);
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [schedule, user, dataLoaded, saveSchedule]);

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
    if (user && dataLoaded) {
      const timeoutId = setTimeout(() => {
        saveReminders(reminders);
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [reminders, user, dataLoaded, saveReminders]);

  useEffect(() => {
    localStorage.setItem('notificationPrefs', JSON.stringify(notificationPrefs));
    if (user && dataLoaded) {
      const timeoutId = setTimeout(() => {
        saveSettings(notificationPrefs);
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [notificationPrefs, user, dataLoaded, saveSettings]);


  const handleToggleDay = useCallback((habitId: string, dayIndex: number) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const newCompletedDays = [...habit.completedDays];
        const wasCompleted = newCompletedDays[dayIndex];
        newCompletedDays[dayIndex] = !wasCompleted;

        // Send notification on completion (guarded for mobile browsers that don't support Notifications)
        try {
          const canUseNotifications = typeof window !== 'undefined' && 'Notification' in window;
          if (!wasCompleted && canUseNotifications && window.Notification.permission === 'granted') {
            notifyHabitComplete(habit.name, habit.icon);
          }
        } catch (e) {
          console.error('Notification error:', e);
        }

        return { ...habit, completedDays: newCompletedDays };
      }
      return habit;
    }));
  }, [notifyHabitComplete]);

  const handleAddHabit = (name: string, icon: string) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
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

  const handleDeleteMultipleHabits = (habitIds: string[]) => {
    setHabits(prev => prev.filter(habit => !habitIds.includes(habit.id)));
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

  const handleToggleActiveDay = (habitId: string, dayIndex: number) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const newActiveDays = [...habit.activeDays];
        newActiveDays[dayIndex] = !newActiveDays[dayIndex];
        return { ...habit, activeDays: newActiveDays };
      }
      return habit;
    }));
  };

  const handleToggleHabitVisibility = (habitId: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const newHiddenState = !habit.hidden;
        toast({
          title: newHiddenState ? "Habit Hidden" : "Habit Visible",
          description: `"${habit.name}" is now ${newHiddenState ? 'hidden' : 'visible'}.`,
        });
        return { ...habit, hidden: newHiddenState };
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

  const handleUpdateIcon = (habitId: string, icon: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        return { ...habit, icon };
      }
      return habit;
    }));
  };

  const handleAddScheduleItem = (time: string, task: string, emoji: string) => {
    const newItem: ScheduleItem = {
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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

  const visibleHabits = habits.filter(h => showHiddenHabits || !h.hidden);

  // Keep conditional rendering at the bottom so hook ordering is consistent.
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, render nothing (redirect handled in effect)
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-safe">
      <MotivationModal onDismiss={() => setMotivationDismissed(true)} />
      <OnboardingTour start={motivationDismissed} />
      <NotificationPrompt />
      <MobileInstallPrompt />
      <ReminderAlert 
        type={reminderAlertType} 
        onDismiss={() => setReminderAlertType(null)} 
        soundEnabled={notificationPrefs.soundEnabled !== false}
      />
      
      {/* Top Controls */}
      <div className="fixed bottom-4 right-4 md:top-4 md:bottom-auto z-50 flex items-center gap-2">
        <Button 
          id="hide-habit-btn"
          variant="outline" 
          size="icon" 
          onClick={() => setShowHiddenHabits(!showHiddenHabits)} 
          title={showHiddenHabits ? "Hide Hidden Habits" : "Show Hidden Habits"}
          className={showHiddenHabits ? "bg-accent text-accent-foreground" : ""}
        >
          {showHiddenHabits ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button id="journal-btn" variant="outline" size="icon" onClick={() => navigate('/journal')} title="Journal">
          <Book className="h-4 w-4" />
        </Button>
        {!user && !authLoading && (
          <div className="hidden sm:block">
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              Sign in
            </Button>
          </div>
        )}
        {user && <div id="user-menu-btn"><UserMenu /></div>}
        <div id="theme-toggle-btn"><ThemeToggle /></div>
      </div>
      
      {/* Title */}
      <header className="pt-4 pb-4 px-4 sm:px-6">
        <div className="flex flex-col items-center">
          <div className="text-center">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground tracking-tight">
              Daily Habits
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">Build better routines, one day at a time</p>
          </div>
          {/* Clock Widget - Mobile only */}
          <div className="lg:hidden mt-3">
            <ClockWidget />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-3 sm:px-4 md:px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 lg:gap-8">

            {/* Mobile: Monthly Habit Calendar (main section) */}
            <div className="lg:hidden space-y-4 animate-fade-in">
              <div className="bg-popover rounded-2xl border border-border/50 p-2 sm:p-4 shadow-sm">
                <MonthlyHabitCalendar
                  habits={visibleHabits}
                  onToggleDay={handleToggleDay}
                  onDeleteHabit={handleDeleteHabit}
                  onDeleteMultipleHabits={handleDeleteMultipleHabits}
                  onToggleActiveDay={handleToggleActiveDay}
                  onToggleVisibility={handleToggleHabitVisibility}
                />
                <div id="add-habit-mobile">
                  <AddHabitRow onAdd={handleAddHabit} />
                </div>
              </div>
              
              {/* Report Cards */}
              <div className="bg-popover rounded-2xl border border-border/50 p-4 shadow-sm">
                <WeeklyReportCards habits={visibleHabits} />
              </div>
            </div>

            {/* Mobile: Stats (streaks) - right after habits */}
            {/* <div className="lg:hidden">
              <HabitStatistics habits={visibleHabits} />
            </div> */}

            {/* Mobile: Reminders */}
            <div className="lg:hidden">
              <RemindersRedesigned
                reminders={reminders}
                onAdd={handleAddReminder}
                onDelete={handleDeleteReminder}
                onToggleComplete={handleToggleReminderComplete}
                compact
                eyeBlinkEnabled={notificationPrefs.eyeBlinkReminders}
                waterIntakeEnabled={notificationPrefs.waterIntakeReminders}
                waterIntakeInterval={notificationPrefs.waterIntakeInterval || 30}
                soundEnabled={notificationPrefs.soundEnabled !== false}
                onToggleEyeBlink={(enabled) => setNotificationPrefs(prev => ({ ...prev, eyeBlinkReminders: enabled }))}
                onToggleWaterIntake={(enabled) => setNotificationPrefs(prev => ({ ...prev, waterIntakeReminders: enabled }))}
                onWaterIntakeIntervalChange={(interval) => setNotificationPrefs(prev => ({ ...prev, waterIntakeInterval: interval }))}
                onToggleSound={(enabled) => setNotificationPrefs(prev => ({ ...prev, soundEnabled: enabled }))}
              />
            </div>

            {/* Mobile: Pomodoro Timer */}
            <div className="lg:hidden">
              <PomodoroTimerWithPopup />
            </div>

            {/* Mobile: Goals & Settings */}
            <div className="lg:hidden space-y-4">
              <HabitGoals habits={visibleHabits} onUpdateGoal={handleUpdateGoal} />
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
              <RemindersRedesigned
                reminders={reminders}
                onAdd={handleAddReminder}
                onDelete={handleDeleteReminder}
                onToggleComplete={handleToggleReminderComplete}
                eyeBlinkEnabled={notificationPrefs.eyeBlinkReminders}
                waterIntakeEnabled={notificationPrefs.waterIntakeReminders}
                waterIntakeInterval={notificationPrefs.waterIntakeInterval || 30}
                soundEnabled={notificationPrefs.soundEnabled !== false}
                onToggleEyeBlink={(enabled) => setNotificationPrefs(prev => ({ ...prev, eyeBlinkReminders: enabled }))}
                onToggleWaterIntake={(enabled) => setNotificationPrefs(prev => ({ ...prev, waterIntakeReminders: enabled }))}
                onWaterIntakeIntervalChange={(interval) => setNotificationPrefs(prev => ({ ...prev, waterIntakeInterval: interval }))}
                onToggleSound={(enabled) => setNotificationPrefs(prev => ({ ...prev, soundEnabled: enabled }))}
              />
              <PomodoroTimerWithPopup />
              <NotificationSettings
                preferences={notificationPrefs}
                onUpdate={setNotificationPrefs}
              />
            </div>

            {/* Desktop: Right Column */}
            <div className="hidden lg:block space-y-4 animate-fade-in">
              <div className="bg-popover rounded-2xl border border-border/50 p-4">
                <MonthlyHabitCalendar
                  habits={visibleHabits}
                  onToggleDay={handleToggleDay}
                  onDeleteHabit={handleDeleteHabit}
                  onDeleteMultipleHabits={handleDeleteMultipleHabits}
                  onToggleActiveDay={handleToggleActiveDay}
                  onToggleVisibility={handleToggleHabitVisibility}
                />
                <div id="add-habit-desktop">
                  <AddHabitRow onAdd={handleAddHabit} />
                </div>
              </div>
              
              {/* Report Cards */}
              <div className="bg-popover rounded-2xl border border-border/50 p-4">
                <WeeklyReportCards habits={visibleHabits} />
              </div>
              <HabitGoals habits={visibleHabits} onUpdateGoal={handleUpdateGoal} />
            </div>
          </div>
        </div>
        
        {/* Mobile: Sign in prompt for non-logged users */}
        {/* {!user && !authLoading && (
          <div className="sm:hidden mt-6 p-4 bg-popover rounded-2xl border border-border/50">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Sign in to sync your habits across all devices
            </p>
            <Button className="w-full" onClick={() => navigate('/auth')}>
              Sign in
            </Button>
          </div>
        )} */}
      </main>
    </div>
  );
};

export default Index;
