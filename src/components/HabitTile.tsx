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
        "habit-tile w-12 h-12 md:w-14 md:h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm transition-all duration-300 active:scale-90 ripple",
        isComplete 
          ? "bg-gradient-to-br from-accent to-primary shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/50" 
          : "bg-habit-incomplete hover:bg-gradient-to-br hover:from-muted hover:to-secondary/30 hover:shadow-md",
        isToday && "ring-2 ring-accent ring-offset-2 ring-offset-background animate-pulse",
        !isComplete && "hover:scale-110",
        isComplete && "hover:scale-105 hover:rotate-3"
      )}
    >
      {isComplete ? (
        <Check className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground animate-pulse-check drop-shadow-md" />
      ) : (
        <span className="font-display text-lg md:text-xl text-card-foreground/80 transition-all group-hover:text-accent">
          {day}
        </span>
      )}
    </button>
  );
};

export default HabitTile;
