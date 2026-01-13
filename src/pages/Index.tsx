import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Book } from 'lucide-react';
import ClockWidget from '@/components/ClockWidget';
import HabitTable from '@/components/HabitTable';
import MonthlyHabitCalendar from '@/components/MonthlyHabitCalendar';
import WeeklyReportCards from '@/components/WeeklyReportCards';
import HabitStatistics from '@/components/HabitStatistics';
import HabitGoals from '@/components/HabitGoals';
import AddHabitRow from '@/components/AddHabitRow';
import MotivationModal from '@/components/MotivationModal';
import NotificationPrompt from '@/components/NotificationPrompt';
import PomodoroTimerWithPopup from '@/components/PomodoroTimerWithPopup';
import SettingsDialog from '@/components/SettingsDialog';
import RemindersRedesigned from '@/components/RemindersRedesigned';
import MobileInstallPrompt from '@/components/MobileInstallPrompt';
import ReminderAlert from '@/components/ReminderAlert';
import { OnboardingTour } from '@/components/OnboardingTour';
import { PaywallDialog } from '@/components/PaywallDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/hooks/useDataSync';
import { useEntitlement } from '@/hooks/useEntitlement';
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

// Get current day index (0 = Monday, 6 = Sunday)
const getCurrentDayIndex = (): number => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
};

// Data model note: `completedDays` is stored as a simple Mon-Sun array.
// To avoid showing/keeping future days as completed, we always clear
// Only clear future days in the current week, keep past weeks' completion flags
const sanitizeHabitsForToday = (habits: Habit[]): Habit[] => {
  const currentDayIndex = getCurrentDayIndex();
  return habits.map((habit) => {
    const completedDays = (habit.completedDays?.length === 7 ? habit.completedDays : Array(7).fill(false)).slice();
    // Only clear days after today in the current week
    for (let i = currentDayIndex + 1; i < 7; i++) {
      completedDays[i] = false;
    }
    // Do NOT clear previous weeks' data
    return {
      ...habit,
      completedDays,
      activeDays: habit.activeDays || Array(7).fill(true),
    };
  });
};

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
  const entitlement = useEntitlement();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { 
    fetchHabits, saveHabits, 
    fetchSchedule, saveSchedule, 
    fetchReminders, saveReminders, 
    fetchSettings, saveSettings,
    migrateLocalData 
  } = useDataSync();

  const [paywallOpen, setPaywallOpen] = useState(false);
  
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('habits-v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      return sanitizeHabitsForToday(parsed);
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
      alarmTone: 'classic',
    };
  });

  const [isPomodoroFocusActive, setIsPomodoroFocusActive] = useState(false);
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

  // Handle Pomodoro state changes - auto-enable reminders during focus sessions
  const handlePomodoroStateChange = (isActive: boolean, isBreak: boolean) => {
    setIsPomodoroFocusActive(isActive && !isBreak);
  };

  // Visual reminder alerts for eye blink and water intake
  useEffect(() => {
    if (authLoading || !user) return;

    // Auto-enable reminders when Pomodoro focus is active
    const shouldEnableReminders = isPomodoroFocusActive || notificationPrefs.eyeBlinkReminders || notificationPrefs.waterIntakeReminders;

    if (!shouldEnableReminders) {
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

      // Eye blink - every 20 minutes (mandatory during Pomodoro focus)
      const shouldShowEyeReminder = (isPomodoroFocusActive || notificationPrefs.eyeBlinkReminders) && 
                                     minutes % 20 === 0 && seconds < 5;
      
      if (shouldShowEyeReminder) {
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

      // Water intake - customizable interval (mandatory during Pomodoro focus, default 30 minutes)
      const waterInterval = notificationPrefs.waterIntakeInterval || 30;
      const shouldShowWaterReminder = (isPomodoroFocusActive || notificationPrefs.waterIntakeReminders) && 
                                       minutes % waterInterval === 0 && seconds < 5;
      
      if (shouldShowWaterReminder) {
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
  }, [authLoading, user, notificationPrefs.eyeBlinkReminders, notificationPrefs.waterIntakeReminders, notificationPrefs.waterIntakeInterval, isPomodoroFocusActive]);

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
  }, [user, lastUserId]);

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
        setHabits(sanitizeHabitsForToday(cloudHabits));
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
    // Prevent toggling future days (in the current Mon-Sun array model)
    if (dayIndex > getCurrentDayIndex()) return;

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

  // If not authenticated, send user to auth page.
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe px-safe">
      <MotivationModal onDismiss={() => setMotivationDismissed(true)} />

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        trialDaysLeft={entitlement.trialDaysLeft}
      />
      
      <OnboardingTour start={motivationDismissed} />
      <NotificationPrompt />
      <MobileInstallPrompt />
      <ReminderAlert 
        type={reminderAlertType} 
        onDismiss={() => setReminderAlertType(null)} 
        soundEnabled={notificationPrefs.soundEnabled !== false}
        alarmTone={notificationPrefs.alarmTone || 'classic'}
      />
      
      {/* Top Controls */}
      <div className="fixed top-0 right-0 z-50 pt-safe pr-safe p-4 flex items-center gap-2">
        <Button
          id="journal-btn"
          variant="outline"
          size="icon"
          onClick={() => {
            if (entitlement.isLocked) {
              setPaywallOpen(true);
              return;
            }
            navigate('/journal');
          }}
          title={entitlement.isLocked ? 'Journal (Locked)' : 'Journal'}
        >
          <Book className="h-4 w-4" />
        </Button>
        <SettingsDialog 
          notificationPrefs={notificationPrefs}
          onUpdateNotificationPrefs={setNotificationPrefs}
          showHiddenHabits={showHiddenHabits}
          onToggleHiddenHabits={() => setShowHiddenHabits(!showHiddenHabits)}
        />
        {!user && !authLoading && (
          <div className="hidden sm:block">
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              Sign in
            </Button>
          </div>
        )}
      </div>
      
      {/* Title */}
      <header className="pt-4 pb-4 px-4 sm:px-6">
        <div className="flex flex-col items-center">
          <div className="text-center group">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent tracking-tight transition-all duration-500 hover:scale-105">
              Daily Habits
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 transition-all duration-300 group-hover:text-accent">Build better routines, one day at a time ✨</p>
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
                {entitlement.isLocked ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">Weekly Report</h3>
                      <p className="text-sm opacity-80">Locked after the 7-day trial.</p>
                    </div>
                    <Button onClick={() => setPaywallOpen(true)}>Unlock</Button>
                  </div>
                ) : (
                  <WeeklyReportCards habits={visibleHabits} />
                )}
              </div>
            </div>

            {/* Mobile: Stats (streaks) - right after habits */}
            {/* <div className="lg:hidden">
              <HabitStatistics habits={visibleHabits} />
            </div> */}

            {/* Mobile: Reminders */}
            <div className="lg:hidden">
              {entitlement.isLocked ? (
                <div className="bg-popover rounded-2xl border border-border/50 p-4 shadow-sm space-y-3">
                  <div>
                    <h3 className="font-semibold">Reminders</h3>
                    <p className="text-sm opacity-80">Locked after the 7-day trial.</p>
                  </div>
                  <Button onClick={() => setPaywallOpen(true)}>Unlock</Button>
                </div>
              ) : (
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
                  alarmTone={notificationPrefs.alarmTone || 'classic'}
                  habits={habits}
                  onToggleEyeBlink={(enabled) => setNotificationPrefs(prev => ({ ...prev, eyeBlinkReminders: enabled }))}
                  onToggleWaterIntake={(enabled) => setNotificationPrefs(prev => ({ ...prev, waterIntakeReminders: enabled }))}
                  onWaterIntakeIntervalChange={(interval) => setNotificationPrefs(prev => ({ ...prev, waterIntakeInterval: interval }))}
                  onToggleSound={(enabled) => setNotificationPrefs(prev => ({ ...prev, soundEnabled: enabled }))}
                  onAlarmToneChange={(tone) => setNotificationPrefs(prev => ({ ...prev, alarmTone: tone }))}
                />
              )}
            </div>

            {/* Mobile: Pomodoro Timer */}
            <div className="lg:hidden">
              {entitlement.isLocked ? (
                <div className="bg-popover rounded-2xl border border-border/50 p-4 shadow-sm space-y-3">
                  <div>
                    <h3 className="font-semibold">Pomodoro</h3>
                    <p className="text-sm opacity-80">Locked after the 7-day trial.</p>
                  </div>
                  <Button onClick={() => setPaywallOpen(true)}>Unlock</Button>
                </div>
              ) : (
                <PomodoroTimerWithPopup onPomodoroStateChange={handlePomodoroStateChange} />
              )}
            </div>

            {/* Mobile: Goals */}
            <div className="lg:hidden space-y-4">
              {entitlement.isLocked ? (
                <div className="bg-popover rounded-2xl border border-border/50 p-4 shadow-sm space-y-3">
                  <div>
                    <h3 className="font-semibold">Goals</h3>
                    <p className="text-sm opacity-80">Locked after the 7-day trial.</p>
                  </div>
                  <Button onClick={() => setPaywallOpen(true)}>Unlock</Button>
                </div>
              ) : (
                <HabitGoals habits={visibleHabits} onUpdateGoal={handleUpdateGoal} />
              )}
            </div>

            {/* Desktop: Left Column */}
            <div className="hidden lg:block space-y-5 min-w-0">
              <div className="flex justify-start">
                <ClockWidget />
              </div>
              {entitlement.isLocked ? (
                <div className="bg-popover rounded-2xl border border-border/50 p-4 shadow-sm space-y-3">
                  <div>
                    <h3 className="font-semibold">Reminders</h3>
                    <p className="text-sm opacity-80">Locked after the 7-day trial.</p>
                  </div>
                  <Button onClick={() => setPaywallOpen(true)}>Unlock</Button>
                </div>
              ) : (
                <RemindersRedesigned
                  reminders={reminders}
                  onAdd={handleAddReminder}
                  onDelete={handleDeleteReminder}
                  onToggleComplete={handleToggleReminderComplete}
                  eyeBlinkEnabled={notificationPrefs.eyeBlinkReminders}
                  waterIntakeEnabled={notificationPrefs.waterIntakeReminders}
                  waterIntakeInterval={notificationPrefs.waterIntakeInterval || 30}
                  soundEnabled={notificationPrefs.soundEnabled !== false}
                  alarmTone={notificationPrefs.alarmTone || 'classic'}
                  habits={habits}
                  onToggleEyeBlink={(enabled) => setNotificationPrefs(prev => ({ ...prev, eyeBlinkReminders: enabled }))}
                  onToggleWaterIntake={(enabled) => setNotificationPrefs(prev => ({ ...prev, waterIntakeReminders: enabled }))}
                  onWaterIntakeIntervalChange={(interval) => setNotificationPrefs(prev => ({ ...prev, waterIntakeInterval: interval }))}
                  onToggleSound={(enabled) => setNotificationPrefs(prev => ({ ...prev, soundEnabled: enabled }))}
                  onAlarmToneChange={(tone) => setNotificationPrefs(prev => ({ ...prev, alarmTone: tone }))}
                />
              )}

              {entitlement.isLocked ? (
                <div className="bg-popover rounded-2xl border border-border/50 p-4 shadow-sm space-y-3">
                  <div>
                    <h3 className="font-semibold">Pomodoro</h3>
                    <p className="text-sm opacity-80">Locked after the 7-day trial.</p>
                  </div>
                  <Button onClick={() => setPaywallOpen(true)}>Unlock</Button>
                </div>
              ) : (
                <PomodoroTimerWithPopup onPomodoroStateChange={handlePomodoroStateChange} />
              )}
            </div>

            {/* Desktop: Right Column */}
            <div className="hidden lg:block space-y-4 animate-fade-in min-w-0">
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
                {entitlement.isLocked ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">Weekly Report</h3>
                      <p className="text-sm opacity-80">Locked after the 7-day trial.</p>
                    </div>
                    <Button onClick={() => setPaywallOpen(true)}>Unlock</Button>
                  </div>
                ) : (
                  <WeeklyReportCards habits={visibleHabits} />
                )}
              </div>
              {entitlement.isLocked ? (
                <div className="bg-popover rounded-2xl border border-border/50 p-4 shadow-sm space-y-3">
                  <div>
                    <h3 className="font-semibold">Goals</h3>
                    <p className="text-sm opacity-80">Locked after the 7-day trial.</p>
                  </div>
                  <Button onClick={() => setPaywallOpen(true)}>Unlock</Button>
                </div>
              ) : (
                <HabitGoals habits={visibleHabits} onUpdateGoal={handleUpdateGoal} />
              )}
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
