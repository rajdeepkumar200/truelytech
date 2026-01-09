import { useState } from 'react';
import { Bell, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { requestNotificationPermission } from '@/lib/notifications';

export interface NotificationPreferences {
  enabled: boolean;
  reminderTime: number; // minutes before
  habitCompletions: boolean;
  dailyReminder: boolean;
  scheduleReminders: boolean;
  customReminders: boolean;
}

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: NotificationPreferences) => void;
}

const reminderTimeOptions = [
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
];

const NotificationSettings = ({ preferences, onUpdate }: NotificationSettingsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (key === 'enabled' || key === 'reminderTime') return;
    onUpdate({
      ...preferences,
      [key]: !preferences[key as keyof Omit<NotificationPreferences, 'reminderTime'>],
    });
  };

  const handleReminderTimeChange = (time: number) => {
    onUpdate({
      ...preferences,
      reminderTime: time,
    });
  };

  const handleMasterToggle = async () => {
    if (!preferences.enabled) {
      try {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') onUpdate({ ...preferences, enabled: true });
        else onUpdate({ ...preferences, enabled: false });
      } catch {
        onUpdate({ ...preferences, enabled: false });
      }
    } else {
      onUpdate({ ...preferences, enabled: false });
    }
  };

  return (
    <div className="bg-popover rounded-2xl border border-border/50 p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Notification Settings</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Enable Notifications</span>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={handleMasterToggle}
            />
          </div>

          {preferences.enabled && (
            <>
              {/* Reminder Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Reminder Time</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reminderTimeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleReminderTimeChange(option.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs transition-colors",
                        preferences.reminderTime === option.value
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Notification Types</p>
                
                <label className="flex items-center justify-between py-1.5 cursor-pointer">
                  <span className="text-sm text-foreground">Habit Completions</span>
                  <Switch
                    checked={preferences.habitCompletions}
                    onCheckedChange={() => handleToggle('habitCompletions')}
                  />
                </label>

                <label className="flex items-center justify-between py-1.5 cursor-pointer">
                  <span className="text-sm text-foreground">Daily Morning Reminder</span>
                  <Switch
                    checked={preferences.dailyReminder}
                    onCheckedChange={() => handleToggle('dailyReminder')}
                  />
                </label>

                <label className="flex items-center justify-between py-1.5 cursor-pointer">
                  <span className="text-sm text-foreground">Schedule Task Reminders</span>
                  <Switch
                    checked={preferences.scheduleReminders}
                    onCheckedChange={() => handleToggle('scheduleReminders')}
                  />
                </label>

                <label className="flex items-center justify-between py-1.5 cursor-pointer">
                  <span className="text-sm text-foreground">Custom Reminders</span>
                  <Switch
                    checked={preferences.customReminders}
                    onCheckedChange={() => handleToggle('customReminders')}
                  />
                </label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;