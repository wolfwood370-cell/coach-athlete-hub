import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineContextValue {
  isOnline: boolean;
}

const OfflineContext = createContext<OfflineContextValue>({ isOnline: true });

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Sei online",
        description: "Sincronizzazione workout in corso...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Sei offline",
        description: "I workout verranno salvati localmente.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return (
    <OfflineContext.Provider value={{ isOnline }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineStatus() {
  return useContext(OfflineContext);
}

// Simple offline warning banner for features that don't work offline
export function OfflineWarningBanner({ feature }: { feature: string }) {
  const { isOnline } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
      <strong>Sei offline.</strong> {feature} non è disponibile senza connessione.
    </div>
  );
}
