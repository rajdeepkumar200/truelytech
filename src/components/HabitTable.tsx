import { Trash2, Settings2, Flame, GripVertical, CheckSquare, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { format } from 'date-fns';
import EmojiPicker from './EmojiPicker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { useIsMobile } from '@/hooks/use-mobile';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
  category?: string;
  streak?: number;
  weeklyGoal?: number;
}

interface HabitTableProps {
  habits: Habit[];
  onToggleDay: (habitId: string, dayIndex: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onDeleteMultipleHabits?: (habitIds: string[]) => void;
  onUpdateActiveDays: (habitId: string, activeDays: boolean[]) => void;
  onReorder: (habits: Habit[]) => void;
  onUpdateGoal: (habitId: string, goal: number) => void;
  onUpdateIcon?: (habitId: string, icon: string) => void;
}

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const categories = ['Morning', 'Afternoon', 'Evening', 'Health', 'Work', 'Personal'];

// Get current date info
const getCurrentDateInfo = () => {
  const now = new Date();
  return {
    dayName: format(now, 'EEEE'),
    dateStr: format(now, 'MMM d, yyyy')
  };
};

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

const HabitTable = ({ habits, onToggleDay, onDeleteHabit, onDeleteMultipleHabits, onUpdateActiveDays, onReorder, onUpdateGoal, onUpdateIcon }: HabitTableProps) => {
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const currentDayIndex = getCurrentDayIndex();
  const goalOptions = [0, 3, 4, 5, 6, 7];
  const isMobile = useIsMobile();

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteHabit(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

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

  const confirmBulkDelete = () => {
    if (selectedHabits.size > 0) {
      if (onDeleteMultipleHabits) {
        onDeleteMultipleHabits(Array.from(selectedHabits));
      } else {
        // Fallback: delete one by one
        selectedHabits.forEach(id => onDeleteHabit(id));
      }
      setSelectedHabits(new Set());
      setShowBulkDeleteConfirm(false);
    }
  };

  const cancelSelection = () => {
    setSelectedHabits(new Set());
  };

  // Group habits by category
  const groupedHabits = habits.reduce((acc, habit) => {
    const category = habit.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(habits);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  const handleUpdateCategory = (habitId: string, category: string) => {
    const updatedHabits = habits.map(h => 
      h.id === habitId ? { ...h, category } : h
    );
    onReorder(updatedHabits);
  };

  const { dayName, dateStr } = getCurrentDateInfo();

  return (
    <div className="sm:min-w-0">
      {/* Date Header with Multi-Select Controls */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{dayName}</span>
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        </div>
        
        {/* Multi-select controls */}
        <div className="flex items-center gap-2">
          {selectedHabits.size > 0 ? (
            <>
              <span className="text-xs text-muted-foreground">{selectedHabits.size} selected</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelSelection}
                className="h-7 px-2 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="h-7 px-2 text-xs"
              >
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
      </div>

      {/* Mobile: Fixed habit name + scrollable days */}
      {isMobile ? (
        <div className="flex">
          {/* Fixed Left Column: Habit names + Today */}
          <div className="flex-shrink-0">
            {/* Header */}
            <div className="flex items-center py-2 text-xs text-muted-foreground uppercase tracking-wide border-b border-border/30">
              {selectedHabits.size > 0 && <div className="w-6 pl-1"></div>}
              <div className={cn("pl-2", selectedHabits.size > 0 ? "w-[80px]" : "w-[100px]")}>Habit</div>
              <div className="w-12 text-center font-semibold text-accent">{days[currentDayIndex]}</div>
            </div>
            {/* Rows */}
            {habits.map((habit) => {
              const activeDays = habit.activeDays || Array(7).fill(true);
              const streak = calculateStreak(habit.completedDays, activeDays);
              const isSelected = selectedHabits.has(habit.id);

              return (
                <div key={habit.id} className={cn(
                  "flex items-center py-2 h-[44px] touch-manipulation",
                  isSelected && "bg-destructive/5"
                )}>
                  {/* Selection checkbox - shown when in selection mode */}
                  {selectedHabits.size > 0 && (
                    <div className="w-6 pl-1 flex items-center justify-center">
                      <button
                        onClick={() => toggleSelectHabit(habit.id)}
                        className="p-0.5"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-destructive" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}
                  <div className={cn("flex items-center gap-1 min-w-0 pl-2", selectedHabits.size > 0 ? "w-[80px]" : "w-[100px]")}>
                    <span className="text-sm">{habit.icon}</span>
                    <span className="text-xs text-foreground truncate flex-1">{habit.name}</span>
                    {streak > 0 && (
                      <div className="flex items-center gap-0.5 px-1 py-0.5 bg-orange-500/10 rounded-full flex-shrink-0">
                        <Flame className="w-2.5 h-2.5 text-orange-500" />
                        <span className="text-[10px] font-medium text-orange-500">{streak}</span>
                      </div>
                    )}
                    {selectedHabits.size === 0 && (
                      <button
                        onClick={() => setDeleteConfirmId(habit.id)}
                        className="p-0.5 hover:bg-destructive/10 rounded flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    )}
                  </div>
                  <div className="w-12 flex items-center justify-center touch-manipulation">
                    {activeDays[currentDayIndex] ? (
                      <Checkbox
                        checked={habit.completedDays[currentDayIndex]}
                        onCheckedChange={() => onToggleDay(habit.id, currentDayIndex)}
                        className={cn(
                          "w-6 h-6 border-2 transition-all touch-manipulation",
                          habit.completedDays[currentDayIndex]
                            ? "bg-habit-checkbox border-habit-checkbox data-[state=checked]:bg-habit-checkbox data-[state=checked]:border-habit-checkbox"
                            : "border-accent ring-1 ring-accent/30"
                        )}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-muted/20" title="Not active" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scrollable Right Column: Other days */}
          <div className="flex-1 overflow-x-auto touch-pan-x overscroll-x-contain border-l border-border/30">
            {/* Header */}
            <div className="flex items-center py-2 text-xs text-muted-foreground uppercase tracking-wide border-b border-border/30 min-w-max">
              <div className="flex gap-4 px-3">
                {days.map((day, index) => {
                  if (index === currentDayIndex) return null;
                  return (
                    <div key={day} className="w-8 text-center font-medium">{day}</div>
                  );
                })}
                <div className="w-10 text-center">%</div>
              </div>
            </div>
            {/* Rows */}
            {habits.map((habit) => {
              const activeDays = habit.activeDays || Array(7).fill(true);
              const activeDaysCount = activeDays.filter(Boolean).length;
              const completedCount = habit.completedDays.filter((completed, i) => completed && activeDays[i]).length;
              const progressPercent = activeDaysCount > 0 ? (completedCount / activeDaysCount) * 100 : 0;

              return (
                <div key={habit.id} className="flex items-center py-2 h-[44px] min-w-max touch-manipulation">
                  <div className="flex gap-4 px-3">
                    {habit.completedDays.map((completed, dayIndex) => {
                      if (dayIndex === currentDayIndex) return null;
                      const isFutureDay = dayIndex > currentDayIndex;
                      const isComplete = completed && !isFutureDay;

                      return (
                        <div key={dayIndex} className="w-8 flex items-center justify-center touch-manipulation">
                          {activeDays[dayIndex] ? (
                            <div
                              className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center",
                                isComplete
                                  ? "bg-habit-checkbox border-habit-checkbox"
                                  : "border-border opacity-40"
                              )}
                              title={isFutureDay ? "Cannot complete future habits" : "Only today can be modified"}
                            >
                              {isComplete && <span className="text-xs text-white">✓</span>}
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded bg-muted/20" title="Not active" />
                          )}
                        </div>
                      );
                    })}
                    <div className="w-10 flex items-center justify-center">
                      <span className={cn(
                        "text-xs font-medium",
                        progressPercent >= 80 ? "text-accent" :
                        progressPercent >= 50 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
        {/* Desktop: Table Header */}
        <div className={cn(
          "grid gap-1 px-2 py-2 text-xs text-muted-foreground uppercase tracking-wide border-b border-border/30",
          selectedHabits.size > 0 
            ? "grid-cols-[20px_20px_1fr_repeat(7,32px)_60px] md:grid-cols-[24px_24px_1fr_repeat(7,40px)_80px]"
            : "grid-cols-[20px_1fr_repeat(7,32px)_60px] md:grid-cols-[24px_1fr_repeat(7,40px)_80px]"
        )}>
          <div></div>
          {selectedHabits.size > 0 && <div></div>}
          <div>Habit</div>
          {days.map((day, index) => (
            <div 
              key={day} 
              className={cn(
                "text-center font-medium",
                index === currentDayIndex && "text-accent font-semibold"
              )}
            >
              {day}
            </div>
          ))}
          <div className="text-center">%</div>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="habits">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-0.5">
                {habits.map((habit, index) => {
                  const activeDays = habit.activeDays || Array(7).fill(true);
                  const activeDaysCount = activeDays.filter(Boolean).length;
                  const completedCount = habit.completedDays.filter((completed, i) => completed && activeDays[i]).length;
                  const progressPercent = activeDaysCount > 0 ? (completedCount / activeDaysCount) * 100 : 0;
                  const streak = calculateStreak(habit.completedDays, activeDays);
                  const isSelected = selectedHabits.has(habit.id);

                  return (
                    <Draggable key={habit.id} draggableId={habit.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "grid gap-1 px-2 py-2 items-center group hover:bg-muted/40 rounded-lg transition-colors",
                            selectedHabits.size > 0 
                              ? "grid-cols-[20px_20px_1fr_repeat(7,32px)_60px] md:grid-cols-[24px_24px_1fr_repeat(7,40px)_80px]"
                              : "grid-cols-[20px_1fr_repeat(7,32px)_60px] md:grid-cols-[24px_1fr_repeat(7,40px)_80px]",
                            snapshot.isDragging && "bg-muted/60 shadow-lg",
                            isSelected && "bg-destructive/5"
                          )}
                        >
                          {/* Drag Handle */}
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
                          </div>

                          {/* Selection checkbox - shown when in selection mode */}
                          {selectedHabits.size > 0 && (
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => toggleSelectHabit(habit.id)}
                                className="p-0.5"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-destructive" />
                                ) : (
                                  <Square className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          )}

                          {/* Habit Name */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm">{habit.icon}</span>
                            <span className="text-xs text-foreground truncate">{habit.name}</span>
                            
                            {streak > 0 && (
                              <div className="flex items-center gap-0.5 px-1 py-0.5 bg-orange-500/10 rounded-full flex-shrink-0">
                                <Flame className="w-2.5 h-2.5 text-orange-500" />
                                <span className="text-[10px] font-medium text-orange-500">{streak}</span>
                              </div>
                            )}
                            
                            {/* Settings Popover */}
                            <Popover open={editingHabitId === habit.id} onOpenChange={(open) => setEditingHabitId(open ? habit.id : null)}>
                              <PopoverTrigger asChild>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-primary/10 rounded flex-shrink-0">
                                  <Settings2 className="w-3 h-3 text-primary" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-3" align="start">
                                <div className="space-y-3">
                                  {/* Emoji Selection */}
                                  {onUpdateIcon && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-foreground">Icon</p>
                                      <EmojiPicker 
                                        value={habit.icon} 
                                        onChange={(emoji) => onUpdateIcon(habit.id, emoji)} 
                                      />
                                    </div>
                                  )}

                                  {/* Category Selection */}
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-foreground">Category</p>
                                    <div className="flex flex-wrap gap-1">
                                      {categories.map((cat) => (
                                        <button
                                          key={cat}
                                          onClick={() => handleUpdateCategory(habit.id, cat)}
                                          className={cn(
                                            "px-2 py-0.5 rounded-full text-xs transition-colors",
                                            habit.category === cat 
                                              ? "bg-accent text-accent-foreground" 
                                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                                          )}
                                        >
                                          {cat}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Weekly Goal */}
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-foreground">Weekly Goal</p>
                                    <div className="flex flex-wrap gap-1">
                                      {goalOptions.map((goal) => (
                                        <button
                                          key={goal}
                                          onClick={() => onUpdateGoal(habit.id, goal)}
                                          className={cn(
                                            "px-2 py-0.5 rounded-full text-xs transition-colors",
                                            habit.weeklyGoal === goal 
                                              ? "bg-accent text-accent-foreground" 
                                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                                          )}
                                        >
                                          {goal === 0 ? 'None' : `${goal} days`}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Active Days */}
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-foreground">Active Days</p>
                                    <div className="space-y-0.5">
                                      {fullDays.map((dayName, idx) => (
                                        <label
                                          key={dayName}
                                          className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-muted/50 rounded px-1"
                                        >
                                          <Checkbox
                                            checked={activeDays[idx]}
                                            onCheckedChange={(checked) => {
                                              const newActiveDays = [...activeDays];
                                              newActiveDays[idx] = !!checked;
                                              onUpdateActiveDays(habit.id, newActiveDays);
                                            }}
                                            className="w-3.5 h-3.5"
                                          />
                                          <span className="text-xs text-foreground">{dayName}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>

                            <button
                              onClick={() => setDeleteConfirmId(habit.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/10 rounded ml-auto flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
completed, dayIndex) => {
                            const isCurrentDay = dayIndex === currentDayIndex;
                            const isFutureDay = dayIndex > currentDayIndex;
                            const isComplete = completed && !isFutureDay;

                            return (
                              <div key={dayIndex} className="flex items-center justify-center">
                                {activeDays[dayIndex] ? (
                                  isCurrentDay ? (
                                    <Checkbox
                                      checked={isComplete}
                                      onCheckedChange={() => onToggleDay(habit.id, dayIndex)}
                                      className={cn(
                                        "w-5 h-5 border-2 transition-all",
                                        isComplete 
                                          ? "bg-habit-checkbox border-habit-checkbox data-[state=checked]:bg-habit-checkbox data-[state=checked]:border-habit-checkbox" 
                                          : "border-accent ring-1 ring-accent/30"
                                      )}
                                    />
                                  ) : (
                                    <div
                                      className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                                        isComplete
                                          ? "bg-habit-checkbox border-habit-checkbox"
                                          : "border-border opacity-40"
                                      )}
                                      title={isFutureDay ? "Cannot complete future habits" : "Only today can be modified"}
                                      )}
                                      title="Only today can be modified"
                                    >
                                      {isComplete && <span className="text-xs text-white">✓</span>}
                                    </div>
                                  )
                                ) : (
                                  <div className="w-5 h-5 rounded bg-muted/20" title="Not active" />
                                )}
                              </div>
                            );
                          })}

                          {/* Progress */}
                          <div className="flex items-center justify-center">
                            <span className={cn(
                              "text-xs font-medium",
                              progressPercent >= 80 ? "text-accent" : 
                              progressPercent >= 50 ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {Math.round(progressPercent)}%
                            </span>
                          </div>
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
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this habit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this habit? All progress will be lost. This action cannot be undone.
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedHabits.size} habits?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedHabits.size} habits? All progress will be lost. This action cannot be undone.
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

export default HabitTable;
