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
      hidden: h.hidden || false,
    }));
  }, [user]);

  // Save habits to database using upsert for proper sync
  const saveHabits = useCallback(async (habits: Habit[]) => {
    if (!user) return;
    
    // Get existing habit IDs from cloud
    const { data: existingHabits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', user.id);
    
    const existingIds = new Set(existingHabits?.map(h => h.id) || []);
    const currentIds = new Set(habits.map(h => h.id));
    
    // Delete habits that no longer exist locally
    const toDelete = [...existingIds].filter(id => !currentIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from('habits').delete().in('id', toDelete);
    }
    
    // Upsert all current habits
    if (habits.length > 0) {
      for (let i = 0; i < habits.length; i++) {
        const h = habits[i];
        const isExisting = existingIds.has(h.id);
        
        if (isExisting) {
          // Note: 'hidden' column requires migration. If it fails, we catch and retry without it.
          const { error } = await supabase.from('habits').update({
            name: h.name,
            icon: h.icon,
            completed_days: h.completedDays,
            active_days: h.activeDays,
            category: h.category || null,
            weekly_goal: h.weeklyGoal || 0,
            sort_order: i,
            hidden: h.hidden || false,
          }).eq('id', h.id);

          if (error) {
            // Fallback for missing column
            await supabase.from('habits').update({
              name: h.name,
              icon: h.icon,
              completed_days: h.completedDays,
              active_days: h.activeDays,
              category: h.category || null,
              weekly_goal: h.weeklyGoal || 0,
              sort_order: i,
            }).eq('id', h.id);
          }
        } else {
          const { error } = await supabase.from('habits').insert({
            id: h.id,
            user_id: user.id,
            name: h.name,
            icon: h.icon,
            completed_days: h.completedDays,
            active_days: h.activeDays,
            category: h.category || null,
            weekly_goal: h.weeklyGoal || 0,
            sort_order: i,
            hidden: h.hidden || false,
          });

          if (error) {
             await supabase.from('habits').insert({
              id: h.id,
              user_id: user.id,
              name: h.name,
              icon: h.icon,
              completed_days: h.completedDays,
              active_days: h.activeDays,
              category: h.category || null,
              weekly_goal: h.weeklyGoal || 0,
              sort_order: i,
            });
          }
        }
      }
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

  // Save schedule items using upsert for proper sync
  const saveSchedule = useCallback(async (schedule: ScheduleItem[]) => {
    if (!user) return;
    
    const { data: existingItems } = await supabase
      .from('schedule_items')
      .select('id')
      .eq('user_id', user.id);
    
    const existingIds = new Set(existingItems?.map(s => s.id) || []);
    const currentIds = new Set(schedule.map(s => s.id));
    
    const toDelete = [...existingIds].filter(id => !currentIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from('schedule_items').delete().in('id', toDelete);
    }
    
    for (const s of schedule) {
      if (existingIds.has(s.id)) {
        await supabase.from('schedule_items').update({
          time: s.time,
          task: s.task,
          emoji: s.emoji || '📋',
          completed: s.completed || false,
        }).eq('id', s.id);
      } else {
        await supabase.from('schedule_items').insert({
          user_id: user.id,
          time: s.time,
          task: s.task,
          emoji: s.emoji || '📋',
          completed: s.completed || false,
        });
      }
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

  // Save reminders using upsert for proper sync
  const saveReminders = useCallback(async (reminders: Reminder[]) => {
    if (!user) return;
    
    const { data: existingReminders } = await supabase
      .from('reminders')
      .select('id')
      .eq('user_id', user.id);
    
    const existingIds = new Set(existingReminders?.map(r => r.id) || []);
    const currentIds = new Set(reminders.map(r => r.id));
    
    const toDelete = [...existingIds].filter(id => !currentIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from('reminders').delete().in('id', toDelete);
    }
    
    for (const r of reminders) {
      if (existingIds.has(r.id)) {
        await supabase.from('reminders').update({
          day: r.day,
          time: r.time,
          name: r.name,
          emoji: r.emoji || '🔔',
          completed: r.completed || false,
        }).eq('id', r.id);
      } else {
        await supabase.from('reminders').insert({
          user_id: user.id,
          day: r.day,
          time: r.time,
          name: r.name,
          emoji: r.emoji || '🔔',
          completed: r.completed || false,
        });
      }
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

  // Save settings with upsert
  const saveSettings = useCallback(async (settings: NotificationPreferences) => {
    if (!user) return;
    
    // First check if settings exist
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    const settingsData = {
      notification_enabled: settings.enabled,
      reminder_time: settings.reminderTime,
      habit_completions: settings.habitCompletions,
      daily_reminder: settings.dailyReminder,
      schedule_reminders: settings.scheduleReminders,
      custom_reminders: settings.customReminders,
      eye_blink_reminders: settings.eyeBlinkReminders,
      water_intake_reminders: settings.waterIntakeReminders,
    };
    
    if (existing) {
      const { error } = await supabase
        .from('user_settings')
        .update(settingsData)
        .eq('user_id', user.id);
      if (error) console.error('Error updating settings:', error);
    } else {
      const { error } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id, ...settingsData });
      if (error) console.error('Error inserting settings:', error);
    }
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
