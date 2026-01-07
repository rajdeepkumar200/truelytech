import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface AddHabitRowProps {
  onAdd: (name: string, icon: string) => void;
}

const allEmojis = [
  // Activities & Habits
  '📝', '💪', '💧', '🧘', '🎵', '🪥', '🚿', '😊', '🦷', '💇', '📚', '🍎', '☕', '🌅', '🛏️',
  '🏃', '🚴', '🏋️', '🧹', '💻', '🎯', '⏰', '🌙', '🥗', '🎨', '✍️', '🧠', '💤', '🌿', '🧴',
  '💊', '🍳', '🧘‍♀️', '🚶', '🎮', '📱', '💬', '📧', '🗂️', '✅', '⭐', '🔔', '📖', '🎸', '🎹',
  // Nature & Weather
  '🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '🍀', '🌲', '🌳', '🌴', '🌵', '🌾', '🌱', '🌿', '☀️',
  '🌤️', '⛅', '🌧️', '⛈️', '🌨️', '❄️', '🌈', '⭐', '🌙', '🌊', '🔥', '💧', '🌍',
  // Food & Drink
  '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🥭', '🍑', '🥝', '🍅',
  '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🥕', '🧄', '🧅', '🥔', '🍞', '🥐', '🥖', '🧀', '🥚',
  '🍗', '🍖', '🥩', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥗', '🍝',
  // Objects
  '💼', '📁', '📂', '🗓️', '📅', '📆', '🗒️', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚',
  '✏️', '✒️', '🖊️', '🖋️', '📌', '📍', '🔍', '🔎', '🔒', '🔓', '🔑', '🗝️', '🔨', '🪓', '⛏️',
  // Symbols
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗',
  '💖', '💘', '💝', '✨', '💫', '🌟', '⚡', '🔥', '💥', '❄️', '🌀', '💨', '💦', '☔',
];

const AddHabitRow = ({ onAdd }: AddHabitRowProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📝');
  const [customEmoji, setCustomEmoji] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), selectedIcon);
      setName('');
      setSelectedIcon('📝');
      setCustomEmoji('');
      setIsOpen(false);
    }
  };

  const handleCustomEmojiAdd = () => {
    if (customEmoji.trim()) {
      setSelectedIcon(customEmoji.trim());
      setCustomEmoji('');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 border-t border-border group hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5"
        title="New habit"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-90 shadow-md group-hover:shadow-lg group-hover:shadow-primary/30">
          <Plus className="w-5 h-5 transition-transform duration-300" />
        </div>
        <span className="text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">Add New Habit</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-3 space-y-3 animate-fade-in">
      <div className="flex gap-2">
        {/* Icon Selector with Full Emoji Grid */}
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl hover:from-primary/30 hover:to-accent/30 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm hover:shadow-md ripple"
            >
              {selectedIcon}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-3">
              {/* Custom Emoji Input */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  placeholder="Paste custom emoji..."
                  className="flex-1 text-sm h-8"
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={handleCustomEmojiAdd}
                  disabled={!customEmoji.trim()}
                  className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Use
                </button>
              </div>
              
              {/* Emoji Grid */}
              <div className="max-h-48 overflow-y-auto">
                <div className="grid grid-cols-10 gap-1">
                  {allEmojis.map((emoji, index) => (
                    <button
                      key={`${emoji}-${index}`}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(emoji);
                        setEmojiPickerOpen(false);
                      }}
                      className={`w-7 h-7 flex items-center justify-center text-base rounded transition-all duration-200 hover:scale-125 active:scale-95 ${
                        selectedIcon === emoji ? 'bg-gradient-to-br from-primary/30 to-accent/30 ring-2 ring-accent shadow-md' : 'hover:bg-muted'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

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
          className="px-4 py-1.5 text-sm rounded-md bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ripple font-medium"
        >
          Add Habit
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setName('');
          }}
          className="px-4 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddHabitRow;
