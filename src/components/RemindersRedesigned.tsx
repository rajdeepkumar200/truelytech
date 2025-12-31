import { useState } from 'react';
import { Plus, Trash2, Bell, CheckCircle2, Clock, Eye, Droplets, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmojiPicker from './EmojiPicker';
import SwipeableItem from './SwipeableItem';
import AppleTimePicker from './AppleTimePicker';
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
  soundEnabled?: boolean;
  onToggleEyeBlink?: (enabled: boolean) => void;
  onToggleWaterIntake?: (enabled: boolean) => void;
  onWaterIntakeIntervalChange?: (interval: number) => void;
  onToggleSound?: (enabled: boolean) => void;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const waterIntervalOptions = [15, 20, 30, 45, 60];

const RemindersRedesigned = ({ 
  reminders, 
  onAdd, 
  onDelete, 
  onToggleComplete, 
  compact = false,
  eyeBlinkEnabled = false,
  waterIntakeEnabled = false,
  waterIntakeInterval = 30,
  soundEnabled = true,
  onToggleEyeBlink,
  onToggleWaterIntake,
  onWaterIntakeIntervalChange,
  onToggleSound,
}: RemindersProps) => {
  const [isAdding, setIsAdding] = useState(false);
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

  const pendingReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  // Group pending by day
  const remindersByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = pendingReminders.filter(r => r.day === day).sort((a, b) => a.time.localeCompare(b.time));
    return acc;
  }, {} as Record<string, Reminder[]>);

  // Compact mobile version
  if (compact) {
    return (
      <div className="bg-gradient-to-br from-accent/5 via-popover to-primary/5 rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-accent" />
            </div>
            <span className="font-semibold text-foreground">Reminders</span>
            {pendingReminders.length > 0 && (
              <span className="ml-auto text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                {pendingReminders.length}
              </span>
            )}
          </div>

          {/* Quick toggles row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onToggleEyeBlink?.(!eyeBlinkEnabled)}
              className={cn(
                "flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all duration-200",
                eyeBlinkEnabled 
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Eye className="w-4 h-4" />
              <span className="text-[10px] font-medium">Eye 20m</span>
            </button>
            <button
              onClick={() => onToggleWaterIntake?.(!waterIntakeEnabled)}
              className={cn(
                "flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all duration-200",
                waterIntakeEnabled 
                  ? "bg-accent/15 text-accent ring-1 ring-accent/30" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Droplets className="w-4 h-4" />
              <span className="text-[10px] font-medium">Water {waterIntakeInterval}m</span>
            </button>
            <button
              onClick={() => onToggleSound?.(!soundEnabled)}
              className={cn(
                "flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all duration-200",
                soundEnabled 
                  ? "bg-foreground/10 text-foreground" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[10px] font-medium">Sound</span>
            </button>
          </div>

          {/* Water interval selector */}
          {waterIntakeEnabled && (
            <div className="flex items-center justify-center gap-1 py-1">
              {waterIntervalOptions.map((interval) => (
                <button
                  key={interval}
                  onClick={() => onWaterIntakeIntervalChange?.(interval)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-medium transition-colors",
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

          {/* Reminders list */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {pendingReminders.map((reminder) => (
              <SwipeableItem
                key={reminder.id}
                onComplete={() => onToggleComplete?.(reminder.id)}
                onDelete={() => setDeleteConfirmId(reminder.id)}
              >
                <div className="flex items-center gap-2 py-2 px-2 text-sm group bg-background/50 rounded-lg">
                  <button 
                    onClick={() => onToggleComplete?.(reminder.id)}
                    className="hover:scale-110 transition-transform"
                  >
                    <span>{reminder.emoji}</span>
                  </button>
                  <span className="text-xs text-muted-foreground font-mono">{reminder.time}</span>
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
            {pendingReminders.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No reminders set</p>
            )}
          </div>

          {/* Add button */}
          {isAdding ? (
            <div className="space-y-2 p-3 bg-muted/30 rounded-xl">
              <div className="flex gap-2 items-center">
                <EmojiPicker value={newEmoji} onChange={setNewEmoji} />
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="text-xs bg-background rounded-lg px-2 py-1.5 text-foreground border border-border"
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{shortDays[daysOfWeek.indexOf(day)]}</option>
                  ))}
                </select>
                <button
                  onClick={() => setTimePickerOpen(true)}
                  className="flex items-center gap-1 px-2 py-1.5 bg-background rounded-lg text-xs text-foreground border border-border"
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
                className="w-full text-sm bg-background rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground border border-border"
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
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border/50"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-medium">Add Reminder</span>
            </button>
          )}
        </div>

        <AppleTimePicker
          value={newTime}
          onChange={setNewTime}
          open={timePickerOpen}
          onOpenChange={setTimePickerOpen}
        />

        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete reminder?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Desktop version - beautifully redesigned
  return (
    <>
      <div className="bg-gradient-to-br from-accent/5 via-popover to-primary/5 rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Reminders</h3>
              <p className="text-xs text-muted-foreground">{pendingReminders.length} active</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Eye Blink */}
            <button
              onClick={() => onToggleEyeBlink?.(!eyeBlinkEnabled)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                eyeBlinkEnabled 
                  ? "bg-primary/10 border-primary text-primary" 
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                eyeBlinkEnabled ? "bg-primary/20" : "bg-muted"
              )}>
                <Eye className="w-5 h-5" />
              </div>
              <div className="text-center">
                <span className="text-xs font-medium block">Eye Break</span>
                <span className="text-[10px] opacity-70">20 min</span>
              </div>
            </button>

            {/* Water Intake */}
            <button
              onClick={() => onToggleWaterIntake?.(!waterIntakeEnabled)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                waterIntakeEnabled 
                  ? "bg-accent/10 border-accent text-accent" 
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                waterIntakeEnabled ? "bg-accent/20" : "bg-muted"
              )}>
                <Droplets className="w-5 h-5" />
              </div>
              <div className="text-center">
                <span className="text-xs font-medium block">Water</span>
                <span className="text-[10px] opacity-70">{waterIntakeInterval} min</span>
              </div>
            </button>

            {/* Sound */}
            <button
              onClick={() => onToggleSound?.(!soundEnabled)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                soundEnabled 
                  ? "bg-foreground/5 border-border text-foreground" 
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                soundEnabled ? "bg-foreground/10" : "bg-muted"
              )}>
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div className="text-center">
                <span className="text-xs font-medium block">Sound</span>
                <span className="text-[10px] opacity-70">{soundEnabled ? 'On' : 'Off'}</span>
              </div>
            </button>
          </div>

          {/* Water interval selector */}
          {waterIntakeEnabled && (
            <div className="flex items-center justify-center gap-2 py-2 px-3 bg-accent/5 rounded-xl">
              <span className="text-xs text-muted-foreground">Interval:</span>
              {waterIntervalOptions.map((interval) => (
                <button
                  key={interval}
                  onClick={() => onWaterIntakeIntervalChange?.(interval)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
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

          {/* Custom Reminders List */}
          {pendingReminders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custom Reminders</h4>
              <div className="space-y-1.5">
                {pendingReminders.map(reminder => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-background/50 hover:bg-muted/30 transition-all group"
                  >
                    <button
                      onClick={() => onToggleComplete?.(reminder.id)}
                      className="hover:scale-110 transition-transform"
                    >
                      <span className="text-lg">{reminder.emoji}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{reminder.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shortDays[daysOfWeek.indexOf(reminder.day)]} at {reminder.time}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onToggleComplete?.(reminder.id)}
                        className="p-1.5 hover:bg-accent/10 rounded-lg"
                      >
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(reminder.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedReminders.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-border/30">
              <h4 className="text-xs font-medium text-muted-foreground">Completed</h4>
              {completedReminders.map(reminder => (
                <div key={reminder.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-muted/20 group">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground line-through flex-1 truncate">{reminder.name}</span>
                  <button
                    onClick={() => onToggleComplete?.(reminder.id)}
                    className="text-xs text-primary hover:underline opacity-0 group-hover:opacity-100"
                  >
                    Undo
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(reminder.id)}
                    className="p-1 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Form */}
          {isAdding ? (
            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="flex gap-2 items-center flex-wrap">
                <EmojiPicker value={newEmoji} onChange={setNewEmoji} />
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <button
                  onClick={() => setTimePickerOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground hover:bg-muted/50"
                >
                  <Clock className="w-4 h-4" />
                  {newTime}
                </button>
              </div>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="What to remind?"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-lg hover:opacity-90"
                >
                  Add Reminder
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-muted-foreground text-sm hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border/50 hover:border-accent/30"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Reminder</span>
            </button>
          )}
        </div>
      </div>

      <AppleTimePicker
        value={newTime}
        onChange={setNewTime}
        open={timePickerOpen}
        onOpenChange={setTimePickerOpen}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reminder?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RemindersRedesigned;