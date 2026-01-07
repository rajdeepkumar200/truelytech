import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Dumbbell, Heart, Music, Quote, X } from 'lucide-react';
import FullScreenShell from './FullScreenShell';
import { beep, startAmbient, type AmbientHandle } from './audio';
import { cn } from '@/lib/utils';

type HabitLike = {
  name?: string;
  title?: string;
  emoji?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  soundEnabled: boolean;
  habits?: HabitLike[];
};

type Mode = 'choose' | 'meditation' | 'pushups' | 'music' | 'quotes';

type MotivationalTrack = {
  title: string;
  url: string;
};

type Quote = {
  text: string;
  tag: 'study' | 'health' | 'weight' | 'general';
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function BodyActiveFullscreen({ open, onOpenChange, soundEnabled, habits }: Props) {
  const quotePools: Record<Quote['tag'], Quote[]> = useMemo(
    () => ({
      study: [
        { tag: 'study', text: 'One focused session today beats ten "someday" plans.' },
        { tag: 'study', text: 'Read one page. Solve one problem. Repeat.' },
        { tag: 'study', text: 'Consistency turns studying into confidence.' },
        { tag: 'study', text: 'Start small, stay steady, finish strong.' },
      ],
      health: [
        { tag: 'health', text: 'Move your body, calm your mind, hydrate, repeat.' },
        { tag: 'health', text: 'Healthy days are built from small choices.' },
        { tag: 'health', text: 'Breathe. Reset. Do the next right thing.' },
        { tag: 'health', text: 'You don\'t need perfect—just progress.' },
      ],
      weight: [
        { tag: 'weight', text: 'Fat loss is a long game—win today\'s habits.' },
        { tag: 'weight', text: 'Train consistency, not motivation.' },
        { tag: 'weight', text: 'Small deficits, big results—keep going.' },
        { tag: 'weight', text: 'Your next meal and next workout matter most.' },
      ],
      general: [
        { tag: 'general', text: 'Do the smallest step that moves you forward.' },
        { tag: 'general', text: 'Your future is built by what you repeat.' },
        { tag: 'general', text: 'Show up today—momentum will follow.' },
        { tag: 'general', text: 'Discipline is a skill. Practice it daily.' },
      ],
    }),
    []
  );

  const detectTheme = (items?: HabitLike[]): Quote['tag'] => {
    if (!items?.length) return 'general';
    const text = items
      .map((h) => `${h.name ?? ''} ${h.title ?? ''} ${h.emoji ?? ''}`.toLowerCase())
      .join(' | ');

    const study = /(study|studies|exam|class|lecture|school|college|university|learn|reading|read|homework|assignment|notes|revision|revise|practice|problem|math|science|coding|code|programming)/i;
    const weight = /(fat|lose weight|weight loss|cut|cutting|calorie|diet|cardio|run|running|walk|walking|steps|gym|workout|hiit|abs|belly|protein|meal prep)/i;
    const health = /(health|healthy|sleep|water|hydrate|hydration|meditation|yoga|stretch|mobility|breath|breathing|mindful|stress)/i;

    if (study.test(text)) return 'study';
    if (weight.test(text)) return 'weight';
    if (health.test(text)) return 'health';
    return 'general';
  };

  const [theme] = useState<Quote['tag']>(() => detectTheme(habits));
  const quotes = useMemo(() => quotePools[theme] ?? quotePools.general, [quotePools, theme]);

  const [mode, setMode] = useState<Mode>('choose');

  // meditation
  const [meditationSeconds, setMeditationSeconds] = useState(10 * 60);
  const [meditationRunning, setMeditationRunning] = useState(false);
  const medTimerRef = useRef<number | null>(null);
  const ambientRef = useRef<AmbientHandle | null>(null);
  const [breathIn, setBreathIn] = useState(true);

  // pushups
  const [pushupsRemaining, setPushupsRemaining] = useState(15);
  const [pushupDown, setPushupDown] = useState(false);

  // music
  const [musicBeat, setMusicBeat] = useState(0);
  const [tracks, setTracks] = useState<MotivationalTrack[]>(() => {
    const saved = localStorage.getItem('motivationalTracks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MotivationalTrack[];
        if (Array.isArray(parsed) && parsed.length) {
          return [...parsed, ...Array.from({ length: Math.max(0, 5 - parsed.length) }, () => ({ title: '', url: '' }))].slice(0, 5);
        }
      } catch {
        // ignore
      }
    }
    return Array.from({ length: 5 }, () => ({ title: '', url: '' }));
  });
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // quotes
  const [quoteIndex, setQuoteIndex] = useState(0);

  const stopMeditation = () => {
    if (medTimerRef.current) {
      window.clearInterval(medTimerRef.current);
      medTimerRef.current = null;
    }
    setMeditationRunning(false);

    if (ambientRef.current) {
      ambientRef.current.stop();
      ambientRef.current = null;
    }
  };

  const startMeditation = () => {
    stopMeditation();
    setMeditationRunning(true);
    medTimerRef.current = window.setInterval(() => {
      setMeditationSeconds((prev) => {
        const next = prev - 1;
        return next;
      });
    }, 1000);
  };

  const resetAll = () => {
    stopMeditation();
    setMode('choose');
    setMeditationSeconds(10 * 60);
    setPushupsRemaining(15);
    setQuoteIndex(0);
    setPushupDown(false);
    setMusicBeat(0);
    setPlayingIndex(null);
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
  };

  const close = () => {
    resetAll();
    onOpenChange(false);
  };

  // Breathing animation toggler (simple, no custom keyframes).
  useEffect(() => {
    if (!open) return;
    if (mode !== 'meditation') return;
    const id = window.setInterval(() => setBreathIn((v) => !v), 4000);
    return () => window.clearInterval(id);
  }, [open, mode]);

  // Stop everything when modal closes.
  useEffect(() => {
    if (!open) {
      stopMeditation();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.currentTime = 0;
      }
      setPlayingIndex(null);
    }
  }, [open]);

  // Pushup animation loop while on pushups screen.
  useEffect(() => {
    if (!open) return;
    if (mode !== 'pushups') return;
    const id = window.setInterval(() => setPushupDown((v) => !v), 700);
    return () => window.clearInterval(id);
  }, [open, mode]);

  // Music animation loop while on music screen.
  useEffect(() => {
    if (!open) return;
    if (mode !== 'music') return;
    const id = window.setInterval(() => setMusicBeat((v) => (v + 1) % 1000), 250);
    return () => window.clearInterval(id);
  }, [open, mode]);

  const Human = ({ variant }: { variant: 'meditate' | 'pushup' | 'music' }) => {
    const breathe = variant === 'meditate' ? (breathIn ? 'scale-[1.03]' : 'scale-[0.98]') : 'scale-100';
    const push = variant === 'pushup' ? (pushupDown ? 'translate-y-2' : 'translate-y-0') : 'translate-y-0';
    const bob = variant === 'music' ? (musicBeat % 2 === 0 ? 'translate-y-0' : 'translate-y-1') : 'translate-y-0';

    // Simple floating music notes using emojis (no assets)
    const noteOffset = (i: number) => {
      const t = (musicBeat + i * 3) % 20;
      const y = 6 + (t < 10 ? t : 20 - t);
      return y;
    };

    return (
      <div className="flex items-center justify-center py-2" aria-label="Animated person">
        <div className={cn('relative w-72 max-w-full', variant === 'music' ? 'pt-2' : '')}>
          <div className={cn('mx-auto w-full max-w-md aspect-square rounded-full bg-muted/20 border border-border', 'flex items-center justify-center')}>
            <svg
              viewBox="0 0 360 360"
              className={cn(
                'w-full h-full transition-transform duration-700 ease-in-out',
                breathe,
                push,
                bob
              )}
              aria-label="Character"
            >
              {/* Shadow */}
              <ellipse cx="180" cy="285" rx="110" ry="26" fill="currentColor" opacity="0.06" />

              {/* Body (uses foreground shades only) */}
              <g fill="currentColor" className="text-foreground">
                {/* Head */}
                <circle cx="180" cy="120" r="28" opacity="0.65" />
                {/* Hair */}
                <path
                  d="M155 120c3-20 20-32 40-32 19 0 34 11 40 28-9-6-20-10-40-10-20 0-31 6-40 14z"
                  opacity="0.22"
                />

                {/* Face (closed eyes for meditate) */}
                {variant === 'meditate' ? (
                  <>
                    <path d="M168 122c6 4 12 4 18 0" stroke="currentColor" strokeOpacity="0.28" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <path d="M195 122c6 4 12 4 18 0" stroke="currentColor" strokeOpacity="0.28" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <path d="M175 138c4 3 8 3 12 0" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <circle cx="170" cy="124" r="3" opacity="0.25" />
                    <circle cx="196" cy="124" r="3" opacity="0.25" />
                    <path d="M176 138c4 3 8 3 12 0" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </>
                )}

                {/* Torso */}
                <path d="M150 152c8-10 22-16 30-16s22 6 30 16l-8 56h-44l-8-56z" opacity="0.5" />

                {/* Arms */}
                {variant === 'pushup' ? (
                  <>
                    <path d="M145 186c-22 12-38 30-44 52" opacity="0.35" />
                    <path d="M215 186c22 12 38 30 44 52" opacity="0.35" />
                    <path d="M102 238c8 5 14 5 22 0" opacity="0.25" />
                    <path d="M236 238c8 5 14 5 22 0" opacity="0.25" />
                  </>
                ) : (
                  <>
                    <path d="M150 176c-26 12-42 30-52 52" opacity="0.28" />
                    <path d="M210 176c26 12 42 30 52 52" opacity="0.28" />
                  </>
                )}

                {/* Legs */}
                {variant === 'meditate' ? (
                  <>
                    <path d="M138 228c20 18 44 18 84 0" opacity="0.26" />
                    <path d="M132 248c30 22 66 22 96 0" opacity="0.18" />
                  </>
                ) : variant === 'pushup' ? (
                  <>
                    {/* Straight-body pushup line */}
                    <path d="M130 230c32-10 68-10 100 0" opacity="0.32" />
                    <path d="M118 252c42-10 82-10 124 0" opacity="0.18" />
                  </>
                ) : (
                  <>
                    <path d="M140 236c18 18 62 18 80 0" opacity="0.22" />
                  </>
                )}
              </g>

              {/* Accent ring for meditate breathing */}
              {variant === 'meditate' && (
                <circle
                  cx="180"
                  cy="180"
                  r="140"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  opacity={breathIn ? 0.22 : 0.12}
                  strokeWidth="4"
                />
              )}

              {/* Headphones + music notes */}
              {variant === 'music' && (
                <g className="text-primary" fill="currentColor" opacity="0.22">
                  <path d="M150 112c6-18 20-30 30-30s24 12 30 30" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                  <rect x="138" y="112" width="16" height="30" rx="8" />
                  <rect x="206" y="112" width="16" height="30" rx="8" />
                </g>
              )}

              {variant === 'music' && (
                <g className="text-primary" fill="currentColor" opacity="0.55">
                  <text x="70" y={90 - noteOffset(0)} fontSize="22">♪</text>
                  <text x="95" y={120 - noteOffset(1)} fontSize="18">♫</text>
                  <text x="260" y={92 - noteOffset(2)} fontSize="20">♪</text>
                  <text x="238" y={122 - noteOffset(3)} fontSize="18">♫</text>
                </g>
              )}
            </svg>
          </div>

          {variant === 'pushup' && (
            <div className="mt-2 text-center text-xs text-muted-foreground">
              Keep a straight line: head → hips → heels. Hands under shoulders.
            </div>
          )}
          {variant === 'music' && (
            <div className="mt-2 text-center text-xs text-muted-foreground">Put on headphones and focus for 60s.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <FullScreenShell open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <div className="h-full w-full bg-background text-foreground">
        <audio
          ref={audioElRef}
          onEnded={() => setPlayingIndex(null)}
        />
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Body Active</div>
                <div className="text-xs text-muted-foreground">Reset your energy</div>
              </div>
            </div>

            <button
              onClick={close}
              className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 px-5 py-6">
            {mode === 'choose' && (
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-lg font-semibold text-center">Pick one</div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('meditation')}
                    className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      <div className="font-medium">Meditation</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">10 minutes calm breathing</div>
                  </button>

                  <button
                    onClick={() => setMode('pushups')}
                    className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary" />
                      <div className="font-medium">Pushups</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Quick reps</div>
                  </button>

                  <button
                    onClick={() => setMode('music')}
                    className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-primary" />
                      <div className="font-medium">Music</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Get in the zone</div>
                  </button>

                  <button
                    onClick={() => setMode('quotes')}
                    className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Quote className="w-5 h-5 text-primary" />
                      <div className="font-medium">Quotes</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Instant motivation</div>
                  </button>
                </div>
              </div>
            )}

            {mode === 'meditation' && (
              <div className="relative h-full -mx-5 -my-6">
                <div className="absolute inset-0">
                  <video
                    src="/reminders/meditation.mp4"
                    className="w-full h-full object-contain opacity-60"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>

                <div className="relative z-10 h-full px-5 py-6 flex flex-col items-center justify-center">
                  <div className="w-full max-w-md space-y-4 text-center">
                    <div className="text-lg font-semibold">Meditation</div>
                    <div className="text-sm text-muted-foreground">Breathe slowly. Let your shoulders drop.</div>

                    <div className="mx-auto w-fit px-4 py-2 rounded-xl bg-background/70 border border-border">
                      <div className="text-4xl font-semibold tabular-nums">{formatTime(Math.max(0, meditationSeconds))}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {!meditationRunning ? (
                        <button
                          onClick={async () => {
                            if (soundEnabled) await beep({ frequencyHz: 440, durationMs: 120, gain: 0.04 });
                            if (soundEnabled && !ambientRef.current) {
                              // Ocean-like calm bed (also hints of rain/waterfall via noise shaping).
                              ambientRef.current = await startAmbient('ocean', { musicBed: true, musicLevel: 0.014 });
                            }
                            startMeditation();
                          }}
                          className="h-12 rounded-xl bg-primary text-primary-foreground font-medium"
                        >
                          Start
                        </button>
                      ) : (
                        <button
                          onClick={() => stopMeditation()}
                          className="h-12 rounded-xl border border-border bg-background/80 hover:bg-background font-medium"
                        >
                          Pause
                        </button>
                      )}

                      <button
                        onClick={() => {
                          stopMeditation();
                          setMeditationSeconds(10 * 60);
                        }}
                        className="h-12 rounded-xl bg-muted/80 text-foreground hover:bg-muted font-medium"
                      >
                        Reset
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        stopMeditation();
                        setMode('choose');
                        setMeditationSeconds(10 * 60);
                      }}
                      className="w-full h-11 rounded-xl bg-background/70 hover:bg-background border border-border text-foreground"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'pushups' && (
              <div className="relative h-full -mx-5 -my-6">
                <div className="absolute inset-0">
                  <video
                    src="/reminders/pushup.mp4"
                    className="w-full h-full object-contain opacity-60"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>

                <div className="relative z-10 h-full px-5 py-6 flex flex-col items-center justify-center">
                  <div className="w-full max-w-md space-y-4 text-center">
                    <div className="text-lg font-semibold">Pushups</div>
                    <div className="text-sm text-muted-foreground">Do clean reps. Stop if painful.</div>

                    <div className="mx-auto w-fit px-4 py-2 rounded-xl bg-background/70 border border-border">
                      <div className="text-5xl font-semibold tabular-nums">{pushupsRemaining}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={async () => {
                          const next = Math.max(0, pushupsRemaining - 1);
                          setPushupsRemaining(next);
                          if (soundEnabled) await beep({ frequencyHz: 300, durationMs: 50, gain: 0.03, type: 'square' });
                        }}
                        className="h-12 rounded-xl bg-primary text-primary-foreground font-medium"
                      >
                        Rep Done
                      </button>

                      <button
                        onClick={() => setPushupsRemaining(15)}
                        className="h-12 rounded-xl bg-muted/80 text-foreground hover:bg-muted font-medium"
                      >
                        Reset
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setMode('choose');
                        setPushupsRemaining(15);
                      }}
                      className="w-full h-11 rounded-xl bg-background/70 hover:bg-background border border-border text-foreground"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'music' && (
              <div className="relative h-full -mx-5 -my-6">
                <div className="absolute inset-0">
                  <img
                    src="/reminders/music.jpg"
                    alt="Music"
                    className="w-full h-full object-contain opacity-60"
                  />
                </div>

                <div className="relative z-10 h-full px-5 py-6 flex flex-col items-center justify-center">
                  <div className="w-full max-w-md space-y-4 text-center">
                    <div className="text-lg font-semibold">Music</div>
                    <div className="text-sm text-muted-foreground">
                      Add your top 5 motivational tracks (URLs) and play them here.
                    </div>

                    <div className="text-left rounded-xl border border-border bg-background/70 p-3 space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Tip: you can place mp3 files in `public/music/` and use a URL like `/music/track1.mp3`.
                      </div>

                      {tracks.map((t, idx) => (
                        <div key={idx} className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-muted-foreground w-5">{idx + 1}.</div>
                            <input
                              value={t.title}
                              onChange={(e) => {
                                const next = [...tracks];
                                next[idx] = { ...next[idx], title: e.target.value };
                                setTracks(next);
                              }}
                              placeholder="Track title"
                              className="flex-1 h-9 rounded-lg border border-border bg-background/80 px-3 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5" />
                            <input
                              value={t.url}
                              onChange={(e) => {
                                const next = [...tracks];
                                next[idx] = { ...next[idx], url: e.target.value };
                                setTracks(next);
                              }}
                              placeholder="Track URL (e.g. /music/song.mp3 or https://...)"
                              className="flex-1 h-9 rounded-lg border border-border bg-background/80 px-3 text-sm"
                            />
                            <button
                              onClick={async () => {
                                const url = tracks[idx]?.url?.trim();
                                if (!url) return;
                                if (!audioElRef.current) return;

                                // Must be user-gesture initiated.
                                try {
                                  if (playingIndex === idx) {
                                    audioElRef.current.pause();
                                    setPlayingIndex(null);
                                    return;
                                  }

                                  audioElRef.current.src = url;
                                  await audioElRef.current.play();
                                  setPlayingIndex(idx);

                                  if (soundEnabled) {
                                    await beep({ frequencyHz: 220, durationMs: 80, gain: 0.03, type: 'sine' });
                                  }
                                } catch {
                                  setPlayingIndex(null);
                                }
                              }}
                              className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm"
                            >
                              {playingIndex === idx ? 'Pause' : 'Play'}
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          localStorage.setItem('motivationalTracks', JSON.stringify(tracks));
                        }}
                        className="w-full h-10 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-sm"
                      >
                        Save list
                      </button>
                    </div>

                    <button
                      onClick={async () => {
                        if (soundEnabled) {
                          await beep({ frequencyHz: 180, durationMs: 90, gain: 0.04, type: 'sawtooth' });
                          await beep({ frequencyHz: 260, durationMs: 90, gain: 0.04, type: 'sawtooth' });
                        }
                      }}
                      className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium"
                    >
                      Start (focus)
                    </button>

                    <button
                      onClick={() => setMode('choose')}
                      className="w-full h-11 rounded-xl bg-background/70 hover:bg-background border border-border text-foreground"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'quotes' && (
              <div className="max-w-md mx-auto space-y-4 text-center">
                <div className="text-lg font-semibold">Quotes</div>

                <div className="p-5 rounded-xl border border-border bg-muted/30 text-base">
                  "{quotes[quoteIndex]?.text}"
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      const next = (quoteIndex + 1) % quotes.length;
                      setQuoteIndex(next);
                      if (soundEnabled) await beep({ frequencyHz: 600, durationMs: 90, gain: 0.04 });
                    }}
                    className="h-12 rounded-xl bg-primary text-primary-foreground font-medium"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setQuoteIndex(0)}
                    className="h-12 rounded-xl bg-muted text-foreground hover:bg-muted/80 font-medium"
                  >
                    Reset
                  </button>
                </div>

                <button
                  onClick={() => {
                    setMode('choose');
                    setQuoteIndex(0);
                  }}
                  className="w-full h-11 rounded-xl bg-muted/50 hover:bg-muted text-foreground"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </FullScreenShell>
  );
}
