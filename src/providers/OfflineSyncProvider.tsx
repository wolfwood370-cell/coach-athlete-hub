import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineContextValue {
  isOnline: boolean;
  /** Returns true if online, shows toast and returns false if offline */
  requireOnline: (actionName?: string) => boolean;
}

const OfflineContext = createContext<OfflineContextValue>({ 
  isOnline: true,
  requireOnline: () => true,
});

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const { toast } = useToast();

  // Gatekeeper function for coach actions
  const requireOnline = useCallback((actionName?: string): boolean => {
    if (navigator.onLine) return true;
    
    toast({
      title: "Connessione richiesta",
      description: actionName 
        ? `${actionName} non disponibile offline.`
        : "Questa azione richiede una connessione internet.",
      variant: "destructive",
    });
    return false;
  }, [toast]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Sei online",
        description: "Sincronizzazione in corso...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Sei offline",
        description: "Solo il salvataggio workout è disponibile.",
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
    <OfflineContext.Provider value={{ isOnline, requireOnline }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineStatus() {
  return useContext(OfflineContext);
}

// Warning banner for features disabled offline
export function OfflineWarningBanner({ feature }: { feature: string }) {
  const { isOnline } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
      <strong>Sei offline.</strong> {feature} non è disponibile senza connessione.
    </div>
  );
}

// Read-only overlay for coach features when offline
export function OfflineReadOnlyOverlay({ children, feature }: { children: React.ReactNode; feature: string }) {
  const { isOnline } = useOfflineStatus();

  if (isOnline) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center p-4">
          <p className="text-muted-foreground font-medium">Modalità solo lettura</p>
          <p className="text-sm text-muted-foreground">{feature} richiede connessione</p>
        </div>
      </div>
    </div>
  );
}
