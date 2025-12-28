import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddHabitFormProps {
  onAdd: (name: string) => void;
}

const AddHabitForm = ({ onAdd }: AddHabitFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors group"
      >
        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        <span className="font-medium">Add New Habit</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="animate-slide-up">
      <div className="bg-popover rounded-xl p-4 md:p-6 shadow-sm">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name (e.g., Meditate, Exercise)"
          className="w-full bg-transparent border-b-2 border-border focus:border-primary outline-none pb-2 text-foreground placeholder:text-muted-foreground transition-colors"
          autoFocus
        />
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={!name.trim()}
            className={cn(
              "flex-1 py-2 rounded-lg font-medium transition-all",
              name.trim()
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Add Habit
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setName('');
            }}
            className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddHabitForm;
