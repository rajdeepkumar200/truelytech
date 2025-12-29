import { Trash2, Settings2, Flame, GripVertical } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
  category?: string;
  streak?: number;
}

interface HabitTableProps {
  habits: Habit[];
  onToggleDay: (habitId: string, dayIndex: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onUpdateActiveDays: (habitId: string, activeDays: boolean[]) => void;
  onReorder: (habits: Habit[]) => void;
}

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const categories = ['Morning', 'Afternoon', 'Evening', 'Health', 'Work', 'Personal'];

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

const HabitTable = ({ habits, onToggleDay, onDeleteHabit, onUpdateActiveDays, onReorder }: HabitTableProps) => {
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const currentDayIndex = getCurrentDayIndex();

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

  return (
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[20px_1fr_repeat(7,32px)_60px] md:grid-cols-[24px_1fr_repeat(7,40px)_80px] gap-1 px-2 py-2 text-xs text-muted-foreground uppercase tracking-wide border-b border-border/30">
        <div></div>
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

      {/* Habit Rows with Drag and Drop */}
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

                return (
                  <Draggable key={habit.id} draggableId={habit.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "grid grid-cols-[20px_1fr_repeat(7,32px)_60px] md:grid-cols-[24px_1fr_repeat(7,40px)_80px] gap-1 px-2 py-2 items-center group hover:bg-muted/40 rounded-lg transition-colors",
                          snapshot.isDragging && "bg-muted/60 shadow-lg"
                        )}
                      >
                        {/* Drag Handle */}
                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
                        </div>

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
                            onClick={() => onDeleteHabit(habit.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/10 rounded ml-auto flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>

                        {/* Day Checkboxes */}
                        {habit.completedDays.map((isComplete, dayIndex) => {
                          const isCurrentDay = dayIndex === currentDayIndex;
                          const isPastDay = dayIndex < currentDayIndex;
                          const isFutureDay = dayIndex > currentDayIndex;

                          return (
                            <div key={dayIndex} className="flex items-center justify-center">
                              {activeDays[dayIndex] ? (
                                <Checkbox
                                  checked={isComplete}
                                  onCheckedChange={() => onToggleDay(habit.id, dayIndex)}
                                  disabled={isFutureDay}
                                  className={cn(
                                    "w-5 h-5 border-2 transition-all",
                                    isComplete 
                                      ? "bg-habit-checkbox border-habit-checkbox data-[state=checked]:bg-habit-checkbox data-[state=checked]:border-habit-checkbox" 
                                      : "border-border",
                                    !isCurrentDay && !isComplete && "opacity-40",
                                    isFutureDay && "opacity-20 cursor-not-allowed",
                                    isCurrentDay && !isComplete && "border-accent ring-1 ring-accent/30"
                                  )}
                                />
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
    </div>
  );
};

export default HabitTable;
