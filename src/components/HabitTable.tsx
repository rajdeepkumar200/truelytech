import { Trash2, Settings2 } from 'lucide-react';
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
  activeDays: boolean[]; // Which days the habit is active
}

interface HabitTableProps {
  habits: Habit[];
  onToggleDay: (habitId: string, dayIndex: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onUpdateActiveDays: (habitId: string, activeDays: boolean[]) => void;
}

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const HabitTable = ({ habits, onToggleDay, onDeleteHabit, onUpdateActiveDays }: HabitTableProps) => {
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  return (
    <div className="bg-popover rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr_repeat(7,40px)_100px] md:grid-cols-[1fr_repeat(7,48px)_120px] gap-1 px-3 py-2 border-b border-border text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium">Aa</span>
          <span>Habit</span>
        </div>
        {days.map((day) => (
          <div key={day} className="flex items-center justify-center gap-1">
            <Checkbox className="w-3 h-3 opacity-50" checked disabled />
            <span className="text-xs">{day}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-habit-progress">
          <span>♥</span>
          <span className="text-xs">Weekly Progress</span>
        </div>
      </div>

      {/* Habit Rows */}
      <div className="divide-y divide-border">
        {habits.map((habit) => {
          const activeDaysCount = habit.activeDays.filter(Boolean).length;
          const completedCount = habit.completedDays.filter((completed, i) => completed && habit.activeDays[i]).length;
          const progressPercent = activeDaysCount > 0 ? (completedCount / activeDaysCount) * 100 : 0;

          return (
            <div
              key={habit.id}
              className="grid grid-cols-[1fr_repeat(7,40px)_100px] md:grid-cols-[1fr_repeat(7,48px)_120px] gap-1 px-3 py-2 items-center group hover:bg-muted/30 transition-colors"
            >
              {/* Habit Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{habit.icon}</span>
                <span className="text-sm text-foreground truncate">{habit.name}</span>
                
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
                              checked={habit.activeDays[index]}
                              onCheckedChange={(checked) => {
                                const newActiveDays = [...habit.activeDays];
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
                  {habit.activeDays[dayIndex] ? (
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
              <div className="flex items-center px-2">
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-habit-progress rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HabitTable;
