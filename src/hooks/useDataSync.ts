import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/integrations/firebase/client';

// ...existing code...
interface Habit {
  id: string;
  name: string;
  icon: string;
  completedWeeks: Record<string, boolean[]>;
  activeDays: boolean[];
  category?: string;
  weeklyGoal?: number;
  hidden?: boolean;
}
interface Habit {
  id: string;
  name: string;
  icon: string;
  completedWeeks: Record<string, boolean[]>;
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

interface NotificationPreferences {
  enabled: boolean;
  reminderTime: number;
  habitCompletions: boolean;
  dailyReminder: boolean;
  scheduleReminders: boolean;
  customReminders: boolean;
  eyeBlinkReminders?: boolean;
  waterIntakeReminders?: boolean;
}

export const useDataSync = () => {
  const { user } = useAuth();

  const getDb = () => {
    try {
      return getFirebaseDb();
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const habitsCollection = useCallback(() => {
    if (!user) return null;
    const db = getDb();
    if (!db) return null;
    return collection(db, 'users', user.id, 'habits');
  }, [user]);

  const scheduleCollection = useCallback(() => {
    if (!user) return null;
    const db = getDb();
    if (!db) return null;
    return collection(db, 'users', user.id, 'schedule_items');
  }, [user]);

  const remindersCollection = useCallback(() => {
    if (!user) return null;
    const db = getDb();
    if (!db) return null;
    return collection(db, 'users', user.id, 'reminders');
  }, [user]);

  // Fetch habits from database
  const fetchHabits = useCallback(async (): Promise<Habit[]> => {
    if (!user) return [];

    const col = habitsCollection();
    if (!col) return [];

    const snap = await getDocs(query(col, orderBy('sortOrder', 'asc')));
      const habits: Habit[] = [];
      snap.docs.forEach((doc) => {
        const data = doc.data();
        let habit: any = { id: doc.id, ...data };
        // Only use completedWeeks, ignore completedDays
        habits.push(habit as Habit);
      });
      return habits;
  }, [user, habitsCollection]);

  // Save habits to database using upsert for proper sync
  const saveHabits = useCallback(async (habits: Habit[]) => {
    if (!user) return;

    const col = habitsCollection();
    if (!col) return;

    const existing = await getDocs(col);
    const existingIds = new Set(existing.docs.map((d) => d.id));
    const currentIds = new Set(habits.map((h) => h.id));

    const db = getDb();
    if (!db) return;
    const batch = writeBatch(db);

    // Delete removed
    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        batch.delete(doc(db, 'users', user.id, 'habits', id));
      }
    }

    // Upsert current (keep stable IDs)
    habits.forEach((h, index) => {
      // Sanitize completedWeeks to ensure no undefined values
      const sanitizedWeeks: Record<string, boolean[]> = {};
      for (const [weekKey, arr] of Object.entries(h.completedWeeks ?? {})) {
        sanitizedWeeks[weekKey] = Array(7)
          .fill(false)
          .map((_, i) => arr[i] === true);
      }
      batch.set(doc(db, 'users', user.id, 'habits', h.id), {
        name: h.name,
        icon: h.icon,
        completedWeeks: sanitizedWeeks,
        activeDays: h.activeDays,
        category: h.category ?? null,
        weeklyGoal: h.weeklyGoal ?? null,
        hidden: h.hidden ?? false,
        sortOrder: index,
        updatedAt: Date.now(),
      });
    });

    await batch.commit();
  }, [user, habitsCollection]);

  // Fetch schedule items
  const fetchSchedule = useCallback(async (): Promise<ScheduleItem[]> => {
    if (!user) return [];

    const col = scheduleCollection();
    if (!col) return [];

    const snap = await getDocs(query(col, orderBy('time', 'asc')));
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        time: data.time,
        task: data.task,
        emoji: data.emoji ?? undefined,
        completed: data.completed ?? undefined,
      };
    });
  }, [user, scheduleCollection]);

  // Save schedule items using upsert for proper sync
  const saveSchedule = useCallback(async (schedule: ScheduleItem[]) => {
    if (!user) return;

    const col = scheduleCollection();
    if (!col) return;

    const existing = await getDocs(col);
    const existingIds = new Set(existing.docs.map((d) => d.id));
    const currentIds = new Set(schedule.map((s) => s.id));

    const db = getDb();
    if (!db) return;
    const batch = writeBatch(db);

    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        batch.delete(doc(db, 'users', user.id, 'schedule_items', id));
      }
    }

    schedule.forEach((s) => {
      batch.set(doc(db, 'users', user.id, 'schedule_items', s.id), {
        time: s.time,
        task: s.task,
        emoji: s.emoji ?? null,
        completed: s.completed ?? false,
        updatedAt: Date.now(),
      });
    });

    await batch.commit();
  }, [user, scheduleCollection]);

  // Fetch reminders
  const fetchReminders = useCallback(async (): Promise<Reminder[]> => {
    if (!user) return [];

    const col = remindersCollection();
    if (!col) return [];

    const snap = await getDocs(col);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        day: data.day,
        time: data.time,
        name: data.name,
        emoji: data.emoji ?? '🔔',
        completed: data.completed ?? undefined,
      };
    });
  }, [user, remindersCollection]);

  // Save reminders using upsert for proper sync
  const saveReminders = useCallback(async (reminders: Reminder[]) => {
    if (!user) return;

    const col = remindersCollection();
    if (!col) return;

    const existing = await getDocs(col);
    const existingIds = new Set(existing.docs.map((d) => d.id));
    const currentIds = new Set(reminders.map((r) => r.id));

    const db = getDb();
    if (!db) return;
    const batch = writeBatch(db);

    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        batch.delete(doc(db, 'users', user.id, 'reminders', id));
      }
    }

    reminders.forEach((r) => {
      batch.set(doc(db, 'users', user.id, 'reminders', r.id), {
        day: r.day,
        time: r.time,
        name: r.name,
        emoji: r.emoji ?? '🔔',
        completed: r.completed ?? false,
        updatedAt: Date.now(),
      });
    });

    await batch.commit();
  }, [user, remindersCollection]);

  // Fetch settings
  const fetchSettings = useCallback(async (): Promise<NotificationPreferences | null> => {
    if (!user) return null;

    const db = getDb();
    if (!db) return null;
    const settingsRef = doc(db, 'users', user.id, 'settings', 'notificationPreferences');
    const snap = await getDoc(settingsRef);
    if (!snap.exists()) return null;
    return snap.data() as NotificationPreferences;
  }, [user]);

  // Save settings with upsert
  const saveSettings = useCallback(async (settings: NotificationPreferences) => {
    if (!user) return;

    const db = getDb();
    if (!db) return;
    const settingsRef = doc(db, 'users', user.id, 'settings', 'notificationPreferences');
    await setDoc(settingsRef, settings, { merge: true });
  }, [user]);

  // Migration is disabled - each user starts fresh with their own cloud data
  // Local storage is cleared on account switch to prevent data leakage
  const migrateLocalData = useCallback(async () => {
    // No-op: Migration removed to prevent cross-account data leakage
    // Each user's data is strictly isolated in the cloud
  }, []);

  return {
    fetchHabits,
    saveHabits,
    fetchSchedule,
    saveSchedule,
    fetchReminders,
    saveReminders,
    fetchSettings,
    saveSettings,
    migrateLocalData,
  };
};
