import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const commonEmojis = [
  '📝', '💪', '🧘', '💧', '🎵', '📖', '🏃', '🧹', '💻', '🎯',
  '⏰', '🌅', '🌙', '🍎', '🥗', '☕', '🎨', '✍️', '📚', '🧠',
  '💤', '🚿', '🦷', '💇', '😊', '🌿', '🧴', '💊', '🍳', '🧘‍♀️',
  '🚶', '🚴', '🏋️', '🎮', '📱', '💬', '📧', '🗂️', '✅', '⭐',
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const EmojiPicker = ({ value, onChange }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center text-xl rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          {value || '✨'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="grid grid-cols-8 gap-1">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
              className="w-7 h-7 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
