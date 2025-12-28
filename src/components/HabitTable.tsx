import { Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
}

interface HabitTableProps {
  habits: Habit[];
  onToggleDay: (habitId: string, dayIndex: number) => void;
  onDeleteHabit: (habitId: string) => void;
}

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const HabitTable = ({ habits, onToggleDay, onDeleteHabit }: HabitTableProps) => {
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
          const completedCount = habit.completedDays.filter(Boolean).length;
          const progressPercent = (completedCount / 7) * 100;

          return (
            <div
              key={habit.id}
              className="grid grid-cols-[1fr_repeat(7,40px)_100px] md:grid-cols-[1fr_repeat(7,48px)_120px] gap-1 px-3 py-2 items-center group hover:bg-muted/30 transition-colors"
            >
              {/* Habit Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{habit.icon}</span>
                <span className="text-sm text-foreground truncate">{habit.name}</span>
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
