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
      <div className="relative w-40 h-48 md:w-52 md:h-60 bg-card rounded-2xl overflow-hidden">
        <div className="flip-card-divider" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[6rem] md:text-[8rem] text-card-foreground leading-none">
            {hours}
          </span>
        </div>
      </div>

      {/* Minutes Card */}
      <div className="relative w-40 h-48 md:w-52 md:h-60 bg-card rounded-2xl overflow-hidden">
        <div className="flip-card-divider" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[6rem] md:text-[8rem] text-card-foreground leading-none">
            {minutes}
          </span>
        </div>
        {/* Day Label - Bottom Right */}
        <div className="absolute bottom-4 right-5 md:bottom-6 md:right-6">
          <span className="font-display text-xl md:text-2xl text-card-foreground tracking-wider">
            {dayName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClockWidget;
