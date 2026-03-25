import { Moon, SunMedium } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button type="button" onClick={toggleTheme} className="btn-ghost h-11 w-11 rounded-2xl" aria-label="Toggle theme">
      {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
    </button>
  );
}
