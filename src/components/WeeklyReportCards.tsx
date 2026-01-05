import { useState, useMemo, useRef, useEffect } from 'react';
import { format, startOfWeek, addDays, isToday, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar, BarChart3 } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
}

interface WeeklyReportCardsProps {
  habits: Habit[];
}

// Circular progress component
const CircularProgress = ({ percentage, size = 80 }: { percentage: number; size?: number }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--habit-checkbox))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
};

const WeeklyReportCards = ({ habits }: WeeklyReportCardsProps) => {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  // Generate week days starting from Monday
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const dayOfWeek = day.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      // Calculate progress for this day
      let totalActive = 0;
      let totalCompleted = 0;
      const tasksForDay: { icon: string; name: string; completed: boolean }[] = [];
      
      habits.forEach(habit => {
        if (habit.activeDays[dayIndex]) {
          totalActive++;
          const isComplete = habit.completedDays[dayIndex];
          if (isComplete) {
            totalCompleted++;
          }
          tasksForDay.push({
            icon: habit.icon,
            name: habit.name,
            completed: isComplete
          });
        }
      });
      
      const progress = totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;
      
      return {
        date: day,
        dayIndex,
        progress,
        completed: totalCompleted,
        total: totalActive,
        tasks: tasksForDay,
        isToday: isToday(day),
        isPast: isBefore(day, today) && !isToday(day)
      };
    });
  }, [habits, today]);

  // Generate month days
  const monthDays = useMemo(() => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dayOfWeek = getDay(day);
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      let totalActive = 0;
      let totalCompleted = 0;
      const tasksForDay: { icon: string; name: string; completed: boolean }[] = [];
      
      habits.forEach(habit => {
        if (habit.activeDays[dayIndex]) {
          totalActive++;
          const isComplete = habit.completedDays[dayIndex];
          if (isComplete) totalCompleted++;
          tasksForDay.push({ icon: habit.icon, name: habit.name, completed: isComplete });
        }
      });
      
      return {
        date: day,
        progress: totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0,
        completed: totalCompleted,
        total: totalActive,
        tasks: tasksForDay,
        isToday: isToday(day)
      };
    });
  }, [habits, today]);

  // Keep the current day card visible
  useEffect(() => {
    if (!scrollRef.current) return;
    const todayCard = scrollRef.current.querySelector('[data-today="true"]');
    if (todayCard) {
      todayCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [viewMode]);

  return (
    <div className="space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">
          {viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Report
        </h3>
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => setViewMode('weekly')}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
              viewMode === 'weekly'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-3 h-3" />
            Week
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
              viewMode === 'monthly'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-3 h-3" />
            Month
          </button>
        </div>
      </div>
      
      {/* Cards - single row with horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {(viewMode === 'weekly' ? weekDays : monthDays).map((day, idx) => (
          <div
            key={idx}
            data-today={day.isToday}
            className={cn(
              "flex-shrink-0 w-[160px] rounded-xl border p-3 transition-all",
              day.isToday 
                ? "bg-habit-checkbox/10 border-habit-checkbox/30" 
                : "bg-popover border-border/50"
            )}
          >
            {/* Day header */}
            <div className="text-center mb-3">
              <p className={cn(
                "text-sm font-semibold",
                day.isToday ? "text-habit-checkbox" : "text-foreground"
              )}>
                {format(day.date, 'EEEE')}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(day.date, 'dd.MM.yyyy')}
              </p>
            </div>
            
            {/* Circular progress */}
            <div className="flex justify-center mb-3">
              <CircularProgress percentage={day.progress} size={70} />
            </div>
            
            {/* Tasks list */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-medium text-muted-foreground mb-1">Tasks</p>
              <div className="max-h-[100px] overflow-y-auto space-y-1 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {day.tasks.slice(0, 5).map((task, taskIdx) => (
                  <div 
                    key={taskIdx}
                    className={cn(
                      "flex items-center gap-1.5 text-xs py-0.5",
                      task.completed ? "text-muted-foreground line-through" : "text-foreground"
                    )}
                  >
                    <span className="text-xs">{task.icon}</span>
                    <span className="truncate">{task.name}</span>
                    {task.completed && (
                      <span className="ml-auto text-habit-checkbox">✓</span>
                    )}
                  </div>
                ))}
                {day.tasks.length > 5 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{day.tasks.length - 5} more
                  </p>
                )}
                {day.tasks.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No habits scheduled</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyReportCards;
