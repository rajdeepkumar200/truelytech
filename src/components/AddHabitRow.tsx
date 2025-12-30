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
        {/* Icon Selector with Full Emoji Grid */}
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg hover:bg-muted/80 transition-colors"
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
                      className={`w-7 h-7 flex items-center justify-center text-base hover:bg-muted rounded transition-colors ${
                        selectedIcon === emoji ? 'bg-primary/20 ring-1 ring-primary' : ''
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
