import { useState } from 'react';
import { Plus, Trash2, Bell, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmojiPicker from './EmojiPicker';

interface Reminder {
  id: string;
  day: string;
  time: string;
  name: string;
  emoji: string;
}

interface RemindersProps {
  reminders: Reminder[];
  onAdd: (reminder: Omit<Reminder, 'id'>) => void;
  onDelete: (id: string) => void;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Reminders = ({ reminders, onAdd, onDelete }: RemindersProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newDay, setNewDay] = useState('Monday');
  const [newTime, setNewTime] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🔔');

  const handleAdd = () => {
    if (newTime && newName.trim()) {
      onAdd({
        day: newDay,
        time: newTime,
        name: newName.trim(),
        emoji: newEmoji,
      });
      setNewTime('');
      setNewName('');
      setNewEmoji('🔔');
      setIsAdding(false);
    }
  };

  // Group reminders by day
  const remindersByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = reminders.filter(r => r.day === day).sort((a, b) => a.time.localeCompare(b.time));
    return acc;
  }, {} as Record<string, Reminder[]>);

  const hasReminders = reminders.length > 0;

  return (
    <div className="bg-popover rounded-2xl overflow-hidden border border-border/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            !isExpanded && "-rotate-90"
          )}
        />
        <Bell className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">Reminders</span>
        {hasReminders && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {reminders.length}
          </span>
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-5 pb-5">
          {/* Reminders List */}
          {hasReminders && (
            <div className="space-y-3 mb-3">
              {daysOfWeek.map(day => {
                const dayReminders = remindersByDay[day];
                if (dayReminders.length === 0) return null;
                
                return (
                  <div key={day}>
                    <div className="text-xs font-medium text-muted-foreground mb-1.5">{day}</div>
                    <div className="space-y-1">
                      {dayReminders.map(reminder => (
                        <div
                          key={reminder.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/30 transition-colors group"
                        >
                          <span className="text-lg">{reminder.emoji}</span>
                          <span className="text-sm text-muted-foreground font-mono w-14">
                            {reminder.time}
                          </span>
                          <span className="flex-1 text-sm text-foreground">{reminder.name}</span>
                          <button
                            onClick={() => onDelete(reminder.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Form */}
          {isAdding ? (
            <div className="space-y-3 p-3 bg-muted/30 rounded-xl">
              <div className="flex gap-2 items-center">
                <EmojiPicker value={newEmoji} onChange={setNewEmoji} />
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="text-sm bg-background border border-border rounded-lg px-2 py-2 text-foreground"
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="text-sm bg-background border border-border rounded-lg px-2 py-2 text-muted-foreground"
                />
              </div>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Reminder name"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Add Reminder
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTime('');
                    setNewName('');
                    setNewEmoji('🔔');
                  }}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 w-full rounded-xl hover:bg-muted/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add reminder</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Reminders;
