// Helper for legacy code compatibility
export function getCompletedDays(habit, weekKey) {
  return habit.completedWeeks?.[weekKey] ?? Array(7).fill(false);
}
import { useRef, useEffect, useState, useMemo } from 'react';
import { Trash2, Flame, CheckSquare, Square, ChevronLeft, ChevronRight, Settings, X, Eye, EyeOff, CheckCircle2, Pencil, GripVertical, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import EmojiPicker from './EmojiPicker';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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
import { HabitRowWrapper } from './HabitRowWrapper';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedWeeks: Record<string, boolean[]>;
  activeDays: boolean[];
  category?: string;
  streak?: number;
  weeklyGoal?: number;
  hidden?: boolean;
  completedDate?: string;
  isTemporary?: boolean;
  createdDate?: string;
}

interface MonthlyHabitCalendarProps {
  habits: Habit[];
  // Pass the week key to operate on
  weekKey: string;
  onToggleDay: (habitId: string, dayIndex: number, weekKey: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onDeleteMultipleHabits?: (habitIds: string[]) => void;
  onToggleActiveDay?: (habitId: string, dayIndex: number) => void;
  onToggleVisibility?: (habitId: string) => void;
  onMarkComplete?: (habitId: string) => void;
  onRenameHabit?: (habitId: string, newName: string) => void;
  onReorderHabits?: (habits: Habit[]) => void;
  onUpdateIcon?: (habitId: string, icon: string) => void;
  onAddTempTask?: (name: string, icon: string) => void;
  readOnly?: boolean;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Get current day index (0 = Monday, 6 = Sunday)
const getCurrentDayIndex = (): number => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
};

const calculateStreak = (completedArr: boolean[], activeDays: boolean[]): number => {
  let streak = 0;
  for (let i = completedArr.length - 1; i >= 0; i--) {
    if (!activeDays[i]) continue;
    if (completedArr[i]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const MonthlyHabitCalendar = ({
  habits,
  weekKey,
  onToggleDay,
  onDeleteHabit,
  onDeleteMultipleHabits,
  onToggleActiveDay,
  onToggleVisibility,
  onMarkComplete,
  onRenameHabit,
  onReorderHabits,
  onUpdateIcon,
  onAddTempTask,
  readOnly = false,
}: MonthlyHabitCalendarProps) => {
  // Helper: get completedArr for a habit for the selected week
  function getCompletedArr(habit) {
    return habit.completedWeeks?.[weekKey] ?? Array(7).fill(false);
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    const reordered = Array.from(habits);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorderHabits?.(reordered);
  };

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [completeConfirmId, setCompleteConfirmId] = useState<string | null>(null);
  const [renamingHabitId, setRenamingHabitId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [settingsHabitId, setSettingsHabitId] = useState<string | null>(null);
  const [showTempTaskInput, setShowTempTaskInput] = useState(false);
  const [tempTaskName, setTempTaskName] = useState('');
  const [tempTaskIcon, setTempTaskIcon] = useState('⚡');
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentDayIndex = getCurrentDayIndex();

  // Generate all days of the current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Scroll to show today at the left edge on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // Use querySelector within the scrollable container to avoid duplicate ID issues
      // (mobile and desktop both render this component, causing duplicate IDs)
      const todayElement = scrollRef.current?.querySelector('#today-column');
      if (todayElement && scrollRef.current) {
        const scrollContainer = scrollRef.current;

        // Get today's position within the scrollable content
        const todayLeft = (todayElement as HTMLElement).offsetLeft;

        // Each column is 32px wide. To show today at the left edge,
        // we scroll to show 1-2 days before today (if available)
        const columnWidth = 32;
        const daysToShowBefore = 1; // Show 1 day before today for context
        const targetScroll = Math.max(0, todayLeft - (columnWidth * daysToShowBefore));

        scrollContainer.scrollLeft = targetScroll;
      }
    }, 300);
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
        const weekCompleted = getCompletedArr(habit);
        if (habit.activeDays[dayIndex]) {
          totalActive++;
          if (weekCompleted[dayIndex]) {
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
          <span>Completed: <strong className="text-accent">{habits.reduce((acc, h) => acc + (getCompletedDays(h, weekKey).filter(Boolean).length), 0)}</strong></span>
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
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="habit-names">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {habits.map((habit, habitIndex) => {
                    const activeDays = habit.activeDays || Array(7).fill(true);
                    const streak = calculateStreak(getCompletedDays(habit, weekKey), activeDays);
                    const isSelected = selectedHabits.has(habit.id);

                    return (
                      <Draggable key={habit.id} draggableId={habit.id} index={habitIndex}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <HabitRowWrapper habitIndex={habitIndex} habitName={habit.name}>
                              <div
                                className={cn(
                                  "group flex items-center gap-1 h-[36px] px-1 border-b border-border/20",
                                  isSelected && "bg-destructive/5",
                                  snapshot.isDragging && "bg-muted/60 shadow-md rounded-lg z-50"
                                )}
                              >
                                {/* Drag handle */}
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation">
                                  <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                                </div>
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
                                {habit.isTemporary && (
                                  <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-500/10 rounded-full" title="Quick task (today only)">
                                    <Zap className="w-2.5 h-2.5 text-amber-500" />
                                  </span>
                                )}
                                {habit.completedDate === new Date().toISOString().split('T')[0] && (
                                  <span className="ml-1 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20" title="Marked as completed">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                  </span>
                                )}
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

                                        {/* Change Emoji */}
                                        {onUpdateIcon && (
                                          <div className="pt-2 border-t border-border">
                                            <p className="text-xs font-medium text-foreground mb-1">Icon</p>
                                            <EmojiPicker
                                              value={habit.icon}
                                              onChange={(emoji) => {
                                                onUpdateIcon(habit.id, emoji);
                                              }}
                                            />
                                          </div>
                                        )}

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
                                if (habit.completedDate) {
                                  // If already completed, just restore directly
                                  onMarkComplete?.(habit.id);
                                } else {
                                  // Show reconsideration prompt
                                  setCompleteConfirmId(habit.id);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {habit.completedDate ? "Mark as Incomplete" : "Mark as Completed"}
                            </button>
                            <button
                              onClick={() => {
                                setSettingsHabitId(null);
                                setRenamingHabitId(habit.id);
                                setRenameValue(habit.name);
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Rename Habit
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
                            </HabitRowWrapper>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Quick Add Temp Task */}
          {onAddTempTask && !readOnly && (
            <div className="border-b border-border/20 px-2">
              {showTempTaskInput ? (
                <form
                  className="flex items-center gap-1.5 h-[36px]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (tempTaskName.trim()) {
                      onAddTempTask(tempTaskName.trim(), tempTaskIcon);
                      setTempTaskName('');
                      setTempTaskIcon('⚡');
                      setShowTempTaskInput(false);
                    }
                  }}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="w-6 h-6 flex items-center justify-center text-sm rounded bg-muted hover:bg-muted/80 flex-shrink-0">
                        {tempTaskIcon}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 p-2" align="start">
                      <div className="grid grid-cols-8 gap-1">
                        {['⚡', '📋', '📞', '📦', '🛒', '✉️', '🔧', '🏥', '🎉', '👤', '🏠', '💰', '📄', '🚗', '🍽️', '🎁'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setTempTaskIcon(emoji)}
                            className="w-6 h-6 flex items-center justify-center text-sm hover:bg-muted rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={tempTaskName}
                    onChange={(e) => setTempTaskName(e.target.value)}
                    placeholder="Quick task for today..."
                    className="h-6 text-xs flex-1 border-none bg-transparent px-1 focus-visible:ring-0"
                    autoFocus
                  />
                  <Button type="submit" size="sm" variant="ghost" className="h-6 px-2 text-xs text-accent" disabled={!tempTaskName.trim()}>
                    Add
                  </Button>
                  <button type="button" onClick={() => { setShowTempTaskInput(false); setTempTaskName(''); }} className="p-0.5 hover:bg-muted rounded">
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowTempTaskInput(true)}
                  className="flex items-center gap-1.5 h-[32px] w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="text-sm font-bold leading-none">+</span>
                  <span>Quick task for today</span>
                </button>
              )}
            </div>
          )}

          {/* Progress label */}
          <div className="h-[28px] flex items-center px-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Progress</span>
          </div>
        </div>

        {/* Scrollable Right Column: Days */}
        <div className="flex-1 min-w-0 relative group/scroll">
          {/* Mouse drag-to-scroll logic */}
          <div
            className="overflow-x-auto scrollbar-none max-w-full cursor-grab active:cursor-grabbing"
            ref={scrollRef}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseDown={e => {
              const el = scrollRef.current;
              if (!el) return;
              let startX = e.pageX - el.offsetLeft;
              let scrollLeft = el.scrollLeft;
              let isDown = true;
              const onMouseMove = (ev) => {
                if (!isDown) return;
                const x = ev.pageX - el.offsetLeft;
                const walk = x - startX;
                el.scrollLeft = scrollLeft - walk;
              };
              const onMouseUp = () => {
                isDown = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
              };
              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
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
              {habits.map((habit, habitIndex) => {
                const activeDays = habit.activeDays || Array(7).fill(true);

                return (
                  <HabitRowWrapper key={habit.id} habitIndex={habitIndex} habitName={habit.name}>
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

                        // Calculate the week key for this day
                        const year = day.getFullYear();
                        const tmp = new Date(day.getTime());
                        tmp.setHours(0, 0, 0, 0);
                        tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
                        const week1 = new Date(tmp.getFullYear(), 0, 4);
                        const weekNo = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
                        const weekKeyForDay = `${year}-W${String(weekNo).padStart(2, '0')}`;

                        // Only show completion status for current week AND not future days
                        const isCurrentWeek = isSameWeek(day, new Date(), { weekStartsOn: 1 });
                        const canShowCompletion = isCurrentWeek && !isFutureDay;
                        // Use the correct week's array for this day
                        const weekCompleted = habit.completedWeeks?.[weekKeyForDay] ?? Array(7).fill(false);
                        const isComplete = weekCompleted[dayIndex];
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
                              // Only allow editing for current week and today or future days in current week
                              !readOnly && isSameWeek(day, new Date(), { weekStartsOn: 1 }) && !isFutureDay && isSameDay(day, today) ? (
                                <div onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleDay(habit.id, dayIndex, weekKeyForDay);
                                }}>
                                  <Checkbox
                                    checked={isComplete}
                                    onCheckedChange={() => { }} // Handled by parent div to prevent double events
                                    className={cn(
                                      "w-5 h-5 border-2 transition-all pointer-events-none",
                                      isComplete
                                        ? "bg-habit-checkbox border-habit-checkbox data-[state=checked]:bg-habit-checkbox data-[state=checked]:border-habit-checkbox"
                                        : "border-accent ring-1 ring-accent/30"
                                    )}
                                  />
                                </div>
                              ) : (
                                <Checkbox
                                  checked={isComplete}
                                  disabled
                                  className={cn(
                                    "w-5 h-5 border-2 transition-all pointer-events-none",
                                    isComplete
                                      ? "bg-habit-checkbox border-habit-checkbox data-[state=checked]:bg-habit-checkbox data-[state=checked]:border-habit-checkbox"
                                      : "border-border/30 bg-muted/10 opacity-50",
                                    (readOnly || isFutureDay || !isSameWeek(day, new Date(), { weekStartsOn: 1 })) && "opacity-60"
                                  )}
                                />
                              )
                            ) : (
                              <div className="w-5 h-5 rounded bg-muted/10" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </HabitRowWrapper>
                );
              })}

              {/* Spacer for temp task add row (keeps columns aligned) */}
              {onAddTempTask && !readOnly && (
                <div className="h-[32px] border-b border-border/20" />
              )}

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

      {/* Mark Complete Reconsideration Dialog */}
      <AlertDialog open={!!completeConfirmId} onOpenChange={() => setCompleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to complete this habit?</AlertDialogTitle>
            <AlertDialogDescription>
              Marking this habit as completed will hide it from your daily view. You built great consistency — are you sure you no longer need it? You can always restore it later from settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Going</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (completeConfirmId) {
                  onMarkComplete?.(completeConfirmId);
                  setCompleteConfirmId(null);
                }
              }}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Yes, Complete It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Habit Dialog */}
      <AlertDialog open={!!renamingHabitId} onOpenChange={() => setRenamingHabitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for this habit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 py-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="New habit name"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameValue.trim() && renamingHabitId) {
                  onRenameHabit?.(renamingHabitId, renameValue.trim());
                  setRenamingHabitId(null);
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (renamingHabitId && renameValue.trim()) {
                  onRenameHabit?.(renamingHabitId, renameValue.trim());
                  setRenamingHabitId(null);
                }
              }}
              disabled={!renameValue.trim()}
            >
              Rename
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MonthlyHabitCalendar;
