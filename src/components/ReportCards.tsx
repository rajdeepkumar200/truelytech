import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, isToday, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar, BarChart3 } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedWeeks: Record<string, boolean[]>;
  activeDays: boolean[];
}

interface ReportCardsProps {
  habits: Habit[];
}

// Circular progress component
const CircularProgress = ({ percentage, size = 56 }: { percentage: number; size?: number }) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
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
        <span className="text-sm font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
};

const ReportCards = ({ habits }: ReportCardsProps) => {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const today = new Date();

  // Generate week days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    const weekKey = weekStart.toISOString().slice(0, 10);
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const dayOfWeek = day.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      let totalActive = 0;
      let totalCompleted = 0;
      const tasksForDay: { icon: string; name: string; completed: boolean }[] = [];
      
      habits.forEach(habit => {
        if (habit.activeDays[dayIndex]) {
          totalActive++;
          const completedArr = habit.completedWeeks?.[weekKey] || Array(7).fill(false);
          const isComplete = completedArr[dayIndex];
          if (isComplete) totalCompleted++;
          tasksForDay.push({ icon: habit.icon, name: habit.name, completed: isComplete });
        }
      });
      
      return {
        date: day,
        dayIndex,
        progress: totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0,
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
      const weekStart = startOfWeek(day, { weekStartsOn: 1 });
      const weekKey = weekStart.toISOString().slice(0, 10);
      const dayOfWeek = getDay(day);
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      let totalActive = 0;
      let totalCompleted = 0;
      
      habits.forEach(habit => {
        if (habit.activeDays[dayIndex]) {
          totalActive++;
          const completedArr = habit.completedWeeks?.[weekKey] || Array(7).fill(false);
          if (completedArr[dayIndex]) totalCompleted++;
        }
      });
      
      return {
        date: day,
        progress: totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0,
        isToday: isToday(day)
      };
    });
  }, [habits, today]);

  const displayDays = viewMode === 'weekly' ? weekDays : monthDays;

  // Calculate averages
  const avgProgress = useMemo(() => {
    const days = viewMode === 'weekly' ? weekDays : monthDays;
    if (days.length === 0) return 0;
    const total = days.reduce((acc, d) => acc + d.progress, 0);
    return Math.round(total / days.length);
  }, [viewMode, weekDays, monthDays]);

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Report
        </h3>
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => setViewMode('weekly')}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
              viewMode === 'weekly'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Week
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
              viewMode === 'monthly'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            Month
          </button>
        </div>
      </div>

      {/* Average Progress */}
      <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-xl border border-accent/20">
        <CircularProgress percentage={avgProgress} size={48} />
        <div>
          <p className="text-sm font-medium text-foreground">
            {avgProgress}% Average
          </p>
          <p className="text-xs text-muted-foreground">
            {viewMode === 'weekly' ? 'This week' : format(today, 'MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* Cards Grid - No scroll, clean grid */}
      {viewMode === 'weekly' ? (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                day.isToday 
                  ? "bg-habit-checkbox/10 border-habit-checkbox/30 ring-1 ring-habit-checkbox/20" 
                  : "bg-popover border-border/30 hover:border-border/50"
              )}
            >
              <span className={cn(
                "text-[10px] uppercase font-medium",
                day.isToday ? "text-habit-checkbox" : "text-muted-foreground"
              )}>
                {format(day.date, 'EEE')}
              </span>
              <span className={cn(
                "text-xs font-semibold",
                day.isToday ? "text-habit-checkbox" : "text-foreground"
              )}>
                {format(day.date, 'd')}
              </span>
              <CircularProgress percentage={day.progress} size={36} />
              <span className="text-[9px] text-muted-foreground">
                {day.completed}/{day.total}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-muted-foreground font-medium pb-1">
              {d}
            </div>
          ))}
          
          {/* Empty cells for alignment */}
          {Array.from({ length: (getDay(startOfMonth(today)) + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          
          {/* Month days */}
          {monthDays.map((day, idx) => (
            <div
              key={idx}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all",
                day.isToday && "ring-1 ring-habit-checkbox",
                day.progress >= 80 && "bg-accent/20",
                day.progress >= 50 && day.progress < 80 && "bg-accent/10",
                day.progress > 0 && day.progress < 50 && "bg-muted/50",
                day.progress === 0 && "bg-muted/20"
              )}
            >
              <span className={cn(
                "font-medium",
                day.isToday ? "text-habit-checkbox" : "text-foreground"
              )}>
                {format(day.date, 'd')}
              </span>
              <span className="text-[8px] text-muted-foreground">{day.progress}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportCards;