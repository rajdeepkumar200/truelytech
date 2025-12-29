import { Trash2, Settings2, Flame } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
  streak?: number;
}

interface HabitTableProps {
  habits: Habit[];
  onToggleDay: (habitId: string, dayIndex: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onUpdateActiveDays: (habitId: string, activeDays: boolean[]) => void;
}

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Calculate streak from the end of the week backwards
const calculateStreak = (completedDays: boolean[], activeDays: boolean[]): number => {
  let streak = 0;
  // Start from the most recent day and count backwards
  for (let i = completedDays.length - 1; i >= 0; i--) {
    if (!activeDays[i]) continue; // Skip inactive days
    if (completedDays[i]) {
      streak++;
    } else {
      break; // Streak broken
    }
  }
  return streak;
};

const HabitTable = ({ habits, onToggleDay, onDeleteHabit, onUpdateActiveDays }: HabitTableProps) => {
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr_repeat(7,36px)_80px] md:grid-cols-[1fr_repeat(7,44px)_100px] gap-1 px-2 py-3 text-xs text-muted-foreground uppercase tracking-wide">
        <div>Habit</div>
        {days.map((day) => (
          <div key={day} className="text-center font-medium">{day}</div>
        ))}
        <div className="text-center">Progress</div>
      </div>

      {/* Habit Rows */}
      <div className="space-y-1">
        {habits.map((habit) => {
          const activeDays = habit.activeDays || Array(7).fill(true);
          const activeDaysCount = activeDays.filter(Boolean).length;
          const completedCount = habit.completedDays.filter((completed, i) => completed && activeDays[i]).length;
          const progressPercent = activeDaysCount > 0 ? (completedCount / activeDaysCount) * 100 : 0;
          const streak = calculateStreak(habit.completedDays, activeDays);

          return (
            <div
              key={habit.id}
              className="grid grid-cols-[1fr_repeat(7,36px)_80px] md:grid-cols-[1fr_repeat(7,44px)_100px] gap-1 px-2 py-2.5 items-center group hover:bg-muted/40 rounded-xl transition-colors"
            >
              {/* Habit Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{habit.icon}</span>
                <span className="text-sm text-foreground truncate">{habit.name}</span>
                
                {/* Streak Badge */}
                {streak > 0 && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/10 rounded-full flex-shrink-0">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span className="text-xs font-medium text-orange-500">{streak}</span>
                  </div>
                )}
                
                {/* Settings Popover */}
                <Popover open={editingHabitId === habit.id} onOpenChange={(open) => setEditingHabitId(open ? habit.id : null)}>
                  <PopoverTrigger asChild>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded flex-shrink-0"
                    >
                      <Settings2 className="w-3 h-3 text-primary" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Active Days</p>
                      <p className="text-xs text-muted-foreground">Choose which days to track this habit</p>
                      <div className="space-y-1 pt-2">
                        {fullDays.map((dayName, index) => (
                          <label
                            key={dayName}
                            className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-1"
                          >
                            <Checkbox
                              checked={activeDays[index]}
                              onCheckedChange={(checked) => {
                                const newActiveDays = [...activeDays];
                                newActiveDays[index] = !!checked;
                                onUpdateActiveDays(habit.id, newActiveDays);
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-foreground">{dayName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded ml-auto flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>

              {/* Day Checkboxes */}
              {habit.completedDays.map((isComplete, dayIndex) => (
                <div key={dayIndex} className="flex items-center justify-center">
                  {activeDays[dayIndex] ? (
                    <Checkbox
                      checked={isComplete}
                      onCheckedChange={() => onToggleDay(habit.id, dayIndex)}
                      className={cn(
                        "w-5 h-5 border-2 transition-all",
                        isComplete 
                          ? "bg-habit-checkbox border-habit-checkbox data-[state=checked]:bg-habit-checkbox data-[state=checked]:border-habit-checkbox" 
                          : "border-border"
                      )}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded bg-muted/30" title="Not active on this day" />
                  )}
                </div>
              ))}

              {/* Progress Bar */}
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(progressPercent)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HabitTable;
