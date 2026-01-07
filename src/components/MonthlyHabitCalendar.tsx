import { useRef, useEffect, useState, useMemo } from 'react';
import { Trash2, Flame, CheckSquare, Square, ChevronLeft, ChevronRight, Settings, X, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, getDay, isSameWeek, isBefore, isAfter, startOfDay } from 'date-fns';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ConsistencyGraph from './ConsistencyGraph';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
  category?: string;
  streak?: number;
  weeklyGoal?: number;
  hidden?: boolean;
}

interface MonthlyHabitCalendarProps {
  habits: Habit[];
  onToggleDay: (habitId: string, dayIndex: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onDeleteMultipleHabits?: (habitIds: string[]) => void;
  onToggleActiveDay?: (habitId: string, dayIndex: number) => void;
  onToggleVisibility?: (habitId: string) => void;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Get current day index (0 = Monday, 6 = Sunday)
const getCurrentDayIndex = (): number => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
};

const calculateStreak = (completedDays: boolean[], activeDays: boolean[]): number => {
  let streak = 0;
  for (let i = completedDays.length - 1; i >= 0; i--) {
    if (!activeDays[i]) continue;
    if (completedDays[i]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const MonthlyHabitCalendar = ({ 
  habits, 
  onToggleDay, 
  onDeleteHabit, 
  onDeleteMultipleHabits,
  onToggleActiveDay,
  onToggleVisibility
}: MonthlyHabitCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [settingsHabitId, setSettingsHabitId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentDayIndex = getCurrentDayIndex();

  // Generate all days of the current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Scroll to today on mount
  useEffect(() => {
    // Use a small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      const todayElement = document.getElementById('today-column');
      if (todayElement && scrollRef.current) {
        const elementLeft = todayElement.offsetLeft;
        const containerWidth = scrollRef.current.clientWidth;
        // Center the current day, but ensure it's clearly visible
        // On mobile, we might want it slightly to the left of center if possible, 
        // but centering is generally the safest bet for "in front" visibility
        scrollRef.current.scrollLeft = elementLeft - containerWidth / 2 + todayElement.clientWidth / 2;
      }
    }, 300); // Increased timeout slightly to ensure layout is stable
    return () => clearTimeout(timer);
  }, [monthDays]);

  const toggleSelectHabit = (habitId: string) => {
    setSelectedHabits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(habitId)) {
        newSet.delete(habitId);
      } else {
        newSet.add(habitId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedHabits.size === habits.length) {
      setSelectedHabits(new Set());
    } else {
      setSelectedHabits(new Set(habits.map(h => h.id)));
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteHabit(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const confirmBulkDelete = () => {
    if (selectedHabits.size > 0) {
      if (onDeleteMultipleHabits) {
        onDeleteMultipleHabits(Array.from(selectedHabits));
      } else {
        selectedHabits.forEach(id => onDeleteHabit(id));
      }
      setSelectedHabits(new Set());
      setShowBulkDeleteConfirm(false);
    }
  };

  const cancelSelection = () => {
    setSelectedHabits(new Set());
  };

  // Calculate daily progress for each day of the month
  const dailyProgress = useMemo(() => {
    const today = startOfDay(new Date());
    
    return monthDays.map((day) => {
      const dayStart = startOfDay(day);
      const isFutureDay = isAfter(dayStart, today);
      const isCurrentWeek = isSameWeek(day, new Date(), { weekStartsOn: 1 });
      
      // Only show progress for current week (completedDays is a weekly array)
      // Past weeks show stale data from the weekly array, so hide it
      if (isFutureDay || !isCurrentWeek) {
        return 0;
      }
      
      const dayOfWeek = getDay(day);
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      let totalActive = 0;
      let totalCompleted = 0;
      
      habits.forEach(habit => {
        if (habit.activeDays[dayIndex]) {
          totalActive++;
          if (habit.completedDays[dayIndex]) {
            totalCompleted++;
          }
        }
      });
      
      return totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;
    });
  }, [habits, monthDays]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-foreground">{format(currentMonth, 'MMMM yyyy')}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Habits: <strong className="text-foreground">{habits.length}</strong></span>
          <span>Completed: <strong className="text-accent">{habits.reduce((acc, h) => acc + h.completedDays.filter(Boolean).length, 0)}</strong></span>
        </div>
      </div>

      {/* Multi-select controls */}
      <div className="flex items-center justify-end gap-2 px-2">
        {selectedHabits.size > 0 ? (
          <>
            <span className="text-xs text-muted-foreground">{selectedHabits.size} selected</span>
            <Button variant="ghost" size="sm" onClick={cancelSelection} className="h-7 px-2 text-xs">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteConfirm(true)} className="h-7 px-2 text-xs">
              <Trash2 className="w-3 h-3 mr-1" />
              Delete ({selectedHabits.size})
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSelectAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1" />
            Select
          </Button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="flex">
        {/* Fixed Left Column: Habit names */}
        <div className="flex-shrink-0 w-[130px] sm:w-[200px] border-r border-border/30">
          {/* Header spacer */}
          <div className="h-[52px] border-b border-border/30 flex items-end pb-1 px-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">My Habits</span>
          </div>
          
          {/* Habit rows */}
          {habits.map((habit) => {
            const activeDays = habit.activeDays || Array(7).fill(true);
            const streak = calculateStreak(habit.completedDays, activeDays);
            const isSelected = selectedHabits.has(habit.id);

            return (
              <div 
                key={habit.id} 
                className={cn(
                  "group flex items-center gap-1.5 h-[36px] px-2 border-b border-border/20",
                  isSelected && "bg-destructive/5"
                )}
              >
                {selectedHabits.size > 0 && (
                  <button onClick={() => toggleSelectHabit(habit.id)} className="flex-shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-destructive" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                )}
                <span className="text-sm flex-shrink-0">{habit.icon}</span>
                <span className="text-xs text-foreground truncate flex-1">{habit.name}</span>
                {streak > 0 && (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-orange-500/10 rounded-full flex-shrink-0">
                    <Flame className="w-2.5 h-2.5 text-orange-500" />
                    <span className="text-[9px] font-medium text-orange-500">{streak}</span>
                  </div>
                )}
                {selectedHabits.size === 0 && (
                  <Popover open={settingsHabitId === habit.id} onOpenChange={(open) => setSettingsHabitId(open ? habit.id : null)}>
                    <PopoverTrigger asChild>
                      <button className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted/50 rounded flex-shrink-0">
                        <Settings className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 p-3 bg-popover border-border" align="start">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">Active Days</span>
                          <button onClick={() => setSettingsHabitId(null)} className="p-0.5 hover:bg-muted rounded">
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                        <div className="flex gap-1">
                          {DAYS_OF_WEEK.map((day, idx) => (
                            <button
                              key={day}
                              onClick={() => onToggleActiveDay?.(habit.id, idx)}
                              className={cn(
                                "w-7 h-7 rounded-full text-[10px] font-medium transition-all",
                                activeDays[idx]
                                  ? "bg-accent text-accent-foreground"
                                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {day[0]}
                            </button>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-border space-y-1">
                          <button
                            onClick={() => {
                              onToggleVisibility?.(habit.id);
                              setSettingsHabitId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                          >
                            {habit.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            {habit.hidden ? "Unhide Habit" : "Hide Habit"}
                          </button>
                          <button
                            onClick={() => {
                              setSettingsHabitId(null);
                              setDeleteConfirmId(habit.id);
                            }}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete habit
                          </button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            );
          })}
          
          {/* Progress label */}
          <div className="h-[28px] flex items-center px-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Progress</span>
          </div>
        </div>

        {/* Scrollable Right Column: Days */}
        <div className="flex-1 min-w-0 relative group/scroll">
          <div
            className="overflow-x-auto scrollbar-none max-w-full"
            ref={scrollRef}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="min-w-max">
            {/* Day headers with week grouping */}
            <div className="flex border-b border-border/30 h-[52px]">
              {monthDays.map((day, idx) => {
                const dayOfWeek = getDay(day);
                const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const isCurrentDay = isToday(day);
                const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
                const isWeekStart = dayOfWeek === 1; // Monday

                return (
                  <div
                    key={idx}
                    id={isCurrentDay ? 'today-column' : undefined}
                    className={cn(
                      "flex flex-col items-center justify-end pb-1 w-[32px] flex-shrink-0",
                      isWeekStart && idx > 0 && "border-l border-border/40",
                      isCurrentDay && "bg-accent/10 rounded-t-lg"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] uppercase",
                      isCurrentDay ? "text-accent font-bold" : "text-muted-foreground"
                    )}>
                      {dayNames[dayOfWeek]}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      isCurrentDay ? "text-accent" : "text-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Habit completion grid */}
            {habits.map((habit) => {
              const activeDays = habit.activeDays || Array(7).fill(true);

              return (
                <div key={habit.id} className="flex h-[36px] border-b border-border/20">
                  {monthDays.map((day, idx) => {
                    const dayOfWeek = getDay(day);
                    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    const isCurrentDay = isToday(day);
                    const isActive = activeDays[dayIndex];
                    const today = startOfDay(new Date());
                    const dayStart = startOfDay(day);
                    const isFutureDay = isAfter(dayStart, today);
                    const isPastDay = isBefore(dayStart, today);
                    
                    // Only show completion status for current week AND not future days
                    const isCurrentWeek = isSameWeek(day, new Date(), { weekStartsOn: 1 });
                    const canShowCompletion = isCurrentWeek && !isFutureDay;
                    const isComplete = canShowCompletion ? habit.completedDays[dayIndex] : false;
                    const isWeekStart = dayOfWeek === 1;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "w-[32px] flex-shrink-0 flex items-center justify-center",
                          isWeekStart && idx > 0 && "border-l border-border/40",
                          isCurrentDay && "bg-accent/10"
                        )}
                      >
                        {isActive ? (
                          isCurrentDay ? (
                            <div onClick={(e) => {
                              e.stopPropagation();
                              onToggleDay(habit.id, dayIndex);
                            }}>
                              <Checkbox
                                checked={isComplete}
                                onCheckedChange={() => {}} // Handled by parent div to prevent double events
                                className={cn(
                                  "w-5 h-5 border-2 transition-all pointer-events-none", // Disable pointer events on checkbox to let div handle click
                                  isComplete
                                    ? "bg-habit-checkbox border-habit-checkbox data-[state=checked]:bg-habit-checkbox data-[state=checked]:border-habit-checkbox"
                                    : "border-accent ring-1 ring-accent/30"
                                )}
                              />
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center",
                                isComplete
                                  ? "bg-habit-checkbox border-habit-checkbox"
                                  : "border-border/30 bg-muted/10 opacity-50"
                              )}
                              // onClick removed to prevent editing past/future days
                            >
                              {isComplete && <span className="text-[10px] text-white">✓</span>}
                            </div>
                          )
                        ) : (
                          <div className="w-5 h-5 rounded bg-muted/10" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Daily Progress Row */}
            <div className="flex h-[28px]">
              {dailyProgress.map((progress, idx) => {
                const day = monthDays[idx];
                const dayOfWeek = getDay(day);
                const isCurrentDay = isToday(day);
                const isWeekStart = dayOfWeek === 1;
                const isCurrentWeek = isSameWeek(day, new Date(), { weekStartsOn: 1 });

                return (
                  <div
                    key={idx}
                    className={cn(
                      "w-[32px] flex-shrink-0 flex items-center justify-center",
                      isWeekStart && idx > 0 && "border-l border-border/40",
                      isCurrentDay && "bg-accent/10 rounded-b-lg"
                    )}
                  >
                    {isCurrentWeek && (
                      <span className={cn(
                        "text-[10px] font-medium",
                        progress >= 80 ? "text-accent" :
                        progress >= 50 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {progress}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Consistency Graph */}
            <ConsistencyGraph data={dailyProgress} days={monthDays} />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialogs */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this habit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this habit? All progress will be lost.
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

      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedHabits.size} habits?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedHabits.size} habits? All progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MonthlyHabitCalendar;
