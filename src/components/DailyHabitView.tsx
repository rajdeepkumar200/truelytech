import { useState, useEffect } from 'react';
import { format, addDays, subDays, isSameDay, isToday, startOfWeek, endOfWeek, isSameWeek, getDay, isAfter, startOfDay } from 'date-fns';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedWeeks: Record<string, boolean[]>;
  activeDays: boolean[];
  hidden?: boolean;
}

interface DailyHabitViewProps {
  habits: Habit[];
  onToggleDay: (habitId: string, dayIndex: number, weekKey: string) => void;
}

const DailyHabitView = ({ habits, onToggleDay }: DailyHabitViewProps) => {
    const getCurrentWeekKey = (date = new Date()) => {
      const year = date.getFullYear();
      const tmp = new Date(date.getTime());
      tmp.setHours(0, 0, 0, 0);
      tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
      const week1 = new Date(tmp.getFullYear(), 0, 4);
      const weekNo = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
      return `${year}-W${String(weekNo).padStart(2, '0')}`;
    };
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Reset to today if the component remounts or on initial load
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const handlePrevDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const { handlers } = useSwipeGesture({
    onSwipeLeft: handleNextDay,
    onSwipeRight: handlePrevDay,
  });

  // Determine if we can show/edit data for this date
  // The current data model only supports the current week (Mon-Sun)
  const isCurrentWeek = isSameWeek(selectedDate, new Date(), { weekStartsOn: 1 });
  
  // Get day index (0 = Monday, 6 = Sunday)
  const getDayIndex = (date: Date) => {
    const day = getDay(date);
    return day === 0 ? 6 : day - 1;
  };

  const dayIndex = getDayIndex(selectedDate);

  return (
    <div className="flex flex-col space-y-4" {...handlers}>
      {/* Date Navigation Header */}
      <div className="flex items-center justify-center bg-card rounded-xl p-4 shadow-sm border border-border/50">
        <div className="flex flex-col items-center">
          <span className="text-sm text-muted-foreground uppercase font-medium">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
          </span>
          <span className="text-2xl font-bold font-display">
            {format(selectedDate, 'MMMM d')}
          </span>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {!isCurrentWeek && (
          <div className="text-center p-4 text-muted-foreground bg-muted/30 rounded-xl border border-border/30">
            <p>History is only available for the current week.</p>
          </div>
        )}

        {habits.map(habit => {
          if (habit.hidden) return null;
          const isActiveDay = habit.activeDays[dayIndex];
          const isFutureDay = isAfter(startOfDay(selectedDate), startOfDay(new Date()));
          const weekKey = getCurrentWeekKey(selectedDate);
          const isCompleted = isCurrentWeek && !isFutureDay && habit.completedWeeks?.[weekKey]?.[dayIndex];
          return (
            <div 
              key={habit.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                !isActiveDay
                  ? "bg-muted/30 border-border/20 opacity-50"
                  : isCompleted 
                    ? "bg-primary/10 border-primary/20" 
                    : "bg-card border-border/50 hover:border-border",
                isFutureDay && "opacity-50 cursor-not-allowed",
                !isActiveDay && "cursor-not-allowed"
              )}
              onClick={() => {
                if (isCurrentWeek && !isFutureDay && isActiveDay) {
                  onToggleDay(habit.id, dayIndex, weekKey);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background text-xl shadow-sm border border-border/30">
                  {habit.icon}
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "font-medium text-lg",
                    isCompleted && "text-muted-foreground line-through decoration-primary/50"
                  )}>
                    {habit.name}
                  </span>
                  {!isActiveDay && (
                    <span className="text-xs text-muted-foreground">Not scheduled for this day</span>
                  )}
                </div>
              </div>

              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                !isActiveDay
                  ? "border-muted-foreground/10 bg-muted/20"
                  : isCompleted 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "border-muted-foreground/30"
              )}>
                {isCompleted && isActiveDay && <Check className="w-5 h-5" />}
              </div>
            </div>
          );
        })}

        {habits.filter(h => !h.hidden && (isCurrentWeek ? h.activeDays[dayIndex] : true)).length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <p>No habits scheduled for this day.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyHabitView;
