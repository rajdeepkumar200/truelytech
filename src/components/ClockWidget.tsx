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
    <div className="flex gap-3 animate-slide-up">
      {/* Hours Card */}
      <div className="relative w-32 h-40 bg-card rounded-lg overflow-hidden shadow-lg">
        <div className="flip-card-divider" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-7xl text-card-foreground tracking-tight">
            {hours}
          </span>
        </div>
      </div>

      {/* Minutes Card */}
      <div className="relative w-32 h-40 bg-card rounded-lg overflow-hidden shadow-lg">
        <div className="flip-card-divider" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-7xl text-card-foreground tracking-tight">
            {minutes}
          </span>
        </div>
        {/* Day Label */}
        <div className="absolute bottom-3 right-4">
          <span className="font-display text-lg text-card-foreground/90 tracking-wider">
            {dayName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClockWidget;
