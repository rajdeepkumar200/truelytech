import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleItem {
  id: string;
  time: string;
  task: string;
}

interface DailyScheduleProps {
  items: ScheduleItem[];
  onAddItem: (time: string, task: string) => void;
  onDeleteItem: (id: string) => void;
}

const DailySchedule = ({ items, onAddItem, onDeleteItem }: DailyScheduleProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newTime, setNewTime] = useState('');
  const [newTask, setNewTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newTime && newTask.trim()) {
      onAddItem(newTime, newTask.trim());
      setNewTime('');
      setNewTask('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-popover rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            !isExpanded && "-rotate-90"
          )}
        />
        <span className="font-medium text-foreground">Daily Schedule</span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[60px_1fr_24px] gap-2 items-center py-1.5 group"
              >
                <span className="text-sm text-muted-foreground font-mono">
                  {item.time}
                </span>
                <span className="text-sm text-foreground">{item.task}</span>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            ))}

            {/* Add New Item */}
            {isAdding ? (
              <div className="grid grid-cols-[60px_1fr] gap-2 items-center py-1.5">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="text-sm bg-transparent border-b border-border focus:border-primary outline-none text-muted-foreground"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Task description"
                    className="flex-1 text-sm bg-transparent border-b border-border focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                  <button
                    onClick={handleAdd}
                    className="text-xs text-primary hover:underline"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewTime('');
                      setNewTask('');
                    }}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors py-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add schedule</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySchedule;
