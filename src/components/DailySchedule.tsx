import { useState } from 'react';
import { ChevronDown, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
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
}

const DailySchedule = ({ items, onAddItem, onDeleteItem, onEditItem }: DailyScheduleProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
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

  return (
    <div className="bg-popover rounded-2xl overflow-hidden border border-border/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            !isExpanded && "-rotate-90"
          )}
        />
        <span className="font-medium text-foreground">📅 Today's Plan</span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-5 pb-5">
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="group"
              >
                {editingId === item.id ? (
                  <div className="flex gap-2 items-center py-2 px-3 bg-muted/30 rounded-xl">
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
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/30 transition-colors">
                    <span className="text-lg">{item.emoji || '📌'}</span>
                    <span className="text-sm text-muted-foreground font-mono w-14">
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
              <div className="flex gap-2 items-center py-2 px-3 bg-muted/30 rounded-xl">
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
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 w-full rounded-xl hover:bg-muted/30"
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
