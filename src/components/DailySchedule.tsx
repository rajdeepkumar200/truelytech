import { useState } from 'react';
import { ChevronDown, Plus, Trash2, Pencil, Check, X, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmojiPicker from './EmojiPicker';

interface ScheduleItem {
  id: string;
  time: string;
  task: string;
  emoji?: string;
}

interface DailyScheduleProps {
  items: ScheduleItem[];
  onAddItem: (time: string, task: string, emoji: string) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (id: string, time: string, task: string, emoji: string) => void;
  compact?: boolean;
}

const DailySchedule = ({ items, onAddItem, onDeleteItem, onEditItem, compact = false }: DailyScheduleProps) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [newTime, setNewTime] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newEmoji, setNewEmoji] = useState('📌');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editTask, setEditTask] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  const handleAdd = () => {
    if (newTime && newTask.trim()) {
      onAddItem(newTime, newTask.trim(), newEmoji);
      setNewTime('');
      setNewTask('');
      setNewEmoji('📌');
      setIsAdding(false);
    }
  };

  const startEditing = (item: ScheduleItem) => {
    setEditingId(item.id);
    setEditTime(item.time);
    setEditTask(item.task);
    setEditEmoji(item.emoji || '📌');
  };

  const saveEdit = () => {
    if (editingId && editTime && editTask.trim()) {
      onEditItem(editingId, editTime, editTask.trim(), editEmoji);
      setEditingId(null);
      setEditTime('');
      setEditTask('');
      setEditEmoji('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTime('');
    setEditTask('');
    setEditEmoji('');
  };

  // Compact version for mobile
  if (compact) {
    return (
      <div className="bg-gradient-to-br from-primary/5 via-popover to-accent/5 rounded-2xl border border-border/50 overflow-hidden shadow-sm h-full">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-medium text-foreground text-sm flex-1 text-left">Today's Plan</span>
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{items.length}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", !isExpanded && "-rotate-90")} />
        </button>
        
        {isExpanded && (
          <div className="px-3 pb-3 max-h-28 overflow-y-auto scrollbar-thin">
            {items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1.5 text-xs">
                <span>{item.emoji || '📌'}</span>
                <span className="text-muted-foreground font-mono">{item.time}</span>
                <span className="text-foreground truncate flex-1">{item.task}</span>
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-xs text-muted-foreground">+{items.length - 3} more</p>
            )}
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-1">No tasks yet</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-popover to-accent/5 rounded-2xl overflow-hidden border border-border/50 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold text-foreground flex-1 text-left">Today's Plan</span>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{items.length} tasks</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            !isExpanded && "-rotate-90"
          )}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-5 pb-5">
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="group"
              >
                {editingId === item.id ? (
                  <div className="flex gap-2 items-center py-2 px-3 bg-muted/40 rounded-xl border border-border/50">
                    <EmojiPicker value={editEmoji} onChange={setEditEmoji} />
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="text-sm bg-transparent border-b border-border focus:border-primary outline-none text-muted-foreground w-20"
                    />
                    <input
                      type="text"
                      value={editTask}
                      onChange={(e) => setEditTask(e.target.value)}
                      className="flex-1 text-sm bg-transparent border-b border-border focus:border-primary outline-none text-foreground"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    />
                    <button
                      onClick={saveEdit}
                      className="p-1.5 hover:bg-accent/20 rounded-lg text-accent"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/30 transition-all duration-200 border border-transparent hover:border-border/30">
                    <span className="text-lg">{item.emoji || '📌'}</span>
                    <span className="text-sm text-primary/80 font-mono w-14 font-medium">
                      {item.time}
                    </span>
                    <span className="flex-1 text-sm text-foreground">{item.task}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(item)}
                        className="p-1.5 hover:bg-primary/10 rounded-lg"
                      >
                        <Pencil className="w-3.5 h-3.5 text-primary" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Item */}
            {isAdding ? (
              <div className="flex gap-2 items-center py-2 px-3 bg-muted/40 rounded-xl border border-border/50">
                <EmojiPicker value={newEmoji} onChange={setNewEmoji} />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="text-sm bg-transparent border-b border-border focus:border-primary outline-none text-muted-foreground w-20"
                />
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What's the plan?"
                  className="flex-1 text-sm bg-transparent border-b border-border focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button
                  onClick={handleAdd}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTime('');
                    setNewTask('');
                    setNewEmoji('📌');
                  }}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2.5 px-3 w-full rounded-xl hover:bg-muted/30 border border-dashed border-border/50 hover:border-primary/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add task</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySchedule;