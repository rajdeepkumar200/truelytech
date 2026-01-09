import { useEffect, useRef, useCallback, useMemo } from 'react';
import { checkNotificationPermission, isNative, rescheduleNativeNotifications, sendNotificationNow } from '@/lib/notifications';

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

function toTodayAt(timeHHMM: string, base: Date = new Date()): Date | null {
  const [hStr, mStr] = timeHHMM.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatCuratedNote(kind: 'reminder' | 'schedule' | 'morning' | 'habit' | 'focus', message: string) {
  const note =
    kind === 'focus'
      ? 'Quick note: one more session builds momentum.'
      : kind === 'morning'
        ? 'Quick note: start with the easiest win.'
        : kind === 'habit'
          ? 'Quick note: consistency > intensity.'
          : kind === 'schedule'
            ? 'Quick note: do the next small step.'
            : 'Quick note: keep it simple and steady.';
  return `${message} ${note}`;
}

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
  alarmTone?: 'classic' | 'digital' | 'gentle';
}

export const useNotifications = (
  reminders: Reminder[],
  schedule: ScheduleItem[],
  preferences: NotificationPreferences,
  onHabitComplete?: () => void
) => {
  const notifiedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<number | null>(null);

  const reminderMinutes = preferences.reminderTime || 5;

  const nativePlan = useMemo(() => {
    if (!isNative()) return [];
    if (!preferences.enabled) return [];

    const now = new Date();
    const currentDay = getDayName(now);
    const planned: Array<{ key: string; title: string; body: string; at: Date }> = [];

    if (preferences.customReminders) {
      for (const r of reminders) {
        if (r.day !== currentDay) continue;
        const at = toTodayAt(r.time, now);
        if (!at) continue;
        const early = new Date(at.getTime() - reminderMinutes * 60 * 1000);
        if (early.getTime() > Date.now()) {
          planned.push({
            key: `habitency:reminder:early:${r.id}:${now.toDateString()}`,
            title: `${r.emoji} Reminder in ${reminderMinutes} minutes`,
            body: formatCuratedNote('reminder', `"${r.name}" is coming up! ${getRandomMotivation()}`),
            at: early,
          });
        }
        if (at.getTime() > Date.now()) {
          planned.push({
            key: `habitency:reminder:at:${r.id}:${now.toDateString()}`,
            title: `${r.emoji} Time for: ${r.name}`,
            body: formatCuratedNote('reminder', `It\'s time! ${getRandomMotivation()}`),
            at,
          });
        }
      }
    }

    if (preferences.scheduleReminders) {
      for (const item of schedule) {
        const at = toTodayAt(item.time, now);
        if (!at) continue;
        const emoji = item.emoji || '📌';
        const early = new Date(at.getTime() - reminderMinutes * 60 * 1000);
        if (early.getTime() > Date.now()) {
          planned.push({
            key: `habitency:schedule:early:${item.id}:${now.toDateString()}`,
            title: `${emoji} Task in ${reminderMinutes} minutes`,
            body: formatCuratedNote('schedule', `"${item.task}" is coming up! ${getRandomMotivation()}`),
            at: early,
          });
        }
        if (at.getTime() > Date.now()) {
          planned.push({
            key: `habitency:schedule:at:${item.id}:${now.toDateString()}`,
            title: `${emoji} Time for: ${item.task}`,
            body: formatCuratedNote('schedule', `Let\'s do this! ${getRandomMotivation()}`),
            at,
          });
        }
      }
    }

    if (preferences.dailyReminder) {
      const at = toTodayAt('08:00', now);
      if (at && at.getTime() > Date.now()) {
        planned.push({
          key: `habitency:morning:${now.toDateString()}`,
          title: '🌅 Good Morning!',
          body: formatCuratedNote('morning', `Time to check on your daily habits! ${getRandomMotivation()}`),
          at,
        });
      }
    }

    return planned;
  }, [preferences.enabled, preferences.customReminders, preferences.scheduleReminders, preferences.dailyReminder, reminderMinutes, reminders, schedule]);

  const sendNotification = useCallback((title: string, body: string, icon?: string) => {
    void icon;
    void sendNotificationNow(title, body);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
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
              formatCuratedNote('reminder', `"${reminder.name}" is coming up! ${getRandomMotivation()}`)
            );
          }
          
          // Exact time notification
          if (reminder.time === currentTime && !notifiedRef.current.has(notifyKey)) {
            notifiedRef.current.add(notifyKey);
            sendNotification(
              `${reminder.emoji} Time for: ${reminder.name}`,
              formatCuratedNote('reminder', `It's time! ${getRandomMotivation()}`)
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
            formatCuratedNote('schedule', `"${item.task}" is coming up! ${getRandomMotivation()}`)
          );
        }
        
        // Exact time notification
        if (item.time === currentTime && !notifiedRef.current.has(notifyKey)) {
          notifiedRef.current.add(notifyKey);
          sendNotification(
            `${item.emoji || '📌'} Time for: ${item.task}`,
            formatCuratedNote('schedule', `Let's do this! ${getRandomMotivation()}`)
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
            formatCuratedNote('reminder', 'Look away from the screen for 20 seconds. Blink slowly to rest your eyes.')
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
            formatCuratedNote('reminder', 'Take a sip of water to stay hydrated and energized.')
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
        formatCuratedNote('morning', `Time to check on your daily habits! ${getRandomMotivation()}`)
      );
    }
  }, [preferences, sendNotification]);

  // Notify on habit completion
  const notifyHabitComplete = useCallback((habitName: string, emoji: string) => {
    if (!preferences.enabled || !preferences.habitCompletions) return;
    
    sendNotification(
      `${emoji} Habit Completed!`,
      formatCuratedNote('habit', `Great job completing "${habitName}"! ${getRandomMotivation()}`)
    );
  }, [preferences, sendNotification]);

  // Native (Capacitor) background notifications: schedule ahead so they fire when app is backgrounded.
  useEffect(() => {
    if (!isNative()) return;
    if (!preferences.enabled) return;

    let cancelled = false;
    (async () => {
      const perm = await checkNotificationPermission();
      if (cancelled) return;
      if (perm !== 'granted') return;
      await rescheduleNativeNotifications(nativePlan);
    })();

    return () => {
      cancelled = true;
    };
  }, [nativePlan, preferences.enabled]);

  useEffect(() => {
    const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;
    if (!preferences.enabled || !notificationsSupported) return;

    // Only run background checks if notifications are actually allowed.
    // (On Android WebView, `Notification` may be undefined, so we must guard access.)
    if (window.Notification.permission !== 'granted') return;

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
