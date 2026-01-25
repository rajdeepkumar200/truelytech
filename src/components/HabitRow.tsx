import { Trash2 } from 'lucide-react';
import HabitTile from './HabitTile';
import { cn } from '@/lib/utils';

interface HabitRowProps {
  name: string;
  completedWeeks: Record<string, boolean[]>;
  todayIndex: number;
  weekKey: string;
  onToggleDay: (dayIndex: number, weekKey: string) => void;
  onDelete: () => void;
}

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const HabitRow = ({ name, completedWeeks, weekKey, todayIndex, onToggleDay, onDelete }: HabitRowProps) => {
  const completedDays = completedWeeks?.[weekKey] ?? Array(7).fill(false);
  const completedCount = completedDays.filter(Boolean).length;
  const progressPercent = (completedCount / 7) * 100;

  return (
    <div className="bg-popover rounded-xl p-4 md:p-6 shadow-sm animate-slide-up group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground text-lg">{name}</h3>
          <span className="text-sm text-muted-foreground">
            {completedCount}/7
          </span>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-md"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-habit-empty rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Days Grid */}
      <div className="flex gap-2 justify-between">
        {days.map((day, index) => (
          <HabitTile
            key={index}
            day={day}
            isComplete={completedDays[index]}
            isToday={index === todayIndex}
            onClick={() => onToggleDay(index, weekKey)}
          />
        ))}
      </div>
    </div>
  );
};

export default HabitRow;
