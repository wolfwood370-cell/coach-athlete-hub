import { useEffect, useRef, useCallback } from "react";

export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    if (!("wakeLock" in navigator)) {
      console.warn("Wake Lock API not supported");
      return;
    }
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      wakeLockRef.current.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
    } catch (err) {
      console.warn("Wake Lock request failed:", err);
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  // Re-acquire on visibility change (e.g. user switches back to tab)
  useEffect(() => {
    if (!active) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && active && !wakeLockRef.current) {
        request();
      }
    };

    request();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      release();
    };
  }, [active, request, release]);

  return { isSupported: "wakeLock" in navigator };
}
