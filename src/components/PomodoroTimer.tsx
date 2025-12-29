import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const WORK_TIME = 25 * 60; // 25 minutes in seconds
const BREAK_TIME = 5 * 60; // 5 minutes in seconds

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Switch between work and break
      if (isBreak) {
        setTimeLeft(WORK_TIME);
        setIsBreak(false);
      } else {
        setTimeLeft(BREAK_TIME);
        setIsBreak(true);
      }
      setIsRunning(false);
      
      // Send notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(isBreak ? 'Break over! Time to work.' : 'Work session complete! Take a break.');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, isBreak]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(WORK_TIME);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = isBreak 
    ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100 
    : ((WORK_TIME - timeLeft) / WORK_TIME) * 100;

  return (
    <div className="bg-popover rounded-lg p-4">
      <div className="text-sm font-medium text-muted-foreground mb-3">
        {isBreak ? '☕ Break Time' : '🍅 Pomodoro'}
      </div>
      
      {/* Timer Display */}
      <div className="relative flex items-center justify-center mb-4">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={276.46}
            strokeDashoffset={276.46 - (276.46 * progress) / 100}
            className={cn(
              "transition-all duration-1000",
              isBreak ? "text-habit-progress" : "text-primary"
            )}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xl font-bold text-foreground">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={toggleTimer}
          className={cn(
            "p-2 rounded-full transition-colors",
            isRunning 
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20" 
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={resetTimer}
          className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
