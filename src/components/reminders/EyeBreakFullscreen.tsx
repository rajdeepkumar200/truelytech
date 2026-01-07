import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, X } from 'lucide-react';
import FullScreenShell from './FullScreenShell';
import { cn } from '@/lib/utils';
import { beep } from './audio';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  soundEnabled: boolean;
};

type Step = {
  key: string;
  title: string;
  subtitle: string;
  seconds: number;
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function EyeBreakFullscreen({ open, onOpenChange, soundEnabled }: Props) {
  const steps: Step[] = useMemo(
    () => [
      { key: 'up', title: 'Look Up', subtitle: 'Relax your shoulders. Breathe slowly.', seconds: 20 },
      { key: 'down', title: 'Look Down', subtitle: 'Gentle focus. No strain.', seconds: 20 },
      { key: 'left', title: 'Look Left', subtitle: 'Keep head still.', seconds: 20 },
      { key: 'right', title: 'Look Right', subtitle: 'Soft gaze.', seconds: 20 },
      { key: 'cw', title: 'Circle Eyes', subtitle: 'Slow clockwise circles.', seconds: 20 },
      { key: 'ccw', title: 'Reverse Circle', subtitle: 'Slow counter‑clockwise.', seconds: 20 },
      { key: 'blink', title: 'Blink Reset', subtitle: 'Blink gently for hydration.', seconds: 15 },
    ],
    []
  );

  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [remaining, setRemaining] = useState(steps[0]?.seconds ?? 20);

  const [orbitAngle, setOrbitAngle] = useState(0);
  const [blinkClosed, setBlinkClosed] = useState(false);

  const timerRef = useRef<number | null>(null);

  const currentStep = steps[stepIndex];

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const reset = () => {
    stopTimer();
    setPhase('intro');
    setStepIndex(0);
    setRemaining(steps[0]?.seconds ?? 20);
  };

  const start = () => {
    stopTimer();
    setPhase('running');
    setRemaining(steps[stepIndex]?.seconds ?? 20);

    timerRef.current = window.setInterval(async () => {
      setRemaining((prev) => {
        const next = prev - 1;
        return next;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    return () => {
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (phase !== 'running') return;

    // Circular orbit for CW/CCW steps.
    if (currentStep?.key === 'cw' || currentStep?.key === 'ccw') {
      const dir = currentStep.key === 'cw' ? 1 : -1;
      const id = window.setInterval(() => {
        setOrbitAngle((a) => (a + dir * 10) % 360);
      }, 120);
      return () => window.clearInterval(id);
    }
  }, [open, phase, currentStep?.key]);

  useEffect(() => {
    if (!open) return;
    if (phase !== 'running') return;

    // Blink animation in blink step.
    if (currentStep?.key === 'blink') {
      const id = window.setInterval(() => {
        setBlinkClosed((v) => !v);
      }, 350);
      return () => window.clearInterval(id);
    }

    setBlinkClosed(false);
  }, [open, phase, currentStep?.key]);

  useEffect(() => {
    if (!open) return;
    if (phase !== 'running') return;

    if (remaining <= 0) {
      (async () => {
        stopTimer();
        if (soundEnabled) {
          await beep({ frequencyHz: 880, durationMs: 140, gain: 0.05 });
        }

        const nextIndex = stepIndex + 1;
        if (nextIndex >= steps.length) {
          setPhase('done');
          return;
        }

        setStepIndex(nextIndex);
        setRemaining(steps[nextIndex].seconds);
        timerRef.current = window.setInterval(() => {
          setRemaining((prev) => prev - 1);
        }, 1000);
      })();
    } else {
      if (soundEnabled && remaining <= 3) {
        void beep({ frequencyHz: 520, durationMs: 70, gain: 0.03, type: 'square' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase, open]);

  const progress = currentStep ? 1 - remaining / currentStep.seconds : 0;

  const pupilOffset = (() => {
    const max = 20;
    if (!currentStep) return { x: 0, y: 0 };
    switch (currentStep.key) {
      case 'up':
        return { x: 0, y: -max };
      case 'down':
        return { x: 0, y: max };
      case 'left':
        return { x: -max, y: 0 };
      case 'right':
        return { x: max, y: 0 };
      case 'cw':
      case 'ccw': {
        const r = 18;
        const rad = (orbitAngle * Math.PI) / 180;
        return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
      }
      case 'blink':
        return { x: 0, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  })();

  const EyeGraphic = () => {
    const baseY = 7;
    const x = pupilOffset.x;
    const y = pupilOffset.y;
    const rotateDeg = (() => {
      if (!currentStep) return 0;
      switch (currentStep.key) {
        case 'up':
          return -10;
        case 'down':
          return 10;
        case 'left':
          return -15;
        case 'right':
          return 15;
        case 'cw':
        case 'ccw':
          return orbitAngle;
        case 'blink':
          return 0;
        default:
          return 0;
      }
    })();

    const OneEye = ({ side }: { side: 'left' | 'right' }) => {
      const browTilt = side === 'left' ? -6 : 6;
      const lashTilt = side === 'left' ? -12 : 12;

      return (
        <div className="relative w-36 max-w-full">
          {/* eyebrow */}
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-6 border-t-4 border-foreground/70 rounded-[999px]"
            style={{ transform: `translateX(-50%) rotate(${browTilt}deg)` }}
          />

          {/* eye */}
          <div className="relative mx-auto w-32 h-20">
            {/* sclera */}
            <div className="absolute inset-0 rounded-full bg-background border border-border" />

            {/* iris + pupil group (moves + rotates) */}
            <div
              className="absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${baseY + y}px)) rotate(${rotateDeg}deg)` }}
            >
              <div className="absolute inset-0 rounded-full bg-foreground/20 border border-border" />
              <div className="absolute left-1/2 top-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
              <div className="absolute left-[55%] top-[35%] w-2 h-2 rounded-full bg-background/70" />
            </div>

            {/* upper lid (keeps a similar half-closed look) */}
            <div className="absolute inset-x-0 top-0 h-[36%] rounded-t-full bg-foreground" />

            {/* lashes */}
            <div className="absolute left-1/2 top-1 -translate-x-1/2 flex gap-2">
              <div className="w-1 h-3 bg-background rounded-full" style={{ transform: `rotate(${lashTilt}deg)` }} />
              <div className="w-1 h-3 bg-background rounded-full" />
              <div className="w-1 h-3 bg-background rounded-full" style={{ transform: `rotate(${-lashTilt}deg)` }} />
            </div>

            {/* blink overlay (closes the eye) */}
            <div
              className={cn(
                'absolute inset-0 rounded-full bg-foreground origin-top transition-transform duration-150 ease-out',
                blinkClosed ? 'scale-y-100' : 'scale-y-0'
              )}
            />
          </div>
        </div>
      );
    };

    return (
      <div className="rounded-2xl border border-border bg-muted/20 p-5 max-h-[28vh]">
        <div className="flex items-center justify-center gap-6">
          <OneEye side="left" />
          <OneEye side="right" />
        </div>
      </div>
    );
  };

  return (
    <FullScreenShell open={open} onOpenChange={(o) => (o ? onOpenChange(true) : onOpenChange(false))}>
      <div className="h-full w-full bg-background text-foreground">
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Eye Break</div>
                <div className="text-xs text-muted-foreground">Quick guided reset</div>
              </div>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 px-5 py-6 flex flex-col items-center justify-center gap-6">
            {phase === 'intro' && (
              <div className="w-full max-w-md space-y-4 text-center">
                <div className="text-lg font-semibold">Ready?</div>
                <div className="text-sm text-muted-foreground">
                  You’ll do a few gentle eye movements with short timers.
                </div>

                <button
                  onClick={() => start()}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium"
                >
                  Start
                </button>

                <div className="text-xs text-muted-foreground">
                  Tip: keep your head still and movements slow.
                </div>
              </div>
            )}

            {phase === 'running' && currentStep && (
              <div className="w-full max-w-md space-y-5">
                <EyeGraphic />

                <div className="text-center space-y-1">
                  <div className="text-base font-semibold">{currentStep.title}</div>
                  <div className="text-sm text-muted-foreground">{currentStep.subtitle}</div>
                </div>

                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">Step {stepIndex + 1} / {steps.length}</div>
                  <div className="font-semibold tabular-nums">{formatTime(Math.max(0, remaining))}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      stopTimer();
                      setPhase('intro');
                    }}
                    className={cn(
                      'h-11 rounded-xl border border-border bg-background',
                      'text-foreground hover:bg-muted/50'
                    )}
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => {
                      reset();
                      onOpenChange(false);
                    }}
                    className="h-11 rounded-xl bg-muted text-foreground hover:bg-muted/80"
                  >
                    End
                  </button>
                </div>
              </div>
            )}

            {phase === 'done' && (
              <div className="w-full max-w-md space-y-4 text-center">
                <div className="text-lg font-semibold">Nice work</div>
                <div className="text-sm text-muted-foreground">Your eyes should feel a bit calmer now.</div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      reset();
                      onOpenChange(false);
                    }}
                    className="h-12 rounded-xl bg-primary text-primary-foreground font-medium"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      reset();
                      start();
                    }}
                    className="h-12 rounded-xl bg-muted text-foreground hover:bg-muted/80 font-medium"
                  >
                    Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </FullScreenShell>
  );
}
