import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { playTick, playComplete, playBreakOver, triggerHaptic, resumeAudioContext } from '@/hooks/useSound';
import { sendNotificationNow } from '@/lib/notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative, checkNotificationPermission } from '@/lib/notifications';
import { PomodoroForeground } from '@/plugins/pomodoroForeground';

const presetTimes = [5, 10, 15, 20, 25, 30, 45, 60];

interface PomodoroTimerWithPopupProps {
  onPomodoroStateChange?: (isActive: boolean, isBreak: boolean) => void;
}

const PomodoroTimerWithPopup = ({ onPomodoroStateChange }: PomodoroTimerWithPopupProps) => {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [showExpandPrompt, setShowExpandPrompt] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0);
  const endAtEpochMsRef = useRef<number | null>(null);
  const pomodoroNotifIdsRef = useRef<number[]>([]);

  const ensurePomodoroChannels = async () => {
    if (!isNative()) return;
    try {
      await LocalNotifications.createChannel({
        id: 'habitency_pomodoro_alerts',
        name: 'Pomodoro Alerts',
        importance: 5,
        visibility: 1,
      });
    } catch {
      // ignore
    }
  };

  const stableId = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) | 0;
    return Math.abs(hash) || 1;
  };

  const cancelPomodoroAlerts = async () => {
    if (!isNative()) return;
    const ids = pomodoroNotifIdsRef.current;
    if (!ids.length) return;
    try {
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    } catch {
      // ignore
    }
    pomodoroNotifIdsRef.current = [];
  };

  const schedulePomodoroAlerts = async (endAtEpochMs: number, kind: 'focus' | 'break') => {
    if (!isNative()) return;
    await ensurePomodoroChannels();
    const perm = await checkNotificationPermission();
    if (perm !== 'granted') return;

    await cancelPomodoroAlerts();

    const now = Date.now();
    const warningAt = endAtEpochMs - 10_000;
    const ids: number[] = [];

    const baseKey = `pomodoro:${kind}:${endAtEpochMs}`;

    const notifications: any[] = [];
    if (warningAt > now + 1_000) {
      const id = stableId(`${baseKey}:warning`);
      ids.push(id);
      notifications.push({
        id,
        title: kind === 'break' ? '⏳ Break ending soon' : '⏳ Focus ending soon',
        body: kind === 'break' ? 'Get ready—focus starts in 10 seconds.' : 'Final 10 seconds—finish your last step.',
        schedule: { at: new Date(warningAt) },
        channelId: 'habitency_pomodoro_alerts',
      });
    }

    if (endAtEpochMs > now + 1_000) {
      const id = stableId(`${baseKey}:done`);
      ids.push(id);
      notifications.push({
        id,
        title: kind === 'break' ? '🍅 Break Over!' : '☕ Time for a Break!',
        body: kind === 'break'
          ? 'Great rest! Ready to focus again?'
          : `You completed a ${workMinutes}-minute focus session! Take ${breakMinutes} minutes to recharge.`,
        schedule: { at: new Date(endAtEpochMs) },
        channelId: 'habitency_pomodoro_alerts',
      });
    }

    if (!notifications.length) return;

    try {
      await LocalNotifications.schedule({ notifications });
      pomodoroNotifIdsRef.current = ids;
    } catch {
      // ignore
    }
  };

  const startForegroundCountdown = async (endAtEpochMs: number) => {
    if (!isNative()) return;
    try {
      await PomodoroForeground.start({
        endAtEpochMs,
        title: isBreak ? '☕ Break Timer' : '🍅 Focus Timer',
        body: isBreak ? 'Break running' : 'Focus running',
      });
    } catch {
      // ignore
    }
  };

  const stopForegroundCountdown = async () => {
    if (!isNative()) return;
    try {
      await PomodoroForeground.stop();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isRunning && !isBreak) {
      setTimeLeft(workMinutes * 60);
    }
  }, [workMinutes]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      if (!endAtEpochMsRef.current) {
        endAtEpochMsRef.current = Date.now() + timeLeft * 1000;
      }

      const endAt = endAtEpochMsRef.current;

      void startForegroundCountdown(endAt);
      void schedulePomodoroAlerts(endAt, isBreak ? 'break' : 'focus');

      intervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));

        if (soundEnabled && remaining > 0 && remaining % 60 === 0 && remaining !== lastTickRef.current) {
          lastTickRef.current = remaining;
          playTick();
          triggerHaptic(30);
        }

        setTimeLeft(remaining);
      }, 1000);
    } else if (timeLeft === 0) {
      if (soundEnabled) {
        if (isBreak) {
          playBreakOver();
        } else {
          playComplete();
        }
        triggerHaptic([100, 50, 100, 50, 100]);
      }
      
      endAtEpochMsRef.current = null;
      void stopForegroundCountdown();
      void cancelPomodoroAlerts();

      if (isBreak) {
        setTimeLeft(workMinutes * 60);
        setIsBreak(false);
      } else {
        setTimeLeft(breakMinutes * 60);
        setIsBreak(true);
      }
      setIsRunning(false);
      setShowPopup(false);
      
      try {
        const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;
        const title = isBreak ? '🍅 Break Over!' : '☕ Time for a Break!';
        const body = isBreak
          ? 'Great rest! Ready to focus again? Quick note: start the next session while momentum is high.'
          : `You completed a ${workMinutes}-minute focus session! Take ${breakMinutes} minutes to recharge. Quick note: rest is part of the plan.`;

        if (notificationsSupported && window.Notification.permission === 'granted') {
          new window.Notification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
          });
        } else {
          void sendNotificationNow(title, body);
        }
      } catch {
        // Ignore notification errors (e.g., unsupported platforms).
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, isBreak, workMinutes, breakMinutes, soundEnabled]);

  const toggleTimer = () => {
    resumeAudioContext();
    
    // Show expand prompt when starting
    if (!isRunning) {
      if (soundEnabled) {
        playTick();
        triggerHaptic(50);
      }
      setShowExpandPrompt(true);
    }
    
    if (isRunning) {
      // Pausing
      endAtEpochMsRef.current = null;
      void stopForegroundCountdown();
      void cancelPomodoroAlerts();
      setIsRunning(false);
      return;
    }

    // Starting/resuming: set end timestamp based on current remaining time.
    endAtEpochMsRef.current = Date.now() + timeLeft * 1000;
    setIsRunning(true);
  };

  // Notify parent when Pomodoro state changes (running + work mode = active focus)
  useEffect(() => {
    if (onPomodoroStateChange) {
      onPomodoroStateChange(isRunning && !isBreak, isBreak);
    }
  }, [isRunning, isBreak, onPomodoroStateChange]);

  const handleExpandChoice = (expand: boolean) => {
    setShowExpandPrompt(false);
    if (expand) {
      setShowPopup(true);
    }
  };

  // Ensure native channels exist early.
  useEffect(() => {
    void ensurePomodoroChannels();
  }, []);

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workMinutes * 60);
    setShowPopup(false);
    if (soundEnabled) {
      triggerHaptic(30);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalTime = isBreak ? breakMinutes * 60 : workMinutes * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Timer display component (reusable)
  const TimerDisplay = ({ large = false }: { large?: boolean }) => (
    <div className={cn("relative flex items-center justify-center", large ? "mb-8" : "mb-5")}>
      <svg className={cn("transform -rotate-90", large ? "w-52 h-52" : "w-28 h-28")}>
        <circle
          cx={large ? "104" : "56"}
          cy={large ? "104" : "56"}
          r={large ? "96" : "50"}
          stroke="currentColor"
          strokeWidth={large ? "8" : "6"}
          fill="none"
          className="text-muted/50"
        />
        <circle
          cx={large ? "104" : "56"}
          cy={large ? "104" : "56"}
          r={large ? "96" : "50"}
          stroke="currentColor"
          strokeWidth={large ? "8" : "6"}
          fill="none"
          strokeDasharray={large ? 603.19 : 314.16}
          strokeDashoffset={(large ? 603.19 : 314.16) - ((large ? 603.19 : 314.16) * progress) / 100}
          className={cn(
            "transition-all duration-1000",
            isBreak ? "text-accent" : "text-primary"
          )}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          "font-mono font-bold text-foreground tabular-nums",
          large ? "text-5xl" : "text-2xl"
        )}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );

  // Controls component (reusable)
  const TimerControls = ({ large = false }: { large?: boolean }) => (
    <div className={cn("flex items-center justify-center", large ? "gap-4" : "gap-3")}>
      <button
        onClick={toggleTimer}
        className={cn(
          "rounded-full transition-all",
          large ? "p-5" : "p-3",
          isRunning 
            ? "bg-destructive/10 text-destructive hover:bg-destructive/20" 
            : "bg-primary text-primary-foreground hover:opacity-90"
        )}
      >
        {isRunning ? (
          <Pause className={cn(large ? "w-8 h-8" : "w-5 h-5")} />
        ) : (
          <Play className={cn(large ? "w-8 h-8" : "w-5 h-5")} />
        )}
      </button>
      <button
        onClick={resetTimer}
        className={cn(
          "rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors",
          large ? "p-5" : "p-3"
        )}
      >
        <RotateCcw className={cn(large ? "w-6 h-6" : "w-4 h-4")} />
      </button>
    </div>
  );

  return (
    <>
      <div className="bg-popover rounded-2xl p-5 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-muted-foreground">
            {isBreak ? '☕ Break' : '🍅 Focus'}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                soundEnabled ? "hover:bg-muted text-foreground" : "hover:bg-muted text-muted-foreground"
              )}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {isRunning && (
              <button
                onClick={() => setShowPopup(true)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Expand timer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
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
        </div>
        
        <TimerDisplay />
        <TimerControls />
      </div>

      {/* Expand Prompt Dialog */}
      <Dialog open={showExpandPrompt} onOpenChange={setShowExpandPrompt}>
        <DialogContent className="sm:max-w-[320px] p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Maximize2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Focus Mode</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Would you like to expand the timer for better focus?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleExpandChoice(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                No, keep small
              </button>
              <button
                onClick={() => handleExpandChoice(true)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Yes, expand
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Timer Popup */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="sm:max-w-[400px] p-8 bg-background/95 backdrop-blur-lg">
          <div className="text-center">
            <div className={cn(
              "text-2xl font-semibold mb-6",
              isBreak ? "text-accent" : "text-primary"
            )}>
              {isBreak ? '☕ Break Time' : '🍅 Focus Session'}
            </div>
            
            <TimerDisplay large />
            <TimerControls large />
            
            <p className="mt-6 text-sm text-muted-foreground">
              {isBreak 
                ? `${breakMinutes} minute break` 
                : `${workMinutes} minute focus session`
              }
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PomodoroTimerWithPopup;