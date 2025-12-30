import { useState } from 'react';
import { Plus, Trash2, Bell, ChevronDown, CheckCircle2, Clock, Eye, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmojiPicker from './EmojiPicker';
import SwipeableItem from './SwipeableItem';
import AppleTimePicker from './AppleTimePicker';
import { Switch } from '@/components/ui/switch';
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
  eyeBlinkEnabled?: boolean;
  waterIntakeEnabled?: boolean;
  waterIntakeInterval?: number;
  onToggleEyeBlink?: (enabled: boolean) => void;
  onToggleWaterIntake?: (enabled: boolean) => void;
  onWaterIntakeIntervalChange?: (interval: number) => void;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const waterIntervalOptions = [15, 20, 30, 45, 60];

const Reminders = ({ 
  reminders, 
  onAdd, 
  onDelete, 
  onToggleComplete, 
  compact = false,
  eyeBlinkEnabled = false,
  waterIntakeEnabled = false,
  waterIntakeInterval = 30,
  onToggleEyeBlink,
  onToggleWaterIntake,
  onWaterIntakeIntervalChange,
}: RemindersProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showWaterSettings, setShowWaterSettings] = useState(false);
  const [newDay, setNewDay] = useState('Monday');
  const [newTime, setNewTime] = useState('09:00');
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🔔');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const handleAdd = () => {
    if (newTime && newName.trim()) {
      onAdd({
        day: newDay,
        time: newTime,
        name: newName.trim(),
        emoji: newEmoji,
      });
      setNewTime('09:00');
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

  // Compact version for mobile with swipe gestures
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
          <div className="px-3 pb-3 max-h-48 overflow-y-auto scrollbar-thin space-y-1">
            {/* Quick toggles for eye blink and water intake */}
            <div className="flex flex-col gap-2 py-2 border-b border-border/30 mb-2">
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleEyeBlink?.(!eyeBlinkEnabled)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 flex-1",
                    eyeBlinkEnabled 
                      ? "bg-primary/20 text-primary shadow-sm ring-1 ring-primary/30" 
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                  title="Eye Blink Reminders (20-20-20 rule)"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-[10px]">20min</span>
                </button>
                <button
                  onClick={() => onToggleWaterIntake?.(!waterIntakeEnabled)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 flex-1",
                    waterIntakeEnabled 
                      ? "bg-accent/20 text-accent shadow-sm ring-1 ring-accent/30" 
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                  title="Water Intake Reminders"
                >
                  <Droplets className="w-4 h-4" />
                  <span className="text-[10px]">{waterIntakeInterval}min</span>
                </button>
              </div>
              {/* Water interval selector - compact mobile */}
              {waterIntakeEnabled && (
                <div className="flex items-center justify-center gap-1">
                  {waterIntervalOptions.map((interval) => (
                    <button
                      key={interval}
                      onClick={() => onWaterIntakeIntervalChange?.(interval)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                        waterIntakeInterval === interval
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {interval}m
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pending reminders with swipe */}
            {pendingReminders.map((reminder) => (
              <SwipeableItem
                key={reminder.id}
                onComplete={() => onToggleComplete?.(reminder.id)}
                onDelete={() => setDeleteConfirmId(reminder.id)}
              >
                <div className="flex items-center gap-2 py-1.5 px-2 text-xs group">
                  <button 
                    onClick={() => onToggleComplete?.(reminder.id)}
                    className="hover:scale-110 transition-transform"
                    title="Mark as done"
                  >
                    <span>{reminder.emoji}</span>
                  </button>
                  <span className="text-muted-foreground">{shortDays[daysOfWeek.indexOf(reminder.day)]}</span>
                  <span className="text-foreground truncate flex-1">{reminder.name}</span>
                  <button
                    onClick={() => setDeleteConfirmId(reminder.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </SwipeableItem>
            ))}
            
            {!hasReminders && reminders.filter(r => r.completed).length === 0 && (
              <p className="text-xs text-muted-foreground italic py-1">No reminders</p>
            )}

            {/* Completed reminders */}
            {reminders.filter(r => r.completed).length > 0 && (
              <div className="pt-2 mt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Completed</p>
                {reminders.filter(r => r.completed).map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-2 py-1 text-xs group">
                    <CheckCircle2 className="w-3 h-3 text-accent" />
                    <span className="text-muted-foreground line-through truncate flex-1">{reminder.name}</span>
                    <button
                      onClick={() => onToggleComplete?.(reminder.id)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Undo
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(reminder.id)}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add more button */}
            {isAdding ? (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <div className="flex gap-2 items-center">
                  <EmojiPicker value={newEmoji} onChange={setNewEmoji} />
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="text-xs bg-muted/50 rounded-lg px-2 py-1 text-foreground"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{shortDays[daysOfWeek.indexOf(day)]}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setTimePickerOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg text-xs text-foreground"
                  >
                    <Clock className="w-3 h-3" />
                    {newTime}
                  </button>
                </div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Reminder name"
                  className="w-full text-xs bg-muted/50 rounded-lg px-2 py-1.5 text-foreground placeholder:text-muted-foreground"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <div className="flex gap-2">
                  <button onClick={handleAdd} className="text-xs text-accent font-medium">Add</button>
                  <button onClick={() => setIsAdding(false)} className="text-xs text-muted-foreground">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 hover:bg-accent/20 text-accent transition-colors mt-2"
                title="Add reminder"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Time Picker */}
        <AppleTimePicker
          value={newTime}
          onChange={setNewTime}
          open={timePickerOpen}
          onOpenChange={setTimePickerOpen}
        />

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
          {/* Eye Blink & Water Intake Quick Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => onToggleEyeBlink?.(!eyeBlinkEnabled)}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                eyeBlinkEnabled 
                  ? "bg-primary/10 border-primary text-primary shadow-sm" 
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:border-border"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                eyeBlinkEnabled ? "bg-primary/20" : "bg-muted"
              )}>
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Eye Blink</span>
              <span className="text-[10px] text-muted-foreground">Every 20 min</span>
            </button>
            <div className="flex-1 flex flex-col">
              <button
                onClick={() => onToggleWaterIntake?.(!waterIntakeEnabled)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl rounded-b-none border-2 border-b-0 transition-all duration-200",
                  waterIntakeEnabled 
                    ? "bg-accent/10 border-accent text-accent shadow-sm" 
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:border-border"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  waterIntakeEnabled ? "bg-accent/20" : "bg-muted"
                )}>
                  <Droplets className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Water Intake</span>
              </button>
              {/* Water Interval Selector */}
              <div className={cn(
                "flex items-center justify-center gap-1 py-2 rounded-b-xl border-2 border-t-0",
                waterIntakeEnabled 
                  ? "bg-accent/5 border-accent" 
                  : "bg-muted/20 border-border/50"
              )}>
                {waterIntervalOptions.map((interval) => (
                  <button
                    key={interval}
                    onClick={() => onWaterIntakeIntervalChange?.(interval)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                      waterIntakeInterval === interval
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {interval}m
                  </button>
                ))}
              </div>
            </div>
          </div>

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
                <button
                  onClick={() => setTimePickerOpen(true)}
                  className="flex items-center gap-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {newTime}
                </button>
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
                    setNewTime('09:00');
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
              className="flex items-center justify-center gap-2 text-muted-foreground hover:text-accent transition-colors py-2.5 px-3 w-full rounded-xl hover:bg-muted/30 border border-dashed border-border/50 hover:border-accent/30"
              title="Add reminder"
            >
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
            </button>
          )}
        </div>
      )}
    </div>

      {/* Time Picker */}
      <AppleTimePicker
        value={newTime}
        onChange={setNewTime}
        open={timePickerOpen}
        onOpenChange={setTimePickerOpen}
      />

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
