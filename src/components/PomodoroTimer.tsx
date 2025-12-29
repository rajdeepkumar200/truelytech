import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const presetTimes = [5, 10, 15, 20, 25, 30, 45, 60];

const PomodoroTimer = () => {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRunning && !isBreak) {
      setTimeLeft(workMinutes * 60);
    }
  }, [workMinutes]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (isBreak) {
        setTimeLeft(workMinutes * 60);
        setIsBreak(false);
      } else {
        setTimeLeft(breakMinutes * 60);
        setIsBreak(true);
      }
      setIsRunning(false);
      
      if (Notification.permission === 'granted') {
        new Notification(isBreak ? 'Break over! Time to work.' : 'Work session complete! Take a break.');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, isBreak, workMinutes, breakMinutes]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workMinutes * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalTime = isBreak ? breakMinutes * 60 : workMinutes * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="bg-popover rounded-2xl p-5 border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-muted-foreground">
          {isBreak ? '☕ Break' : '🍅 Focus'}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-4" align="end">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Work (min)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presetTimes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setWorkMinutes(t)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md transition-colors",
                        workMinutes === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Break (min)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[3, 5, 10, 15].map((t) => (
                    <button
                      key={t}
                      onClick={() => setBreakMinutes(t)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md transition-colors",
                        breakMinutes === t
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Timer Display */}
      <div className="relative flex items-center justify-center mb-5">
        <svg className="w-28 h-28 transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="50"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-muted/50"
          />
          <circle
            cx="56"
            cy="56"
            r="50"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={314.16}
            strokeDashoffset={314.16 - (314.16 * progress) / 100}
            className={cn(
              "transition-all duration-1000",
              isBreak ? "text-accent" : "text-primary"
            )}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={toggleTimer}
          className={cn(
            "p-3 rounded-full transition-all",
            isRunning 
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20" 
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={resetTimer}
          className="p-3 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
