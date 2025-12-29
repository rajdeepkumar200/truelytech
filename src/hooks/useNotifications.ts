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

export const useNotifications = (
  reminders: Reminder[],
  schedule: ScheduleItem[],
  onHabitComplete?: () => void
) => {
  const notifiedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<number | null>(null);

  const sendNotification = useCallback((title: string, body: string, icon?: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      });
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, []);

  const checkNotifications = useCallback(() => {
    const now = new Date();
    const currentDay = getDayName(now);
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    const fiveMinTime = fiveMinutesFromNow.toTimeString().slice(0, 5);

    // Check reminders - notify 5 minutes before
    reminders.forEach(reminder => {
      if (reminder.day === currentDay) {
        const notifyKey = `reminder-${reminder.id}-${currentDay}`;
        const earlyNotifyKey = `reminder-early-${reminder.id}-${currentDay}`;
        
        // 5 minutes before notification
        if (reminder.time === fiveMinTime && !notifiedRef.current.has(earlyNotifyKey)) {
          notifiedRef.current.add(earlyNotifyKey);
          sendNotification(
            `${reminder.emoji} Reminder in 5 minutes`,
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

    // Check schedule items - notify 5 minutes before
    schedule.forEach(item => {
      const notifyKey = `schedule-${item.id}-${now.toDateString()}`;
      const earlyNotifyKey = `schedule-early-${item.id}-${now.toDateString()}`;
      
      // 5 minutes before notification
      if (item.time === fiveMinTime && !notifiedRef.current.has(earlyNotifyKey)) {
        notifiedRef.current.add(earlyNotifyKey);
        sendNotification(
          `${item.emoji || '📌'} Task in 5 minutes`,
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
  }, [reminders, schedule, sendNotification]);

  // Daily reminder at 8 AM for habits
  const checkDailyReminder = useCallback(() => {
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
  }, [sendNotification]);

  // Notify on habit completion
  const notifyHabitComplete = useCallback((habitName: string, emoji: string) => {
    sendNotification(
      `${emoji} Habit Completed!`,
      `Great job completing "${habitName}"! ${getRandomMotivation()}`
    );
  }, [sendNotification]);

  useEffect(() => {
    if (Notification.permission !== 'granted') return;

    // Check every 30 seconds
    intervalRef.current = window.setInterval(() => {
      checkNotifications();
      checkDailyReminder();
    }, 30000);

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
