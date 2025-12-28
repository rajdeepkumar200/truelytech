import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = format(time, 'HH');
  const minutes = format(time, 'mm');
  const dayName = format(time, 'EEEE').toUpperCase();

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
