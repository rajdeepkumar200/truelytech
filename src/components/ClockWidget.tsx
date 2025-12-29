import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ClockWidgetProps {
  compact?: boolean;
}

const ClockWidget = ({ compact = false }: ClockWidgetProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = format(time, 'HH');
  const minutes = format(time, 'mm');
  const dayName = format(time, 'EEEE').toUpperCase();

  if (compact) {
    return (
      <div className="flex items-center gap-1 animate-slide-up">
        <div className="relative w-12 h-14 bg-card rounded-lg overflow-hidden">
          <div className="flip-card-divider" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-2xl text-card-foreground leading-none">
              {hours}
            </span>
          </div>
        </div>
        <div className="relative w-12 h-14 bg-card rounded-lg overflow-hidden">
          <div className="flip-card-divider" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-2xl text-card-foreground leading-none">
              {minutes}
            </span>
          </div>
          <div className="absolute bottom-0.5 right-1">
            <span className="font-display text-[8px] text-card-foreground/70 tracking-wider">
              {dayName.slice(0, 3)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1 animate-slide-up">
      {/* Hours Card */}
      <div className="relative w-28 h-36 md:w-32 md:h-40 bg-card rounded-xl overflow-hidden">
        <div className="flip-card-divider" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-6xl md:text-7xl text-card-foreground leading-none">
            {hours}
          </span>
        </div>
      </div>

      {/* Minutes Card */}
      <div className="relative w-28 h-36 md:w-32 md:h-40 bg-card rounded-xl overflow-hidden">
        <div className="flip-card-divider" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-6xl md:text-7xl text-card-foreground leading-none">
            {minutes}
          </span>
        </div>
        {/* Day Label - Bottom Right */}
        <div className="absolute bottom-2 right-3 md:bottom-3 md:right-4">
          <span className="font-display text-sm md:text-base text-card-foreground tracking-wider">
            {dayName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClockWidget;
