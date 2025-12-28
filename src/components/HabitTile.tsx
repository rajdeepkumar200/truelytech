import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitTileProps {
  day: string;
  isComplete: boolean;
  isToday: boolean;
  onClick: () => void;
}

const HabitTile = ({ day, isComplete, isToday, onClick }: HabitTileProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "habit-tile w-12 h-12 md:w-14 md:h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm",
        isComplete 
          ? "bg-habit-complete" 
          : "bg-habit-incomplete",
        isToday && "ring-2 ring-foreground/20 ring-offset-2 ring-offset-background"
      )}
    >
      {isComplete ? (
        <Check className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground animate-pulse-check" />
      ) : (
        <span className="font-display text-lg md:text-xl text-card-foreground/80">
          {day}
        </span>
      )}
    </button>
  );
};

export default HabitTile;
