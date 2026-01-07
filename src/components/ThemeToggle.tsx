import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
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
