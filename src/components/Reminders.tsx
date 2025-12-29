import { useState } from 'react';
import { Plus, Trash2, Bell, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmojiPicker from './EmojiPicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Reminder {
  id: string;
  day: string;
  time: string;
  name: string;
  emoji: string;
  completed?: boolean;
}

interface RemindersProps {
  reminders: Reminder[];
  onAdd: (reminder: Omit<Reminder, 'id'>) => void;
  onDelete: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  compact?: boolean;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Reminders = ({ reminders, onAdd, onDelete, onToggleComplete, compact = false }: RemindersProps) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isAdding, setIsAdding] = useState(false);
  const [newDay, setNewDay] = useState('Monday');
  const [newTime, setNewTime] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🔔');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  // Group reminders by day
  const remindersByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = reminders.filter(r => r.day === day && !r.completed).sort((a, b) => a.time.localeCompare(b.time));
    return acc;
  }, {} as Record<string, Reminder[]>);

  const pendingReminders = reminders.filter(r => !r.completed);
  const hasReminders = pendingReminders.length > 0;

  // Compact version for mobile
  if (compact) {
    return (
      <div className="bg-gradient-to-br from-accent/5 via-popover to-primary/5 rounded-2xl border border-border/50 overflow-hidden shadow-sm h-full">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-accent" />
          </div>
          <span className="font-medium text-foreground text-sm flex-1 text-left">Reminders</span>
          {hasReminders && (
            <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">{pendingReminders.length}</span>
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", !isExpanded && "-rotate-90")} />
        </button>
        
        {isExpanded && (
          <div className="px-3 pb-3 max-h-32 overflow-y-auto scrollbar-thin">
            {pendingReminders.slice(0, 3).map((reminder) => (
              <div key={reminder.id} className="flex items-center gap-2 py-1.5 text-xs group">
                <button 
                  onClick={() => onToggleComplete?.(reminder.id)}
                  className="hover:scale-110 transition-transform"
                >
                  <span>{reminder.emoji}</span>
                </button>
                <span className="text-muted-foreground">{shortDays[daysOfWeek.indexOf(reminder.day)]}</span>
                <span className="text-foreground truncate flex-1">{reminder.name}</span>
              </div>
            ))}
            {pendingReminders.length > 3 && (
              <p className="text-xs text-muted-foreground">+{pendingReminders.length - 3} more</p>
            )}
            {!hasReminders && (
              <p className="text-xs text-muted-foreground italic py-1">No reminders</p>
            )}
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline mt-2"
            >
              <Plus className="w-3 h-3" />
              Add more
            </button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this reminder? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <>
    <div className="bg-gradient-to-br from-accent/5 via-popover to-primary/5 rounded-2xl overflow-hidden border border-border/50 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <Bell className="w-4 h-4 text-accent" />
        </div>
        <span className="font-semibold text-foreground flex-1 text-left">Reminders</span>
        {hasReminders && (
          <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
            {pendingReminders.length} active
          </span>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            !isExpanded && "-rotate-90"
          )}
        />
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
                    <div className="text-xs font-semibold text-accent/80 mb-1.5 uppercase tracking-wide">{day}</div>
                    <div className="space-y-1">
                      {dayReminders.map(reminder => (
                        <div
                          key={reminder.id}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/30 transition-all duration-200 group border border-transparent hover:border-border/30"
                        >
                          <button
                            onClick={() => onToggleComplete?.(reminder.id)}
                            className="hover:scale-110 transition-transform"
                          >
                            <span className="text-lg">{reminder.emoji}</span>
                          </button>
                          <span className="text-sm text-accent/80 font-mono w-14 font-medium">
                            {reminder.time}
                          </span>
                          <span className="flex-1 text-sm text-foreground">{reminder.name}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onToggleComplete?.(reminder.id)}
                              className="p-1.5 hover:bg-accent/10 rounded-lg"
                              title="Mark as done"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(reminder.id)}
                              className="p-1.5 hover:bg-destructive/10 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed Reminders */}
          {reminders.filter(r => r.completed).length > 0 && (
            <div className="mb-3 pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Completed</p>
              {reminders.filter(r => r.completed).map(reminder => (
                <div
                  key={reminder.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl bg-muted/20 group"
                >
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground line-through flex-1">{reminder.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onToggleComplete?.(reminder.id)}
                      className="p-1.5 hover:bg-primary/10 rounded-lg text-xs text-primary"
                      title="Undo"
                    >
                      Undo
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(reminder.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Form */}
          {isAdding ? (
            <div className="space-y-3 p-4 bg-muted/40 rounded-xl border border-border/50">
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
                  className="text-sm text-accent font-medium hover:underline"
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
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors py-2.5 px-3 w-full rounded-xl hover:bg-muted/30 border border-dashed border-border/50 hover:border-accent/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add reminder</span>
            </button>
          )}
        </div>
      )}
    </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Reminders;