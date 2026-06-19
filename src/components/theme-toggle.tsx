import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-muted-foreground shadow-glass backdrop-blur-2xl transition-all duration-200 hover:border-primary/20 hover:text-primary hover:shadow-glow sm:left-6 sm:top-6 sm:h-10 sm:w-10"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      ) : (
        <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      )}
    </button>
  );
}
