import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

const ThemeToggle = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const isDark = mode === 'dark' || (mode === 'system' && systemIsDark);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    try {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    } catch {
      // Safari/old Chromium
      // @ts-expect-error legacy
      mq.addListener(onChange);
      return () => {
        // @ts-expect-error legacy
        mq.removeListener(onChange);
      };
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');

    // Only persist when user explicitly overrides.
    if (mode === 'light' || mode === 'dark') {
      localStorage.setItem('theme', mode);
    } else {
      localStorage.removeItem('theme');
    }
  }, [isDark, mode]);

  return (
    <button
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      className="p-2.5 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 border-2 border-border/50 hover:border-accent hover:from-accent/30 hover:to-primary/30 hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 hover:scale-110 active:scale-95 ripple group"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-accent transition-all duration-500 group-hover:rotate-180 group-hover:scale-110 drop-shadow-md" />
      ) : (
        <Moon className="w-5 h-5 text-primary transition-all duration-500 group-hover:rotate-[20deg] group-hover:scale-110 drop-shadow-md" />
      )}
    </button>
  );
};

export default ThemeToggle;
