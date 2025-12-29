import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // Fetch habits from database
  const fetchHabits = useCallback(async (): Promise<Habit[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
    
    return data.map(h => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      completedDays: h.completed_days,
      activeDays: h.active_days,
      category: h.category || undefined,
      weeklyGoal: h.weekly_goal || undefined,
    }));
  }, [user]);

  // Save habits to database
  const saveHabits = useCallback(async (habits: Habit[]) => {
    if (!user) return;
    
    // Delete all existing habits and insert new ones
    await supabase.from('habits').delete().eq('user_id', user.id);
    
    if (habits.length > 0) {
      const { error } = await supabase.from('habits').insert(
        habits.map((h, index) => ({
          id: h.id.length > 20 ? undefined : undefined, // Let DB generate UUID
          user_id: user.id,
          name: h.name,
          icon: h.icon,
          completed_days: h.completedDays,
          active_days: h.activeDays,
          category: h.category || null,
          weekly_goal: h.weeklyGoal || 0,
          sort_order: index,
        }))
      );
      
      if (error) console.error('Error saving habits:', error);
    }
  }, [user]);

  // Fetch schedule items
  const fetchSchedule = useCallback(async (): Promise<ScheduleItem[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*')
      .order('time', { ascending: true });
    
    if (error) {
      console.error('Error fetching schedule:', error);
      return [];
    }
    
    return data.map(s => ({
      id: s.id,
      time: s.time,
      task: s.task,
      emoji: s.emoji || undefined,
      completed: s.completed || undefined,
    }));
  }, [user]);

  // Save schedule items
  const saveSchedule = useCallback(async (schedule: ScheduleItem[]) => {
    if (!user) return;
    
    await supabase.from('schedule_items').delete().eq('user_id', user.id);
    
    if (schedule.length > 0) {
      const { error } = await supabase.from('schedule_items').insert(
        schedule.map(s => ({
          user_id: user.id,
          time: s.time,
          task: s.task,
          emoji: s.emoji || '📋',
          completed: s.completed || false,
        }))
      );
      
      if (error) console.error('Error saving schedule:', error);
    }
  }, [user]);

  // Fetch reminders
  const fetchReminders = useCallback(async (): Promise<Reminder[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('reminders')
      .select('*');
    
    if (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
    
    return data.map(r => ({
      id: r.id,
      day: r.day,
      time: r.time,
      name: r.name,
      emoji: r.emoji || '🔔',
      completed: r.completed || undefined,
    }));
  }, [user]);

  // Save reminders
  const saveReminders = useCallback(async (reminders: Reminder[]) => {
    if (!user) return;
    
    await supabase.from('reminders').delete().eq('user_id', user.id);
    
    if (reminders.length > 0) {
      const { error } = await supabase.from('reminders').insert(
        reminders.map(r => ({
          user_id: user.id,
          day: r.day,
          time: r.time,
          name: r.name,
          emoji: r.emoji || '🔔',
          completed: r.completed || false,
        }))
      );
      
      if (error) console.error('Error saving reminders:', error);
    }
  }, [user]);

  // Fetch settings
  const fetchSettings = useCallback(async (): Promise<NotificationPreferences | null> => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .single();
    
    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
    
    return {
      enabled: data.notification_enabled,
      reminderTime: data.reminder_time,
      habitCompletions: data.habit_completions,
      dailyReminder: data.daily_reminder,
      scheduleReminders: data.schedule_reminders,
      customReminders: data.custom_reminders,
      eyeBlinkReminders: data.eye_blink_reminders,
      waterIntakeReminders: data.water_intake_reminders,
    };
  }, [user]);

  // Save settings
  const saveSettings = useCallback(async (settings: NotificationPreferences) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('user_settings')
      .update({
        notification_enabled: settings.enabled,
        reminder_time: settings.reminderTime,
        habit_completions: settings.habitCompletions,
        daily_reminder: settings.dailyReminder,
        schedule_reminders: settings.scheduleReminders,
        custom_reminders: settings.customReminders,
        eye_blink_reminders: settings.eyeBlinkReminders,
        water_intake_reminders: settings.waterIntakeReminders,
      })
      .eq('user_id', user.id);
    
    if (error) console.error('Error saving settings:', error);
  }, [user]);

  // Migrate local data to cloud on first login
  const migrateLocalData = useCallback(async () => {
    if (!user) return;
    
    // Check if user already has data in cloud
    const { data: existingHabits } = await supabase
      .from('habits')
      .select('id')
      .limit(1);
    
    if (existingHabits && existingHabits.length > 0) {
      // User already has cloud data, skip migration
      return;
    }
    
    // Migrate local storage data
    const localHabits = localStorage.getItem('habits-v3');
    const localSchedule = localStorage.getItem('schedule');
    const localReminders = localStorage.getItem('reminders');
    const localSettings = localStorage.getItem('notificationPrefs');
    
    if (localHabits) {
      const habits: Habit[] = JSON.parse(localHabits).map((h: any) => ({
        ...h,
        activeDays: h.activeDays || Array(7).fill(true),
      }));
      await saveHabits(habits);
    }
    
    if (localSchedule) {
      await saveSchedule(JSON.parse(localSchedule));
    }
    
    if (localReminders) {
      await saveReminders(JSON.parse(localReminders));
    }
    
    if (localSettings) {
      await saveSettings(JSON.parse(localSettings));
    }
    
    toast({
      title: 'Data synced!',
      description: 'Your habits have been saved to the cloud.',
    });
  }, [user, saveHabits, saveSchedule, saveReminders, saveSettings, toast]);

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
