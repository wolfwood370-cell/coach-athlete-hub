import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSunTheme } from '@/hooks/useSunTheme';

export function SunThemeSync() {
  const { setTheme } = useTheme();
  const { isEnabled, currentTheme } = useSunTheme();

  useEffect(() => {
    if (isEnabled) {
      setTheme(currentTheme);
    }
  }, [isEnabled, currentTheme, setTheme]);

  // This component doesn't render anything
  return null;
}
