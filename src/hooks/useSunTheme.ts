import { useState, useEffect, useCallback } from 'react';
import SunCalc from 'suncalc';

interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

interface UseSunThemeReturn {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  currentTheme: 'light' | 'dark';
  sunTimes: SunTimes | null;
  locationStatus: 'pending' | 'granted' | 'denied' | 'unavailable';
}

const STORAGE_KEY = 'sun-theme-enabled';
const FALLBACK_SUNRISE_HOUR = 6;
const FALLBACK_SUNSET_HOUR = 19;
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export function useSunTheme(): UseSunThemeReturn {
  const [isEnabled, setIsEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });
  
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | 'unavailable'>('pending');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  const setIsEnabled = useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, []);

  // Calculate fallback times
  const getFallbackTimes = useCallback((): SunTimes => {
    const now = new Date();
    const sunrise = new Date(now);
    sunrise.setHours(FALLBACK_SUNRISE_HOUR, 0, 0, 0);
    
    const sunset = new Date(now);
    sunset.setHours(FALLBACK_SUNSET_HOUR, 0, 0, 0);
    
    return { sunrise, sunset };
  }, []);

  // Determine theme based on current time and sun times
  const calculateTheme = useCallback((times: SunTimes): 'light' | 'dark' => {
    const now = new Date();
    const isAfterSunset = now >= times.sunset;
    const isBeforeSunrise = now < times.sunrise;
    
    return (isAfterSunset || isBeforeSunrise) ? 'dark' : 'light';
  }, []);

  // Request geolocation and calculate sun times
  useEffect(() => {
    if (!isEnabled) return;

    const updateSunTimes = (latitude: number, longitude: number) => {
      const times = SunCalc.getTimes(new Date(), latitude, longitude);
      setSunTimes({
        sunrise: times.sunrise,
        sunset: times.sunset,
      });
    };

    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      setSunTimes(getFallbackTimes());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus('granted');
        updateSunTimes(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocationStatus('denied');
        setSunTimes(getFallbackTimes());
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [isEnabled, getFallbackTimes]);

  // Update theme based on sun times
  useEffect(() => {
    if (!isEnabled || !sunTimes) return;

    const updateTheme = () => {
      const theme = calculateTheme(sunTimes);
      setCurrentTheme(theme);
    };

    updateTheme();

    // Check every 15 minutes
    const intervalId = setInterval(updateTheme, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isEnabled, sunTimes, calculateTheme]);

  return {
    isEnabled,
    setIsEnabled,
    currentTheme,
    sunTimes,
    locationStatus,
  };
}
