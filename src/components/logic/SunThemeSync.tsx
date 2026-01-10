import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSunTheme } from '@/hooks/useSunTheme';

export function SunThemeSync() {
  const { setTheme, theme } = useTheme();
  const { currentTheme } = useSunTheme();

  useEffect(() => {
    // Only sync if user hasn't manually overridden (check localStorage)
    const manualOverride = localStorage.getItem('theme-manual-override');
    if (!manualOverride) {
      setTheme(currentTheme);
    }
  }, [currentTheme, setTheme]);

  // This component doesn't render anything
  return null;
}
