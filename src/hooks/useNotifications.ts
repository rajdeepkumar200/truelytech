import { useEffect, useRef, useCallback } from 'react';

interface Reminder {
  id: string;
  day: string;
  time: string;
  name: string;
  emoji: string;
}

interface ScheduleItem {
  id: string;
  time: string;
  task: string;
  emoji?: string;
}

const motivationalMessages = [
  "You've got this! 💪",
  "Keep pushing forward! 🚀",
  "Every step counts! 🌟",
  "Stay focused, stay strong! 🎯",
  "You're making progress! 📈",
  "Believe in yourself! ✨",
  "Small steps, big results! 🏆",
];

const getRandomMotivation = () => {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
};

const getDayName = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

export interface NotificationPreferences {
  enabled: boolean;
  reminderTime: number;
  habitCompletions: boolean;
  dailyReminder: boolean;
  scheduleReminders: boolean;
  customReminders: boolean;
  eyeBlinkReminders?: boolean;
  waterIntakeReminders?: boolean;
  waterIntakeInterval?: number;
  soundEnabled?: boolean;
}

export const useNotifications = (
  reminders: Reminder[],
  schedule: ScheduleItem[],
  preferences: NotificationPreferences,
  onHabitComplete?: () => void
) => {
  const notifiedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<number | null>(null);

  const sendNotification = useCallback((title: string, body: string, icon?: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
        });
      } catch (e) {
        console.error('Notification error:', e);
      }
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, []);

  const checkNotifications = useCallback(() => {
    if (!preferences.enabled) return;
    
    const now = new Date();
    const currentDay = getDayName(now);
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const reminderMinutes = preferences.reminderTime || 5;
    const preNotifyTime = new Date(now.getTime() + reminderMinutes * 60 * 1000);
    const preNotifyTimeStr = preNotifyTime.toTimeString().slice(0, 5);

    // Check reminders - notify before based on settings
    if (preferences.customReminders) {
      reminders.forEach(reminder => {
        if (reminder.day === currentDay) {
          const notifyKey = `reminder-${reminder.id}-${currentDay}`;
          const earlyNotifyKey = `reminder-early-${reminder.id}-${currentDay}`;
          
          // Pre-notification
          if (reminder.time === preNotifyTimeStr && !notifiedRef.current.has(earlyNotifyKey)) {
            notifiedRef.current.add(earlyNotifyKey);
            sendNotification(
              `${reminder.emoji} Reminder in ${reminderMinutes} minutes`,
              `"${reminder.name}" is coming up! ${getRandomMotivation()}`
            );
          }
          
          // Exact time notification
          if (reminder.time === currentTime && !notifiedRef.current.has(notifyKey)) {
            notifiedRef.current.add(notifyKey);
            sendNotification(
              `${reminder.emoji} Time for: ${reminder.name}`,
              `It's time! ${getRandomMotivation()}`
            );
          }
        }
      });
    }

    // Check schedule items - notify before based on settings
    if (preferences.scheduleReminders) {
      schedule.forEach(item => {
        const notifyKey = `schedule-${item.id}-${now.toDateString()}`;
        const earlyNotifyKey = `schedule-early-${item.id}-${now.toDateString()}`;
        
        // Pre-notification
        if (item.time === preNotifyTimeStr && !notifiedRef.current.has(earlyNotifyKey)) {
          notifiedRef.current.add(earlyNotifyKey);
          sendNotification(
            `${item.emoji || '📌'} Task in ${reminderMinutes} minutes`,
            `"${item.task}" is coming up! ${getRandomMotivation()}`
          );
        }
        
        // Exact time notification
        if (item.time === currentTime && !notifiedRef.current.has(notifyKey)) {
          notifiedRef.current.add(notifyKey);
          sendNotification(
            `${item.emoji || '📌'} Time for: ${item.task}`,
            `Let's do this! ${getRandomMotivation()}`
          );
        }
      });
    }

    // Eye blink reminders - every 20 minutes
    if (preferences.eyeBlinkReminders) {
      const minutes = now.getMinutes();
      if (minutes % 20 === 0 && now.getSeconds() < 30) {
        const blinkKey = `eyeblink-${now.getHours()}-${minutes}`;
        if (!notifiedRef.current.has(blinkKey)) {
          notifiedRef.current.add(blinkKey);
          sendNotification(
            '👁️ Eye Break!',
            'Look away from the screen for 20 seconds. Blink slowly to rest your eyes.'
          );
        }
      }
    }

    // Water intake reminders - every 30 minutes
    if (preferences.waterIntakeReminders) {
      const minutes = now.getMinutes();
      if (minutes % 30 === 0 && now.getSeconds() < 30) {
        const waterKey = `water-${now.getHours()}-${minutes}`;
        if (!notifiedRef.current.has(waterKey)) {
          notifiedRef.current.add(waterKey);
          sendNotification(
            '💧 Hydration Time!',
            'Take a sip of water to stay hydrated and energized.'
          );
        }
      }
    }
  }, [reminders, schedule, preferences, sendNotification]);

  // Daily reminder at 8 AM for habits
  const checkDailyReminder = useCallback(() => {
    if (!preferences.enabled || !preferences.dailyReminder) return;
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const dailyKey = `daily-${now.toDateString()}`;
    
    if (currentTime === '08:00' && !notifiedRef.current.has(dailyKey)) {
      notifiedRef.current.add(dailyKey);
      sendNotification(
        '🌅 Good Morning!',
        `Time to check on your daily habits! ${getRandomMotivation()}`
      );
    }
  }, [preferences, sendNotification]);

  // Notify on habit completion
  const notifyHabitComplete = useCallback((habitName: string, emoji: string) => {
    if (!preferences.enabled || !preferences.habitCompletions) return;
    
    sendNotification(
      `${emoji} Habit Completed!`,
      `Great job completing "${habitName}"! ${getRandomMotivation()}`
    );
  }, [preferences, sendNotification]);

  useEffect(() => {
    if (!preferences.enabled || Notification.permission !== 'granted') return;

    // Check every 2 seconds (as requested)
    intervalRef.current = window.setInterval(() => {
      checkNotifications();
      checkDailyReminder();
    }, 2000);

    // Initial check
    checkNotifications();
    checkDailyReminder();

    // Reset notified set at midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    const midnightTimeout = setTimeout(() => {
      notifiedRef.current.clear();
    }, msUntilMidnight);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(midnightTimeout);
    };
  }, [checkNotifications, checkDailyReminder]);

  return { notifyHabitComplete };
};
