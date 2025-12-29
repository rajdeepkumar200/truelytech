import { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddHabitRowProps {
  onAdd: (name: string, icon: string) => void;
}

const icons = ['📝', '💪', '💧', '🧘', '🎵', '🪥', '🚿', '😊', '🦷', '💇', '📚', '🍎', '☕', '🌅', '🛏️'];

const AddHabitRow = ({ onAdd }: AddHabitRowProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📝');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), selectedIcon);
      setName('');
      setSelectedIcon('📝');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-2 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border-t border-border"
        title="New habit"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
          <Plus className="w-4 h-4" />
        </div>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-3 space-y-3 animate-fade-in">
      <div className="flex gap-2">
        {/* Icon Selector */}
        <div className="relative">
          <button
            type="button"
            className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg hover:bg-muted/80 transition-colors"
            onClick={() => {
              const currentIndex = icons.indexOf(selectedIcon);
              const nextIndex = (currentIndex + 1) % icons.length;
              setSelectedIcon(icons[nextIndex]);
            }}
          >
            {selectedIcon}
          </button>
        </div>

        {/* Name Input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name"
          className="flex-1 bg-transparent border-b-2 border-border focus:border-primary outline-none text-foreground placeholder:text-muted-foreground transition-colors text-sm"
          autoFocus
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setName('');
          }}
          className="px-4 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddHabitRow;
